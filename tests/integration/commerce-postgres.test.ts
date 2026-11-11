import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import {
  applySchemaToPostgresUrl,
  createFreshTestDb,
  type Database,
} from "@/db/client";
import { products, productVariants } from "@/db/schema";
import { seedDatabase } from "@/db/seeds";
import {
  cancelOrderWithStockRelease,
  CheckoutValidationError,
  completeDemoPaymentForOrder,
  createOrderFromCheckout,
  InsufficientStockError,
  markVerifiedGatewayOrderPaid,
} from "@/domains/orders/service";

let db: Database;

beforeAll(async () => {
  const extTestUrl = process.env.DATABASE_URL_TEST?.trim();
  if (extTestUrl) {
    const dbName = new URL(extTestUrl).pathname.replace(/^\//, "");
    if (!dbName.includes("test")) {
      throw new Error(
        `Refusing integration test run on non-test DB "${dbName}".`,
      );
    }
    await applySchemaToPostgresUrl(extTestUrl);
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const schema = await import("@/db/schema");
    const pool = new Pool({ connectionString: extTestUrl, max: 6 });
    db = drizzle(pool, { schema }) as unknown as Database;
  } else {
    db = await createFreshTestDb();
  }

  await seedDatabase(db, { allowNonTestDb: true });
});

describe("PostgreSQL Integration: 40-SKU Seed, Concurrency, Idempotency & Payment Honesty", () => {
  it("seeds exactly 40 active POCKET THEORY SKUs", async () => {
    const rows = await db.select().from(products);
    expect(rows).toHaveLength(40);
    const activeRows = rows.filter((r) => r.status === "ACTIVE");
    expect(activeRows).toHaveLength(40);
  });

  it("enforces checkout idempotency so duplicate submissions never double-reserve stock", async () => {
    const [beforeVar] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var-009-a"));
    const startStock = beforeVar!.stock;

    const payload = {
      idempotencyKey: "int-idem-key-001",
      customerEmail: "idem@pockettheory.demo",
      customerName: "Idempotency Tester",
      customerPhone: "9820011122",
      shippingMethod: "STANDARD" as const,
      shippingAddress: {
        recipientName: "Idempotency Tester",
        phone: "9820011122",
        line1: "12 Linking Road",
        city: "Mumbai",
        stateName: "Maharashtra",
        stateCode: "27",
        pinCode: "400050",
      },
      items: [{ variantId: "var-009-a", quantity: 2 }],
    };

    const first = await createOrderFromCheckout(payload, db);
    const second = await createOrderFromCheckout(payload, db);

    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.order.id).toBe(first.order.id);
    expect(second.order.orderNumber).toBe(first.order.orderNumber);

    const [afterVar] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var-009-a"));
    expect(afterVar!.stock).toBe(startStock - 2);
  });

  it("prevents overselling under 10 concurrent checkouts competing for 3 remaining units", async () => {
    await db
      .update(productVariants)
      .set({ stock: 3 })
      .where(eq(productVariants.id, "var-037-a"));

    const attempts = Array.from({ length: 10 }, (_, idx) =>
      createOrderFromCheckout(
        {
          idempotencyKey: `race-test-key-${idx}`,
          customerEmail: `racer${idx}@pockettheory.demo`,
          customerName: `Racer ${idx}`,
          customerPhone: "9820099988",
          shippingMethod: "STANDARD",
          shippingAddress: {
            recipientName: `Racer ${idx}`,
            phone: "9820099988",
            line1: "100 MG Road",
            city: "Bengaluru",
            stateName: "Karnataka",
            stateCode: "29",
            pinCode: "560001",
          },
          items: [{ variantId: "var-037-a", quantity: 1 }],
        },
        db,
      ),
    );

    const settled = await Promise.allSettled(attempts);
    const fulfilled = settled.filter((s) => s.status === "fulfilled");
    const rejected = settled.filter(
      (s): s is PromiseRejectedResult => s.status === "rejected",
    );

    expect(fulfilled).toHaveLength(3);
    expect(rejected).toHaveLength(7);
    for (const r of rejected) {
      expect(r.reason).toBeInstanceOf(InsufficientStockError);
    }

    const [finalVar] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var-037-a"));
    expect(finalVar!.stock).toBe(0);
  });

  it("marks demo payment DEMO_CONFIRMED (never PAID) and releases stock on simulated failure", async () => {
    const [vBefore] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var-010-a"));
    const baseStock = vBefore!.stock;

    const created = await createOrderFromCheckout(
      {
        idempotencyKey: "demo-honesty-auth-1",
        customerEmail: "honest@pockettheory.demo",
        customerName: "Demo Buyer",
        customerPhone: "9820044455",
        shippingMethod: "STANDARD",
        shippingAddress: {
          recipientName: "Demo Buyer",
          phone: "9820044455",
          line1: "44 FC Road",
          city: "Pune",
          stateName: "Maharashtra",
          stateCode: "27",
          pinCode: "411004",
        },
        items: [{ variantId: "var-010-a", quantity: 1 }],
      },
      db,
    );

    const confirmed = await completeDemoPaymentForOrder(
      { orderId: created.order.id, outcome: "AUTHORIZE_DEMO" },
      db,
    );
    expect(confirmed.status).toBe("DEMO_CONFIRMED");
    expect(confirmed.paymentStatus).toBe("DEMO_AUTHORIZED");
    expect(confirmed.paymentStatus).not.toBe("PAID");
    expect(confirmed.isDemoOrder).toBe(true);

    // Now simulate a failed demo payment and assert stock restoration
    const createdFail = await createOrderFromCheckout(
      {
        idempotencyKey: "demo-honesty-fail-1",
        customerEmail: "fail@pockettheory.demo",
        customerName: "Fail Buyer",
        customerPhone: "9820044456",
        shippingMethod: "STANDARD",
        shippingAddress: {
          recipientName: "Fail Buyer",
          phone: "9820044456",
          line1: "44 FC Road",
          city: "Pune",
          stateName: "Maharashtra",
          stateCode: "27",
          pinCode: "411004",
        },
        items: [{ variantId: "var-010-a", quantity: 2 }],
      },
      db,
    );

    const failed = await completeDemoPaymentForOrder(
      { orderId: createdFail.order.id, outcome: "FAIL_DEMO" },
      db,
    );
    expect(failed.status).toBe("CANCELLED");
    expect(failed.paymentStatus).toBe("FAILED");

    const [vAfter] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, "var-010-a"));
    // Only the 1 authorized unit stayed deducted; the 2 failed units were restored!
    expect(vAfter!.stock).toBe(baseStock - 1);
  });

  it("blocks unpublished / DRAFT products from checkout and verifies gateway-paid orders separately", async () => {
    await db
      .update(products)
      .set({ status: "DRAFT" })
      .where(eq(products.id, "prod-040"));

    await expect(
      createOrderFromCheckout(
        {
          idempotencyKey: "draft-block-key-1",
          customerEmail: "draft@pockettheory.demo",
          customerName: "Draft Tester",
          customerPhone: "9820033344",
          shippingMethod: "STANDARD",
          shippingAddress: {
            recipientName: "Draft Tester",
            phone: "9820033344",
            line1: "Sector 18",
            city: "Noida",
            stateName: "Uttar Pradesh",
            stateCode: "09",
            pinCode: "201301",
          },
          items: [{ variantId: "var-040-a", quantity: 1 }],
        },
        db,
      ),
    ).rejects.toThrow(CheckoutValidationError);

    // Restore prod-040 back to ACTIVE
    await db
      .update(products)
      .set({ status: "ACTIVE" })
      .where(eq(products.id, "prod-040"));

    // Verify gateway-paid path rejects non-existent provider order IDs cleanly
    await expect(
      markVerifiedGatewayOrderPaid({
        provider: "RAZORPAY",
        providerOrderId: "order_nonexistent",
        providerPaymentId: "pay_123",
        explicitDb: db,
      }),
    ).rejects.toThrow(CheckoutValidationError);

    // Verify cancelOrderWithStockRelease is exported and callable
    expect(typeof cancelOrderWithStockRelease).toBe("function");
  });
});
