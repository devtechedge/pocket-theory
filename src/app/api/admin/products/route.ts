import { randomBytes } from "node:crypto";
import { max } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db/client";
import { products, productSpecs, productVariants } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { evaluatePublicationGate } from "@/domains/compliance/gate";
import { isDemoMode } from "@/env";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";

export const adminProductPayloadSchema = z.object({
  sku: z.string().trim().min(3).max(40),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  categoryId: z.string().trim().min(2).max(60),
  title: z.string().trim().min(3).max(160),
  subtitle: z.string().trim().min(5).max(240),
  description: z.string().trim().min(10).max(2000),
  pricePaise: z.number().int().positive(),
  mrpPaise: z.number().int().positive(),
  hsnCode: z.string().trim().min(4).max(16),
  gstRateBps: z.number().int().min(0).max(2800).default(1800),
  warrantyMonths: z.number().int().min(0).max(60).default(12),
  warrantyTerms: z.string().trim().min(5).max(500),
  returnWindowDays: z.number().int().min(0).max(30).default(7),
  genericName: z.string().trim().min(2).max(160),
  modelNumber: z.string().trim().min(2).max(80),
  netQuantity: z.string().trim().min(1).max(32).default("1 N"),
  countryOfOrigin: z.string().trim().min(2).max(200),
  manufacturerDetails: z.string().trim().min(3).max(300),
  importerDetails: z.string().trim().min(3).max(300),
  customerCareContact: z.string().trim().min(5).max(400),
  requiresBisCrs: z.boolean().default(false),
  bisStandardRef: z.string().trim().max(160).nullable().optional(),
  bisRegistrationNumber: z.string().trim().max(80).nullable().optional(),
  requiresWpcEta: z.boolean().default(false),
  wpcEtaNumber: z.string().trim().max(80).nullable().optional(),
  safetyNotes: z.string().trim().min(5).max(600),
  complianceStatus: z.enum([
    "DEMO_ILLUSTRATIVE",
    "PENDING_REVIEW",
    "VERIFIED",
    "MISSING_EVIDENCE",
    "REJECTED",
  ]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  isFeatured: z.boolean().default(false),
  isNewDrop: z.boolean().default(false),
  defaultVariantLabel: z.string().trim().min(1).max(80).default("Graphite Ink"),
  defaultVariantStock: z.number().int().min(0).max(9999).default(10),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_CATALOG");
    const raw = await req.json();
    const parsed = adminProductPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid product payload.",
        },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const gate = evaluatePublicationGate(
      {
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        pricePaise: d.pricePaise,
        mrpPaise: d.mrpPaise,
        genericName: d.genericName,
        modelNumber: d.modelNumber,
        netQuantity: d.netQuantity,
        countryOfOrigin: d.countryOfOrigin,
        manufacturerDetails: d.manufacturerDetails,
        importerDetails: d.importerDetails,
        customerCareContact: d.customerCareContact,
        warrantyMonths: d.warrantyMonths,
        warrantyTerms: d.warrantyTerms,
        requiresBisCrs: d.requiresBisCrs,
        bisRegistrationNumber: d.bisRegistrationNumber ?? null,
        requiresWpcEta: d.requiresWpcEta,
        wpcEtaNumber: d.wpcEtaNumber ?? null,
        complianceStatus: d.complianceStatus,
        requestedStatus: d.status,
      },
      { demoMode: isDemoMode() },
    );

    if (d.status === "ACTIVE" && !gate.allowedToPublish) {
      await writeAuditLog({
        actor,
        action: "COMPLIANCE_GATE_BLOCKED_CREATE",
        entityType: "PRODUCT",
        entityId: d.sku,
        summary: `Blocked ACTIVE creation of ${d.sku}: ${gate.reasons.join("; ")}`,
        ipHash: hashClientIp(req),
      });
      return NextResponse.json(
        {
          error: "Publication blocked by Indian Statutory Compliance Gate.",
          reasons: gate.reasons,
        },
        { status: 422 },
      );
    }

    const db = await getDb();
    const [maxRow] = await db
      .select({ maxIdx: max(products.catalogIndex) })
      .from(products);
    const nextIdx = (maxRow?.maxIdx ?? 40) + 1;
    const prodId = `prod-${randomBytes(8).toString("hex")}`;

    await db.transaction(async (tx) => {
      await tx.insert(products).values({
        id: prodId,
        catalogIndex: nextIdx,
        sku: d.sku,
        slug: d.slug,
        brand: "POCKET THEORY",
        categoryId: d.categoryId,
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        pricePaise: d.pricePaise,
        mrpPaise: d.mrpPaise,
        hsnCode: d.hsnCode,
        gstRateBps: d.gstRateBps,
        images: [
          {
            url: "/products/fallback.svg",
            alt: `${d.title} packshot`,
            kind: "front",
          },
        ],
        boxContents: [`1 N ${d.title}`, "1 N Safety Leaflet"],
        compatibility: [],
        faqs: [],
        warrantyMonths: d.warrantyMonths,
        warrantyTerms: d.warrantyTerms,
        returnWindowDays: d.returnWindowDays,
        returnEligible: true,
        returnExclusions: "Unused retail carton with serial intact.",
        genericName: d.genericName,
        modelNumber: d.modelNumber,
        netQuantity: d.netQuantity,
        countryOfOrigin: d.countryOfOrigin,
        manufacturerDetails: d.manufacturerDetails,
        importerDetails: d.importerDetails,
        customerCareContact: d.customerCareContact,
        requiresBisCrs: d.requiresBisCrs,
        bisStandardRef: d.bisStandardRef ?? null,
        bisRegistrationNumber: d.bisRegistrationNumber || null,
        requiresWpcEta: d.requiresWpcEta,
        wpcEtaNumber: d.wpcEtaNumber || null,
        safetyNotes: d.safetyNotes,
        complianceStatus: d.complianceStatus,
        status: gate.effectiveStatus,
        isFeatured: d.isFeatured,
        isNewDrop: d.isNewDrop,
      });

      await tx.insert(productVariants).values({
        id: `var-${randomBytes(8).toString("hex")}`,
        productId: prodId,
        sku: `${d.sku}-DEF`,
        label: d.defaultVariantLabel,
        colorHex: "#1B2028",
        stock: d.defaultVariantStock,
        isDefault: true,
        sortOrder: 0,
      });

      await tx.insert(productSpecs).values({
        id: `spc-${randomBytes(8).toString("hex")}`,
        productId: prodId,
        specGroup: "General",
        specKey: "Model Reference",
        specValue: `${d.modelNumber} (specification pending verification)`,
        verificationNote: "PENDING_VERIFICATION",
        sortOrder: 0,
      });
    });

    await writeAuditLog({
      actor,
      action: "CREATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: prodId,
      summary: `Created product ${d.sku} (${d.title}) as ${gate.effectiveStatus}.`,
      afterJson: { sku: d.sku, status: gate.effectiveStatus },
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({ id: prodId, status: gate.effectiveStatus }, { status: 201 });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create product." },
      { status: 400 },
    );
  }
}
