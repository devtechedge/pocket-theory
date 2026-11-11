import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import {
  coupons,
  inventoryMovements,
  orderItems,
  orders,
  payments,
  products,
  productVariants,
  returnRequests,
  storeSettings,
  type PaymentProvider,
  type ShippingAddressSnapshot,
  type ShippingMethod,
} from "@/db/schema";
import { isProductPubliclyVisible } from "@/domains/compliance/gate";
import {
  sendOrderCancelledEmail,
  sendOrderConfirmationEmail,
} from "@/domains/notifications/email";
import { initializePaymentSession } from "@/domains/payments/adapters";
import { calculateCartPricing } from "@/domains/pricing/calculator";
import { isValidIndianPin } from "@/domains/shipping/pin-service";
import { isDemoMode } from "@/env";
import { computeInclusiveGstBreakup } from "@/lib/money";

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutValidationError";
  }
}

export interface CreateOrderInput {
  idempotencyKey: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  buyerGstin?: string | null;
  shippingAddress: ShippingAddressSnapshot;
  shippingMethod: ShippingMethod;
  couponCode?: string | null;
  requestedProvider?: PaymentProvider;
  items: ReadonlyArray<{ variantId: string; quantity: number }>;
}

export async function createOrderFromCheckout(
  input: CreateOrderInput,
  explicitDb?: Database,
) {
  const db = explicitDb ?? (await getDb());
  const demoMode = isDemoMode();

  if (!input.idempotencyKey.trim()) {
    throw new CheckoutValidationError("Missing checkout idempotency key.");
  }
  if (!isValidIndianPin(input.shippingAddress.pinCode)) {
    throw new CheckoutValidationError(
      "Enter a valid 6-digit Indian PIN code.",
    );
  }
  if (!/^[6-9]\d{9}$/.test(input.customerPhone.trim())) {
    throw new CheckoutValidationError(
      "Enter a valid 10-digit Indian mobile number.",
    );
  }
  if (input.items.length === 0) {
    throw new CheckoutValidationError("Your cart is empty.");
  }

  // Check global operational pause switch
  const [pauseSetting] = await db
    .select()
    .from(storeSettings)
    .where(eq(storeSettings.key, "checkout_enabled"))
    .limit(1);
  if (
    pauseSetting &&
    pauseSetting.valueJson &&
    pauseSetting.valueJson.enabled === false
  ) {
    throw new CheckoutValidationError(
      "Checkout is temporarily paused by store operations.",
    );
  }

  // Fast-path idempotent replay check before transaction
  const [existingByKey] = await db
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, input.idempotencyKey.trim()))
    .limit(1);

  if (existingByKey) {
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, existingByKey.id))
      .limit(1);
    return {
      order: existingByKey,
      payment: existingPayment ?? null,
      deduplicated: true,
    };
  }

  // Transactional atomic inventory reservation + server-side price/tax calculation
  const created = await db.transaction(async (tx) => {
    // Re-check idempotency inside transaction boundary
    const [raceExisting] = await tx
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey.trim()))
      .limit(1);
    if (raceExisting) {
      const [existingPayment] = await tx
        .select()
        .from(payments)
        .where(eq(payments.orderId, raceExisting.id))
        .limit(1);
      return {
        order: raceExisting,
        payment: existingPayment ?? null,
        deduplicated: true,
      };
    }

    const resolvedLines: Array<{
      product: typeof products.$inferSelect;
      variant: typeof productVariants.$inferSelect;
      quantity: number;
      unitPricePaise: number;
      balanceAfter: number;
    }> = [];

    // Sort variant IDs deterministically to prevent deadlocks under concurrent orders
    const sortedInputItems = [...input.items].sort((a, b) =>
      a.variantId.localeCompare(b.variantId),
    );

    for (const reqItem of sortedInputItems) {
      if (!Number.isSafeInteger(reqItem.quantity) || reqItem.quantity <= 0 || reqItem.quantity > 10) {
        throw new CheckoutValidationError("Quantity per item must be between 1 and 10.");
      }

      const [vRow] = await tx
        .select({ variant: productVariants, product: products })
        .from(productVariants)
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(eq(productVariants.id, reqItem.variantId))
        .limit(1);

      if (!vRow || !isProductPubliclyVisible(vRow.product, { demoMode })) {
        throw new CheckoutValidationError(
          "One or more items in your cart are no longer available for purchase.",
        );
      }

      // Atomic conditional stock decrement prevents overselling under concurrency
      const updated = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${reqItem.quantity}` })
        .where(
          and(
            eq(productVariants.id, reqItem.variantId),
            sql`${productVariants.stock} >= ${reqItem.quantity}`,
          ),
        )
        .returning({ newStock: productVariants.stock });

      if (!updated[0]) {
        throw new InsufficientStockError(
          `Insufficient stock for ${vRow.product.title} (${vRow.variant.label}).`,
        );
      }

      resolvedLines.push({
        product: vRow.product,
        variant: vRow.variant,
        quantity: reqItem.quantity,
        unitPricePaise:
          vRow.variant.priceOverridePaise ?? vRow.product.pricePaise,
        balanceAfter: updated[0].newStock,
      });
    }

    let couponRow = null;
    if (input.couponCode?.trim()) {
      const [found] = await tx
        .select()
        .from(coupons)
        .where(eq(coupons.code, input.couponCode.trim().toUpperCase()))
        .limit(1);
      couponRow = found ?? null;
    }

    const pricing = calculateCartPricing({
      lines: resolvedLines.map((l) => ({
        variantId: l.variant.id,
        unitPricePaise: l.unitPricePaise,
        quantity: l.quantity,
        gstRateBps: l.product.gstRateBps,
      })),
      coupon: couponRow,
      shippingMethod: input.shippingMethod,
      destinationStateCode: input.shippingAddress.stateCode,
    });

    if (pricing.appliedCouponCode && couponRow) {
      await tx
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, couponRow.id));
    }

    const orderId = `ord-${randomBytes(10).toString("hex")}`;
    const randomDigits = String(10000 + Math.floor(Math.random() * 89999));
    const orderNumber = `PT-2026-${randomDigits}`;

    const paymentInit = await initializePaymentSession({
      orderNumber,
      amountPaise: pricing.grandTotalPaise,
      requestedProvider: input.requestedProvider,
    });

    const [insertedOrder] = await tx
      .insert(orders)
      .values({
        id: orderId,
        orderNumber,
        idempotencyKey: input.idempotencyKey.trim(),
        userId: input.userId ?? null,
        customerEmail: input.customerEmail.trim().toLowerCase(),
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        buyerGstin: input.buyerGstin?.trim().toUpperCase() || null,
        shippingAddressJson: input.shippingAddress,
        shippingStateCode: input.shippingAddress.stateCode,
        shippingPinCode: input.shippingAddress.pinCode,
        shippingMethod: input.shippingMethod,
        subtotalPaise: pricing.subtotalPaise,
        discountPaise: pricing.discountPaise,
        couponCode: pricing.appliedCouponCode,
        shippingPaise: pricing.shippingPaise,
        taxableAmountPaise: pricing.gst.taxableValuePaise,
        cgstPaise: pricing.gst.cgstPaise,
        sgstPaise: pricing.gst.sgstPaise,
        igstPaise: pricing.gst.igstPaise,
        totalTaxPaise: pricing.gst.totalTaxPaise,
        grandTotalPaise: pricing.grandTotalPaise,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        paymentProvider: paymentInit.provider,
        isDemoOrder: paymentInit.isDemo,
      })
      .returning();

    for (const line of resolvedLines) {
      const lineTotal = line.unitPricePaise * line.quantity;
      const lineGst = computeInclusiveGstBreakup(
        lineTotal,
        line.product.gstRateBps,
        input.shippingAddress.stateCode,
      );

      await tx.insert(orderItems).values({
        id: `oi-${randomBytes(10).toString("hex")}`,
        orderId,
        productId: line.product.id,
        variantId: line.variant.id,
        productSlug: line.product.slug,
        productTitle: line.product.title,
        sku: line.variant.sku,
        variantLabel: line.variant.label,
        imageUrl:
          line.product.images?.[0]?.url ??
          `/products/${line.product.slug}-front.svg`,
        hsnCode: line.product.hsnCode,
        gstRateBps: line.product.gstRateBps,
        quantity: line.quantity,
        unitPricePaise: line.unitPricePaise,
        lineTotalPaise: lineTotal,
        taxAmountPaise: lineGst.totalTaxPaise,
        warrantyMonths: line.product.warrantyMonths,
        returnWindowDays: line.product.returnWindowDays,
      });

      await tx.insert(inventoryMovements).values({
        id: `mov-${randomBytes(10).toString("hex")}`,
        variantId: line.variant.id,
        orderId,
        actorUserId: input.userId ?? null,
        delta: -line.quantity,
        balanceAfter: line.balanceAfter,
        reason: "ORDER_RESERVE",
        note: `Reserved for order ${orderNumber}`,
      });
    }

    const [insertedPayment] = await tx
      .insert(payments)
      .values({
        id: `pay-${randomBytes(10).toString("hex")}`,
        orderId,
        provider: paymentInit.provider,
        providerOrderId: paymentInit.providerOrderId,
        amountPaise: pricing.grandTotalPaise,
        currency: "INR",
        status: "PENDING",
        isDemo: paymentInit.isDemo,
        signatureVerified: false,
      })
      .returning();

    return {
      order: insertedOrder!,
      payment: insertedPayment!,
      paymentInit,
      deduplicated: false,
    };
  });

  return created;
}

/**
 * Completes a non-charging demo payment step. Never marks an order as real 'PAID';
 * explicitly uses DEMO_AUTHORIZED + DEMO_CONFIRMED, or releases stock on FAILED.
 */
export async function completeDemoPaymentForOrder(
  params: {
    orderId: string;
    outcome: "AUTHORIZE_DEMO" | "FAIL_DEMO";
  },
  explicitDb?: Database,
) {
  const db = explicitDb ?? (await getDb());

  const updated = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, params.orderId))
      .limit(1);

    if (!order) {
      throw new CheckoutValidationError("Order not found.");
    }
    if (!order.isDemoOrder || order.paymentProvider !== "DEMO_SANDBOX") {
      throw new CheckoutValidationError(
        "Demo payment completion is forbidden on live gateway orders.",
      );
    }
    if (order.paymentStatus === "DEMO_AUTHORIZED") {
      return order;
    }

    if (params.outcome === "FAIL_DEMO") {
      if (order.paymentStatus !== "FAILED" && order.status !== "CANCELLED") {
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        for (const item of items) {
          if (!item.variantId) continue;
          const [restored] = await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(eq(productVariants.id, item.variantId))
            .returning({ stock: productVariants.stock });

          if (restored) {
            await tx.insert(inventoryMovements).values({
              id: `mov-${randomBytes(10).toString("hex")}`,
              variantId: item.variantId,
              orderId: order.id,
              delta: item.quantity,
              balanceAfter: restored.stock,
              reason: "PAYMENT_FAIL_RELEASE",
              note: `Released after simulated demo payment failure on ${order.orderNumber}`,
            });
          }
        }

        await tx
          .update(payments)
          .set({
            status: "FAILED",
            failureReason: "Customer simulated demo payment failure",
            updatedAt: new Date(),
          })
          .where(eq(payments.orderId, order.id));

        const [failedOrder] = await tx
          .update(orders)
          .set({
            status: "CANCELLED",
            paymentStatus: "FAILED",
            cancelledAt: new Date(),
            cancelReason: "Simulated demo payment failure",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id))
          .returning();
        return failedOrder!;
      }
      return order;
    }

    await tx
      .update(payments)
      .set({
        status: "DEMO_AUTHORIZED",
        providerPaymentId: `demo_pay_${randomBytes(6).toString("hex")}`,
        isDemo: true,
        signatureVerified: false,
        rawMetaJson: {
          sandbox: true,
          note: "Non-charging demo payment completed",
        },
        updatedAt: new Date(),
      })
      .where(eq(payments.orderId, order.id));

    const [confirmedOrder] = await tx
      .update(orders)
      .set({
        status: "DEMO_CONFIRMED",
        paymentStatus: "DEMO_AUTHORIZED",
        isDemoOrder: true,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning();

    return confirmedOrder!;
  });

  if (updated.status === "DEMO_CONFIRMED" && !explicitDb) {
    await sendOrderConfirmationEmail({
      toEmail: updated.customerEmail,
      customerName: updated.customerName,
      orderNumber: updated.orderNumber,
      grandTotalPaise: updated.grandTotalPaise,
      isDemoOrder: true,
    }).catch(() => undefined);
  }

  return updated;
}

/**
 * Marks an order PAID only after cryptographic signature verification from Razorpay or Stripe.
 */
export async function markVerifiedGatewayOrderPaid(params: {
  provider: "RAZORPAY" | "STRIPE";
  providerOrderId: string;
  providerPaymentId: string;
  explicitDb?: Database;
}) {
  const db = params.explicitDb ?? (await getDb());

  const [pay] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.provider, params.provider),
        eq(payments.providerOrderId, params.providerOrderId),
      ),
    )
    .limit(1);

  if (!pay) {
    throw new CheckoutValidationError("Matching payment record not found.");
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, pay.orderId))
    .limit(1);

  if (!order) {
    throw new CheckoutValidationError("Associated order not found.");
  }
  if (order.paymentStatus === "PAID") {
    return order;
  }

  await db
    .update(payments)
    .set({
      status: "PAID",
      providerPaymentId: params.providerPaymentId,
      isDemo: false,
      signatureVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, pay.id));

  const [paidOrder] = await db
    .update(orders)
    .set({
      status: "CONFIRMED",
      paymentStatus: "PAID",
      isDemoOrder: false,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))
    .returning();

  if (paidOrder && !params.explicitDb) {
    await sendOrderConfirmationEmail({
      toEmail: paidOrder.customerEmail,
      customerName: paidOrder.customerName,
      orderNumber: paidOrder.orderNumber,
      grandTotalPaise: paidOrder.grandTotalPaise,
      isDemoOrder: false,
    }).catch(() => undefined);
  }

  return paidOrder!;
}

export async function getOrderWithDetails(orderNumberOrId: string) {
  const db = await getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(
      orderNumberOrId.startsWith("PT-")
        ? eq(orders.orderNumber, orderNumberOrId)
        : eq(orders.id, orderNumberOrId),
    )
    .limit(1);

  if (!order) return null;

  const [items, paymentRows, returnsRows] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, order.id)),
    db.select().from(payments).where(eq(payments.orderId, order.id)),
    db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.orderId, order.id))
      .orderBy(desc(returnRequests.createdAt)),
  ]);

  return {
    order,
    items,
    payments: paymentRows,
    returns: returnsRows,
  };
}

export async function lookupOrderForGuest(params: {
  orderNumber: string;
  contactVerifier: string;
}) {
  const detail = await getOrderWithDetails(params.orderNumber.trim().toUpperCase());
  if (!detail) return null;

  const cleanInput = params.contactVerifier.trim().toLowerCase();
  const emailMatch =
    detail.order.customerEmail.toLowerCase().length === cleanInput.length &&
    timingSafeEqual(
      Buffer.from(detail.order.customerEmail.toLowerCase()),
      Buffer.from(cleanInput),
    );

  const digitsInput = cleanInput.replace(/\D/g, "").slice(-10);
  const orderDigits = detail.order.customerPhone.replace(/\D/g, "").slice(-10);
  const phoneMatch =
    digitsInput.length === 10 &&
    orderDigits.length === 10 &&
    timingSafeEqual(Buffer.from(orderDigits), Buffer.from(digitsInput));

  if (!emailMatch && !phoneMatch) {
    return null;
  }

  return {
    orderNumber: detail.order.orderNumber,
    status: detail.order.status,
    paymentStatus: detail.order.paymentStatus,
    isDemoOrder: detail.order.isDemoOrder,
    createdAt: detail.order.createdAt,
    shippingCity: detail.order.shippingAddressJson.city,
    shippingState: detail.order.shippingAddressJson.stateName,
    shippingPinCode: detail.order.shippingPinCode,
    carrierName: detail.order.carrierName,
    trackingNumber: detail.order.trackingNumber,
    grandTotalPaise: detail.order.grandTotalPaise,
    items: detail.items.map((i) => ({
      productTitle: i.productTitle,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      lineTotalPaise: i.lineTotalPaise,
    })),
  };
}

export async function cancelOrderWithStockRelease(params: {
  orderId: string;
  actorUserId: string | null;
  reason: string;
}) {
  const db = await getDb();

  const cancelled = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, params.orderId))
      .limit(1);

    if (!order) {
      throw new CheckoutValidationError("Order not found.");
    }
    if (
      order.status === "SHIPPED" ||
      order.status === "DELIVERED" ||
      order.status === "CANCELLED"
    ) {
      throw new CheckoutValidationError(
        `Order in ${order.status} status cannot be cancelled directly.`,
      );
    }

    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      if (!item.variantId) continue;
      const [restored] = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
        .where(eq(productVariants.id, item.variantId))
        .returning({ stock: productVariants.stock });

      if (restored) {
        await tx.insert(inventoryMovements).values({
          id: `mov-${randomBytes(10).toString("hex")}`,
          variantId: item.variantId,
          orderId: order.id,
          actorUserId: params.actorUserId,
          delta: item.quantity,
          balanceAfter: restored.stock,
          reason: "ORDER_CANCEL_RELEASE",
          note: `Stock restored on cancellation of ${order.orderNumber}`,
        });
      }
    }

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: params.reason.slice(0, 240),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))
      .returning();

    return updatedOrder!;
  });

  await sendOrderCancelledEmail({
    toEmail: cancelled.customerEmail,
    customerName: cancelled.customerName,
    orderNumber: cancelled.orderNumber,
    reason: params.reason,
  }).catch(() => undefined);

  return cancelled;
}
