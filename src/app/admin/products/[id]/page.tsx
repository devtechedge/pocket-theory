import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { getDb } from "@/db/client";
import { categories, products } from "@/db/schema";
import { requirePageCapability } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePageCapability("MANAGE_CATALOG");
  const { id } = await params;
  const db = await getDb();

  const [[prod], catRows] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
  ]);

  if (!prod) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
            Editing Catalogue #{String(prod.catalogIndex).padStart(2, "0")} //{" "}
            {prod.sku}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-pt-ink">
            {prod.title}
          </h1>
        </div>
        <Link
          href={`/product/${prod.slug}`}
          className="font-mono text-xs font-bold text-pt-tangerine hover:underline"
        >
          Open Storefront PDP →
        </Link>
      </div>

      <ProductEditorForm
        mode="edit"
        categories={catRows}
        initial={{
          id: prod.id,
          sku: prod.sku,
          slug: prod.slug,
          categoryId: prod.categoryId,
          title: prod.title,
          subtitle: prod.subtitle,
          description: prod.description,
          pricePaise: prod.pricePaise,
          mrpPaise: prod.mrpPaise,
          hsnCode: prod.hsnCode,
          warrantyMonths: prod.warrantyMonths,
          warrantyTerms: prod.warrantyTerms,
          returnWindowDays: prod.returnWindowDays,
          genericName: prod.genericName,
          modelNumber: prod.modelNumber,
          countryOfOrigin: prod.countryOfOrigin,
          manufacturerDetails: prod.manufacturerDetails,
          importerDetails: prod.importerDetails,
          customerCareContact: prod.customerCareContact,
          requiresBisCrs: prod.requiresBisCrs,
          bisRegistrationNumber: prod.bisRegistrationNumber ?? "",
          requiresWpcEta: prod.requiresWpcEta,
          wpcEtaNumber: prod.wpcEtaNumber ?? "",
          safetyNotes: prod.safetyNotes,
          complianceStatus: prod.complianceStatus,
          status: prod.status,
          isFeatured: prod.isFeatured,
          isNewDrop: prod.isNewDrop,
        }}
      />
    </div>
  );
}
