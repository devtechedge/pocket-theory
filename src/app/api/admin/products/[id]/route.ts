import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import {
  AuthorizationError,
  requireApiCapability,
  writeAuditLog,
} from "@/domains/auth/rbac";
import { evaluatePublicationGate } from "@/domains/compliance/gate";
import { isDemoMode } from "@/env";
import { assertSameOrigin, CsrfOriginError } from "@/lib/security/csrf";
import { hashClientIp } from "@/lib/security/rate-limit";
import { adminProductPayloadSchema } from "../route";

const updateProductSchema = adminProductPayloadSchema.partial().extend({
  title: adminProductPayloadSchema.shape.title,
  subtitle: adminProductPayloadSchema.shape.subtitle,
  description: adminProductPayloadSchema.shape.description,
  pricePaise: adminProductPayloadSchema.shape.pricePaise,
  mrpPaise: adminProductPayloadSchema.shape.mrpPaise,
  genericName: adminProductPayloadSchema.shape.genericName,
  modelNumber: adminProductPayloadSchema.shape.modelNumber,
  countryOfOrigin: adminProductPayloadSchema.shape.countryOfOrigin,
  manufacturerDetails: adminProductPayloadSchema.shape.manufacturerDetails,
  importerDetails: adminProductPayloadSchema.shape.importerDetails,
  customerCareContact: adminProductPayloadSchema.shape.customerCareContact,
  warrantyMonths: adminProductPayloadSchema.shape.warrantyMonths,
  warrantyTerms: adminProductPayloadSchema.shape.warrantyTerms,
  safetyNotes: adminProductPayloadSchema.shape.safetyNotes,
  complianceStatus: adminProductPayloadSchema.shape.complianceStatus,
  status: adminProductPayloadSchema.shape.status,
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const actor = await requireApiCapability("MANAGE_CATALOG");
    const { id } = await params;

    const db = await getDb();
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Invalid product update payload.",
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
        netQuantity: d.netQuantity ?? existing.netQuantity,
        countryOfOrigin: d.countryOfOrigin,
        manufacturerDetails: d.manufacturerDetails,
        importerDetails: d.importerDetails,
        customerCareContact: d.customerCareContact,
        warrantyMonths: d.warrantyMonths,
        warrantyTerms: d.warrantyTerms,
        requiresBisCrs: d.requiresBisCrs ?? existing.requiresBisCrs,
        bisRegistrationNumber:
          d.bisRegistrationNumber !== undefined
            ? d.bisRegistrationNumber
            : existing.bisRegistrationNumber,
        requiresWpcEta: d.requiresWpcEta ?? existing.requiresWpcEta,
        wpcEtaNumber:
          d.wpcEtaNumber !== undefined
            ? d.wpcEtaNumber
            : existing.wpcEtaNumber,
        complianceStatus: d.complianceStatus,
        requestedStatus: d.status,
      },
      { demoMode: isDemoMode() },
    );

    if (d.status === "ACTIVE" && !gate.allowedToPublish) {
      await writeAuditLog({
        actor,
        action: "COMPLIANCE_GATE_BLOCKED_PUBLISH",
        entityType: "PRODUCT",
        entityId: existing.id,
        summary: `Blocked publishing ${existing.sku}: ${gate.reasons.join("; ")}`,
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

    await db
      .update(products)
      .set({
        title: d.title,
        subtitle: d.subtitle,
        description: d.description,
        pricePaise: d.pricePaise,
        mrpPaise: d.mrpPaise,
        hsnCode: d.hsnCode ?? existing.hsnCode,
        warrantyMonths: d.warrantyMonths,
        warrantyTerms: d.warrantyTerms,
        returnWindowDays: d.returnWindowDays ?? existing.returnWindowDays,
        genericName: d.genericName,
        modelNumber: d.modelNumber,
        countryOfOrigin: d.countryOfOrigin,
        manufacturerDetails: d.manufacturerDetails,
        importerDetails: d.importerDetails,
        customerCareContact: d.customerCareContact,
        requiresBisCrs: d.requiresBisCrs ?? existing.requiresBisCrs,
        bisRegistrationNumber:
          d.bisRegistrationNumber !== undefined
            ? d.bisRegistrationNumber || null
            : existing.bisRegistrationNumber,
        requiresWpcEta: d.requiresWpcEta ?? existing.requiresWpcEta,
        wpcEtaNumber:
          d.wpcEtaNumber !== undefined
            ? d.wpcEtaNumber || null
            : existing.wpcEtaNumber,
        safetyNotes: d.safetyNotes,
        complianceStatus: d.complianceStatus,
        status: gate.effectiveStatus,
        isFeatured: d.isFeatured ?? existing.isFeatured,
        isNewDrop: d.isNewDrop ?? existing.isNewDrop,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.id));

    await writeAuditLog({
      actor,
      action: "UPDATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: existing.id,
      summary: `Updated ${existing.sku} (price ${d.pricePaise}p, status ${gate.effectiveStatus}, compliance ${d.complianceStatus}).`,
      beforeJson: {
        title: existing.title,
        pricePaise: existing.pricePaise,
        status: existing.status,
        complianceStatus: existing.complianceStatus,
      },
      afterJson: {
        title: d.title,
        pricePaise: d.pricePaise,
        status: gate.effectiveStatus,
        complianceStatus: d.complianceStatus,
      },
      ipHash: hashClientIp(req),
    });

    return NextResponse.json({
      ok: true,
      effectiveStatus: gate.effectiveStatus,
    });
  } catch (err) {
    if (err instanceof CsrfOriginError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof AuthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: "Unable to update product." },
      { status: 500 },
    );
  }
}
