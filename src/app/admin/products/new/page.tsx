import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import {
  DEFAULT_CUSTOMER_CARE_CONTACT,
  DEFAULT_IMPORTER_PLACEHOLDER,
  DEFAULT_MANUFACTURER_PLACEHOLDER,
} from "@/db/seeds/reference-data";
import { requirePageCapability } from "@/domains/auth/rbac";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Draft Product",
  robots: { index: false, follow: false },
};

export default async function AdminNewProductPage() {
  const actor = await requirePageCapability("MANAGE_CATALOG");
  const db = await getDb();
  const catRows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />
      <h1 className="mb-5 font-display text-2xl font-bold text-pt-ink">
        Create New Hardware SKU
      </h1>

      <ProductEditorForm
        mode="create"
        categories={catRows}
        initial={{
          sku: "PT-EXP-041",
          slug: "experimental-prototype-041",
          categoryId: catRows[0]?.id ?? "cat-power",
          title: "",
          subtitle: "",
          description: "",
          pricePaise: 99900,
          mrpPaise: 129900,
          hsnCode: "85044090",
          warrantyMonths: 12,
          warrantyTerms:
            "12-month limited warranty against manufacturing defects.",
          returnWindowDays: 7,
          genericName: "Electronic Hardware Accessory",
          modelNumber: "PT-PROTO-41",
          countryOfOrigin: "India (pending batch verification)",
          manufacturerDetails: DEFAULT_MANUFACTURER_PLACEHOLDER,
          importerDetails: DEFAULT_IMPORTER_PLACEHOLDER,
          customerCareContact: DEFAULT_CUSTOMER_CARE_CONTACT,
          requiresBisCrs: false,
          bisRegistrationNumber: "",
          requiresWpcEta: false,
          wpcEtaNumber: "",
          safetyNotes: "Keep dry and inspect cables before power connection.",
          complianceStatus: "PENDING_REVIEW",
          status: "DRAFT",
          isFeatured: false,
          isNewDrop: false,
        }}
      />
    </div>
  );
}
