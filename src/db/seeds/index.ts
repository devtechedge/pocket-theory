import { sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import {
  addresses,
  auditLogs,
  cartItems,
  carts,
  categories,
  contactInquiries,
  coupons,
  emailOutbox,
  inventoryMovements,
  newsletterSubscribers,
  orderItems,
  orders,
  payments,
  products,
  productSpecs,
  productVariants,
  rateLimitBuckets,
  returnRequests,
  sessions,
  shippingRules,
  storeSettings,
  users,
  webhookEvents,
  wishlistItems,
} from "@/db/schema";
import { evaluatePublicationGate } from "@/domains/compliance/gate";
import { hashPasswordSync } from "@/lib/crypto-password";
import { computeInclusiveGstBreakup } from "@/lib/money";
import { POWER_AND_AUDIO_PRODUCTS } from "./products-power-audio";
import { WEARABLES_DESK_AUTO_PRODUCTS } from "./products-wearables-desk-auto";
import {
  DEFAULT_CUSTOMER_CARE_CONTACT,
  DEFAULT_IMPORTER_PLACEHOLDER,
  DEFAULT_MANUFACTURER_PLACEHOLDER,
  DEMO_ACCOUNT_PASSWORD,
  SEED_CATEGORIES,
  SEED_COUPONS,
  SEED_DEMO_USERS,
  SEED_SHIPPING_RULES,
} from "./reference-data";

export const ALL_SEED_PRODUCTS = [
  ...POWER_AND_AUDIO_PRODUCTS,
  ...WEARABLES_DESK_AUTO_PRODUCTS,
];

export async function seedDatabase(
  db: Database,
  options?: { allowNonTestDb?: boolean },
): Promise<{ productCount: number; variantCount: number }> {
  if (ALL_SEED_PRODUCTS.length !== 40) {
    throw new Error(
      `Expected exactly 40 seed products, found ${ALL_SEED_PRODUCTS.length}`,
    );
  }

  const categoryIdBySlug = new Map<string, string>(
    SEED_CATEGORIES.map((c) => [c.slug, c.id]),
  );

  // Verify every single seeded SKU against the compliance publication gate up front
  for (const item of ALL_SEED_PRODUCTS) {
    const gate = evaluatePublicationGate(
      {
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        pricePaise: item.pricePaise,
        mrpPaise: item.mrpPaise,
        genericName: item.genericName,
        modelNumber: item.modelNumber,
        netQuantity: "1 N",
        countryOfOrigin:
          "India / Imported components (illustrative demo declaration - verify batch origin before live sale)",
        manufacturerDetails: DEFAULT_MANUFACTURER_PLACEHOLDER,
        importerDetails: DEFAULT_IMPORTER_PLACEHOLDER,
        customerCareContact: DEFAULT_CUSTOMER_CARE_CONTACT,
        warrantyMonths: item.warrantyMonths,
        warrantyTerms: `${item.warrantyMonths}-month carry-in/mail-in repair or replacement warranty against manufacturing defects (illustrative demo policy).`,
        requiresBisCrs: item.requiresBisCrs,
        bisRegistrationNumber: null,
        requiresWpcEta: item.requiresWpcEta,
        wpcEtaNumber: null,
        complianceStatus: item.complianceStatus ?? "DEMO_ILLUSTRATIVE",
        requestedStatus: item.status ?? "ACTIVE",
        specsText: item.specs.map((s) => `${s.specKey}: ${s.specValue}`),
      },
      { demoMode: true },
    );

    if (!gate.allowedToPublish) {
      throw new Error(
        `Seed SKU ${item.sku} (${item.title}) failed compliance gate: ${gate.reasons.join("; ")}`,
      );
    }
  }

  let variantTotal = 0;

  await db.transaction(async (tx) => {
    // Delete in strict FK dependency order for repeatable resets
    await tx.delete(returnRequests);
    await tx.delete(inventoryMovements);
    await tx.delete(payments);
    await tx.delete(orderItems);
    await tx.delete(orders);
    await tx.delete(webhookEvents);
    await tx.delete(cartItems);
    await tx.delete(carts);
    await tx.delete(wishlistItems);
    await tx.delete(addresses);
    await tx.delete(sessions);
    await tx.delete(auditLogs);
    await tx.delete(emailOutbox);
    await tx.delete(newsletterSubscribers);
    await tx.delete(contactInquiries);
    await tx.delete(rateLimitBuckets);
    await tx.delete(storeSettings);
    await tx.delete(coupons);
    await tx.delete(shippingRules);
    await tx.delete(productSpecs);
    await tx.delete(productVariants);
    await tx.delete(products);
    await tx.delete(categories);
    await tx.delete(users);

    await tx.insert(categories).values([...SEED_CATEGORIES]);

    for (const item of ALL_SEED_PRODUCTS) {
      const categoryId = categoryIdBySlug.get(item.categorySlug);
      if (!categoryId) {
        throw new Error(`Unknown categorySlug: ${item.categorySlug}`);
      }

      await tx.insert(products).values({
        id: item.id,
        catalogIndex: item.catalogIndex,
        sku: item.sku,
        slug: item.slug,
        brand: "POCKET THEORY",
        categoryId,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        pricePaise: item.pricePaise,
        mrpPaise: item.mrpPaise,
        hsnCode: item.hsnCode,
        gstRateBps: item.gstRateBps,
        weightGrams: item.weightGrams,
        dimensionsMm: item.dimensionsMm,
        shippingClass: item.shippingClass,
        boxContents: item.boxContents,
        compatibility: item.compatibility,
        faqs: item.faqs,
        images: [
          {
            url: `/products/${item.slug}-front.svg`,
            alt: `${item.title} - front studio packshot`,
            kind: "front",
          },
          {
            url: `/products/${item.slug}-detail.svg`,
            alt: `${item.title} - port and hardware detail diagram`,
            kind: "detail",
          },
          {
            url: `/products/${item.slug}-spec.svg`,
            alt: `${item.title} - physical footprint and box contents`,
            kind: "spec",
          },
        ],
        warrantyMonths: item.warrantyMonths,
        warrantyTerms: `${item.warrantyMonths}-month limited warranty against manufacturing defects from invoice date. Physical, liquid, and unauthorized tampering excluded.`,
        returnWindowDays: item.returnWindowDays,
        returnEligible: true,
        returnExclusions:
          "Eligible for replacement/return within 7 days of delivery if unused with original retail box, cables, ear-tips, and serial label intact. Defective-on-arrival units require unboxing/serial verification.",
        genericName: item.genericName,
        modelNumber: item.modelNumber,
        netQuantity: "1 N",
        countryOfOrigin:
          "India / Imported components (illustrative demo declaration - verify batch carton before commercial sale)",
        manufacturerDetails: DEFAULT_MANUFACTURER_PLACEHOLDER,
        importerDetails: DEFAULT_IMPORTER_PLACEHOLDER,
        customerCareContact: DEFAULT_CUSTOMER_CARE_CONTACT,
        requiresBisCrs: item.requiresBisCrs,
        bisStandardRef: item.bisStandardRef,
        bisRegistrationNumber: null,
        requiresWpcEta: item.requiresWpcEta,
        wpcEtaNumber: null,
        batteryWhRating: item.batteryWhRating,
        safetyNotes: item.safetyNotes,
        complianceStatus: item.complianceStatus ?? "DEMO_ILLUSTRATIVE",
        status: item.status ?? "ACTIVE",
        isFeatured: item.isFeatured ?? false,
        isNewDrop: item.isNewDrop ?? false,
        collectionSlugs: item.collectionSlugs,
        accessorySlugs: item.accessorySlugs,
        searchBoost: item.searchBoost ?? 0,
      });

      for (const [vIdx, v] of item.variants.entries()) {
        variantTotal += 1;
        await tx.insert(productVariants).values({
          id: v.id,
          productId: item.id,
          sku: v.sku,
          label: v.label,
          colorHex: v.colorHex,
          priceOverridePaise: v.priceOverridePaise ?? null,
          mrpOverridePaise: v.mrpOverridePaise ?? null,
          stock: v.stock,
          lowStockThreshold: 5,
          isDefault: v.isDefault ?? vIdx === 0,
          sortOrder: vIdx,
        });

        await tx.insert(inventoryMovements).values({
          id: `mov-seed-${v.id}`,
          variantId: v.id,
          delta: v.stock,
          balanceAfter: v.stock,
          reason: "INITIAL_SEED",
          note: "Initial demo catalogue stock allocation",
        });
      }

      for (const [sIdx, s] of item.specs.entries()) {
        await tx.insert(productSpecs).values({
          id: `spc-${item.id}-${sIdx + 1}`,
          productId: item.id,
          specGroup: s.specGroup,
          specKey: s.specKey,
          specValue: s.specValue,
          verificationNote: s.verificationNote,
          sortOrder: sIdx,
        });
      }
    }

    await tx.insert(coupons).values([...SEED_COUPONS]);
    await tx.insert(shippingRules).values([...SEED_SHIPPING_RULES]);

    for (const u of SEED_DEMO_USERS) {
      await tx.insert(users).values({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        passwordHash: hashPasswordSync(DEMO_ACCOUNT_PASSWORD, u.saltHex),
        role: u.role,
        isActive: true,
      });
    }

    await tx.insert(addresses).values({
      id: "addr-demo-1",
      userId: "usr-demo-customer",
      label: "Home",
      recipientName: "Aarav Kulkarni",
      phone: "9820411209",
      line1: "Flat 602, Shanti Niketan CHS, Gokhale Road",
      line2: "Dadar West",
      landmark: "Near Portuguese Church",
      city: "Mumbai",
      stateName: "Maharashtra",
      stateCode: "27",
      pinCode: "400028",
      isDefault: true,
    });

    await tx.insert(wishlistItems).values([
      {
        id: "wish-demo-1",
        userId: "usr-demo-customer",
        productId: "prod-003",
      },
      {
        id: "wish-demo-2",
        userId: "usr-demo-customer",
        productId: "prod-013",
      },
    ]);

    // Seed one historical demo order so customer history & admin analytics show real DB records
    const line1Unit = 219900; // VoltCore 65W
    const line2Unit = 49900; // FlexCord 100W 2m
    const subtotal = line1Unit + line2Unit; // 269800
    const discount = 26980; // WELCOME10 10%
    const grandTotal = subtotal - discount; // 242820 (>= 99900 -> free shipping)
    const gst = computeInclusiveGstBreakup(grandTotal, 1800, "27");

    await tx.insert(orders).values({
      id: "ord-demo-10001",
      orderNumber: "PT-2026-10001",
      idempotencyKey: "seed-demo-order-10001",
      userId: "usr-demo-customer",
      customerEmail: "customer@pockettheory.demo",
      customerName: "Aarav Kulkarni",
      customerPhone: "9820411209",
      shippingAddressJson: {
        recipientName: "Aarav Kulkarni",
        phone: "9820411209",
        line1: "Flat 602, Shanti Niketan CHS, Gokhale Road",
        line2: "Dadar West",
        landmark: "Near Portuguese Church",
        city: "Mumbai",
        stateName: "Maharashtra",
        stateCode: "27",
        pinCode: "400028",
      },
      shippingStateCode: "27",
      shippingPinCode: "400028",
      shippingMethod: "STANDARD",
      subtotalPaise: subtotal,
      discountPaise: discount,
      couponCode: "WELCOME10",
      shippingPaise: 0,
      taxableAmountPaise: gst.taxableValuePaise,
      cgstPaise: gst.cgstPaise,
      sgstPaise: gst.sgstPaise,
      igstPaise: gst.igstPaise,
      totalTaxPaise: gst.totalTaxPaise,
      grandTotalPaise: grandTotal,
      status: "DELIVERED",
      paymentStatus: "DEMO_AUTHORIZED",
      paymentProvider: "DEMO_SANDBOX",
      isDemoOrder: true,
      carrierName: "Manual Surface Dispatch (Demo)",
      trackingNumber: "PTDEMO400028IN",
      shippedAt: sql`now() - interval '3 days'`,
      deliveredAt: sql`now() - interval '1 day'`,
    });

    const item1Tax = computeInclusiveGstBreakup(line1Unit, 1800, "27");
    const item2Tax = computeInclusiveGstBreakup(line2Unit, 1800, "27");

    await tx.insert(orderItems).values([
      {
        id: "oi-demo-1",
        orderId: "ord-demo-10001",
        productId: "prod-007",
        variantId: "var-007-a",
        productSlug: "voltcore-65w-dual-port-gan-wall-charger",
        productTitle: "VoltCore 65W Dual-Port GaN Wall Charger",
        sku: "PT-PWR-007-GRP",
        variantLabel: "Graphite Ink",
        imageUrl: "/products/voltcore-65w-dual-port-gan-wall-charger-front.svg",
        hsnCode: "85044030",
        gstRateBps: 1800,
        quantity: 1,
        unitPricePaise: line1Unit,
        lineTotalPaise: line1Unit,
        taxAmountPaise: item1Tax.totalTaxPaise,
        warrantyMonths: 18,
        returnWindowDays: 7,
      },
      {
        id: "oi-demo-2",
        orderId: "ord-demo-10001",
        productId: "prod-010",
        variantId: "var-010-a",
        productSlug: "flexcord-100w-braided-usb-c-cable-2m",
        productTitle: "FlexCord 100W Braided USB-C Cable (2m)",
        sku: "PT-PWR-010-GRP",
        variantLabel: "Graphite Weave",
        imageUrl: "/products/flexcord-100w-braided-usb-c-cable-2m-front.svg",
        hsnCode: "85444299",
        gstRateBps: 1800,
        quantity: 1,
        unitPricePaise: line2Unit,
        lineTotalPaise: line2Unit,
        taxAmountPaise: item2Tax.totalTaxPaise,
        warrantyMonths: 12,
        returnWindowDays: 7,
      },
    ]);

    await tx.insert(payments).values({
      id: "pay-demo-10001",
      orderId: "ord-demo-10001",
      provider: "DEMO_SANDBOX",
      providerOrderId: "demo_ord_10001",
      providerPaymentId: "demo_pay_10001",
      amountPaise: grandTotal,
      currency: "INR",
      status: "DEMO_AUTHORIZED",
      isDemo: true,
      signatureVerified: false,
      rawMetaJson: { note: "Non-charging seeded demo confirmation" },
    });

    await tx.insert(storeSettings).values([
      {
        key: "checkout_enabled",
        valueJson: { enabled: true },
      },
      {
        key: "storefront_notice",
        valueJson: {
          bannerText:
            "Free standard shipping across India on orders of ₹999+. Non-charging demo store - all prices & specs are illustrative.",
        },
      },
    ]);

    await tx.insert(auditLogs).values({
      id: "aud-seed-init",
      actorUserId: "usr-demo-admin",
      actorEmail: "admin@pockettheory.demo",
      actorRole: "SUPER_ADMIN",
      action: "SEED_DEMO_CATALOGUE",
      entityType: "SYSTEM",
      entityId: "pocket-theory",
      summary: `Seeded 40 active POCKET THEORY SKUs and ${variantTotal} variants (${options?.allowNonTestDb ? "authorized" : "test"} environment).`,
      beforeJson: null,
      afterJson: { productCount: 40, variantCount: variantTotal },
    });
  });

  return { productCount: ALL_SEED_PRODUCTS.length, variantCount: variantTotal };
}
