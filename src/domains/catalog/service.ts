import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  categories,
  products,
  productSpecs,
  productVariants,
  type CompatibilityItem,
  type ComplianceStatus,
  type ProductFaq,
  type ProductImage,
  type ProductStatus,
  type ShippingClass,
  type SpecVerificationNote,
} from "@/db/schema";
import { isProductPubliclyVisible } from "@/domains/compliance/gate";
import { isDemoMode } from "@/env";

export interface CatalogVariantView {
  id: string;
  sku: string;
  label: string;
  colorHex: string;
  effectivePricePaise: number;
  effectiveMrpPaise: number;
  stock: number;
  lowStockThreshold: number;
  isDefault: boolean;
}

export interface CatalogSpecView {
  id: string;
  specGroup: string;
  specKey: string;
  specValue: string;
  verificationNote: SpecVerificationNote;
}

export interface CatalogCardItem {
  id: string;
  catalogIndex: number;
  sku: string;
  slug: string;
  brand: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  subtitle: string;
  pricePaise: number;
  mrpPaise: number;
  primaryImage: ProductImage;
  totalStock: number;
  defaultVariantId: string;
  defaultVariantLabel: string;
  variants: CatalogVariantView[];
  isFeatured: boolean;
  isNewDrop: boolean;
  collectionSlugs: string[];
  complianceStatus: ComplianceStatus;
  warrantyMonths: number;
  searchBoost: number;
}

export interface ProductDetailView extends CatalogCardItem {
  description: string;
  hsnCode: string;
  gstRateBps: number;
  weightGrams: number | null;
  dimensionsMm: string | null;
  shippingClass: ShippingClass;
  boxContents: string[];
  compatibility: CompatibilityItem[];
  faqs: ProductFaq[];
  images: ProductImage[];
  warrantyTerms: string;
  returnWindowDays: number;
  returnEligible: boolean;
  returnExclusions: string;
  genericName: string;
  modelNumber: string;
  netQuantity: string;
  countryOfOrigin: string;
  manufacturerDetails: string;
  importerDetails: string;
  customerCareContact: string;
  requiresBisCrs: boolean;
  bisStandardRef: string | null;
  bisRegistrationNumber: string | null;
  requiresWpcEta: boolean;
  wpcEtaNumber: string | null;
  batteryWhRating: string | null;
  safetyNotes: string;
  status: ProductStatus;
  specs: CatalogSpecView[];
  accessories: CatalogCardItem[];
  related: CatalogCardItem[];
}

export type CatalogSort =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "index-asc";

export interface CatalogFilterInput {
  q?: string;
  categorySlug?: string;
  collectionSlug?: string;
  minPriceRupees?: number;
  maxPriceRupees?: number;
  inStockOnly?: boolean;
  under999?: boolean;
  sort?: CatalogSort;
  page?: number;
  pageSize?: number;
}

export interface CatalogQueryResult {
  items: CatalogCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listCategoriesWithCounts() {
  const db = await getDb();
  const demoMode = isDemoMode();

  const [catRows, prodRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db.select().from(products),
  ]);

  const counts = new Map<string, number>();
  for (const p of prodRows) {
    if (isProductPubliclyVisible(p, { demoMode })) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
  }

  return catRows.map((c) => ({
    ...c,
    productCount: counts.get(c.id) ?? 0,
  }));
}

async function hydratePublicCards(): Promise<CatalogCardItem[]> {
  const db = await getDb();
  const demoMode = isDemoMode();

  const [catRows, prodRows, varRows] = await Promise.all([
    db.select().from(categories),
    db.select().from(products).orderBy(asc(products.catalogIndex)),
    db.select().from(productVariants).orderBy(asc(productVariants.sortOrder)),
  ]);

  const catMap = new Map(catRows.map((c) => [c.id, c]));
  const varsByProduct = new Map<string, typeof varRows>();
  for (const v of varRows) {
    const list = varsByProduct.get(v.productId) ?? [];
    list.push(v);
    varsByProduct.set(v.productId, list);
  }

  const cards: CatalogCardItem[] = [];
  for (const p of prodRows) {
    if (!isProductPubliclyVisible(p, { demoMode })) continue;
    const cat = catMap.get(p.categoryId);
    if (!cat) continue;
    const rawVars = varsByProduct.get(p.id) ?? [];
    const mappedVars: CatalogVariantView[] = rawVars.map((v) => ({
      id: v.id,
      sku: v.sku,
      label: v.label,
      colorHex: v.colorHex,
      effectivePricePaise: v.priceOverridePaise ?? p.pricePaise,
      effectiveMrpPaise: v.mrpOverridePaise ?? p.mrpPaise,
      stock: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      isDefault: v.isDefault,
    }));

    const defaultVar =
      mappedVars.find((v) => v.isDefault) ?? mappedVars[0];
    if (!defaultVar) continue;

    const totalStock = mappedVars.reduce((acc, v) => acc + v.stock, 0);
    const primaryImage: ProductImage = p.images[0] ?? {
      url: `/products/${p.slug}-front.svg`,
      alt: p.title,
      kind: "front",
    };

    cards.push({
      id: p.id,
      catalogIndex: p.catalogIndex,
      sku: p.sku,
      slug: p.slug,
      brand: p.brand,
      categoryId: p.categoryId,
      categorySlug: cat.slug,
      categoryName: cat.name,
      title: p.title,
      subtitle: p.subtitle,
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      primaryImage,
      totalStock,
      defaultVariantId: defaultVar.id,
      defaultVariantLabel: defaultVar.label,
      variants: mappedVars,
      isFeatured: p.isFeatured,
      isNewDrop: p.isNewDrop,
      collectionSlugs: p.collectionSlugs ?? [],
      complianceStatus: p.complianceStatus,
      warrantyMonths: p.warrantyMonths,
      searchBoost: p.searchBoost,
    });
  }

  return cards;
}

export async function queryCatalog(
  filter: CatalogFilterInput = {},
): Promise<CatalogQueryResult> {
  const all = await hydratePublicCards();
  const qNorm = filter.q?.trim().toLowerCase() ?? "";

  const filtered = all.filter((item) => {
    if (
      filter.categorySlug &&
      filter.categorySlug !== "all" &&
      item.categorySlug !== filter.categorySlug
    ) {
      return false;
    }
    if (filter.collectionSlug) {
      if (filter.collectionSlug === "under-999") {
        if (item.pricePaise > 99900) return false;
      } else if (filter.collectionSlug === "new-drops") {
        if (!item.isNewDrop && !item.collectionSlugs.includes("new-drops")) {
          return false;
        }
      } else if (!item.collectionSlugs.includes(filter.collectionSlug)) {
        return false;
      }
    }
    if (filter.under999 && item.pricePaise > 99900) {
      return false;
    }
    if (
      filter.minPriceRupees != null &&
      Number.isFinite(filter.minPriceRupees) &&
      item.pricePaise < Math.round(filter.minPriceRupees * 100)
    ) {
      return false;
    }
    if (
      filter.maxPriceRupees != null &&
      Number.isFinite(filter.maxPriceRupees) &&
      item.pricePaise > Math.round(filter.maxPriceRupees * 100)
    ) {
      return false;
    }
    if (filter.inStockOnly && item.totalStock <= 0) {
      return false;
    }
    if (qNorm) {
      const hay = [
        item.title,
        item.subtitle,
        item.sku,
        item.categoryName,
        ...item.collectionSlugs,
      ]
        .join(" ")
        .toLowerCase();
      const tokens = qNorm.split(/\s+/).filter(Boolean);
      if (!tokens.every((t) => hay.includes(t))) {
        return false;
      }
    }
    return true;
  });

  const sort: CatalogSort = filter.sort ?? "featured";
  filtered.sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.pricePaise - b.pricePaise || a.catalogIndex - b.catalogIndex;
      case "price-desc":
        return b.pricePaise - a.pricePaise || a.catalogIndex - b.catalogIndex;
      case "newest":
        return (
          Number(b.isNewDrop) - Number(a.isNewDrop) ||
          b.catalogIndex - a.catalogIndex
        );
      case "index-asc":
        return a.catalogIndex - b.catalogIndex;
      case "featured":
      default:
        return (
          Number(b.isFeatured) - Number(a.isFeatured) ||
          b.searchBoost - a.searchBoost ||
          a.catalogIndex - b.catalogIndex
        );
    }
  });

  const pageSize = Math.min(48, Math.max(4, filter.pageSize ?? 12));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, filter.page ?? 1));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function suggestCatalogProducts(
  query: string,
  limit = 6,
): Promise<CatalogCardItem[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    const featured = await queryCatalog({ sort: "featured", pageSize: limit });
    return featured.items;
  }
  const res = await queryCatalog({ q: trimmed, sort: "featured", pageSize: limit });
  return res.items;
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailView | null> {
  const db = await getDb();
  const demoMode = isDemoMode();

  const [prod] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!prod || !isProductPubliclyVisible(prod, { demoMode })) {
    return null;
  }

  const allCards = await hydratePublicCards();
  const card = allCards.find((c) => c.id === prod.id);
  if (!card) return null;

  const specRows = await db
    .select()
    .from(productSpecs)
    .where(eq(productSpecs.productId, prod.id))
    .orderBy(asc(productSpecs.sortOrder));

  const cardBySlug = new Map(allCards.map((c) => [c.slug, c]));
  const accessories = (prod.accessorySlugs ?? [])
    .map((s) => cardBySlug.get(s))
    .filter((x): x is CatalogCardItem => Boolean(x))
    .slice(0, 4);

  const related = allCards
    .filter(
      (c) =>
        c.id !== prod.id &&
        c.categoryId === prod.categoryId &&
        !accessories.some((a) => a.id === c.id),
    )
    .slice(0, 4);

  return {
    ...card,
    description: prod.description,
    hsnCode: prod.hsnCode,
    gstRateBps: prod.gstRateBps,
    weightGrams: prod.weightGrams,
    dimensionsMm: prod.dimensionsMm,
    shippingClass: prod.shippingClass,
    boxContents: prod.boxContents ?? [],
    compatibility: prod.compatibility ?? [],
    faqs: prod.faqs ?? [],
    images:
      prod.images && prod.images.length > 0
        ? prod.images
        : [card.primaryImage],
    warrantyTerms: prod.warrantyTerms,
    returnWindowDays: prod.returnWindowDays,
    returnEligible: prod.returnEligible,
    returnExclusions: prod.returnExclusions,
    genericName: prod.genericName,
    modelNumber: prod.modelNumber,
    netQuantity: prod.netQuantity,
    countryOfOrigin: prod.countryOfOrigin,
    manufacturerDetails: prod.manufacturerDetails,
    importerDetails: prod.importerDetails,
    customerCareContact: prod.customerCareContact,
    requiresBisCrs: prod.requiresBisCrs,
    bisStandardRef: prod.bisStandardRef,
    bisRegistrationNumber: prod.bisRegistrationNumber,
    requiresWpcEta: prod.requiresWpcEta,
    wpcEtaNumber: prod.wpcEtaNumber,
    batteryWhRating: prod.batteryWhRating,
    safetyNotes: prod.safetyNotes,
    status: prod.status,
    specs: specRows.map((s) => ({
      id: s.id,
      specGroup: s.specGroup,
      specKey: s.specKey,
      specValue: s.specValue,
      verificationNote: s.verificationNote,
    })),
    accessories,
    related,
  };
}

export async function getComparisonProductsBySlugs(
  slugs: string[],
): Promise<ProductDetailView[]> {
  const uniqueSlugs = Array.from(
    new Set(slugs.map((s) => s.trim()).filter(Boolean)),
  ).slice(0, 4);
  if (uniqueSlugs.length === 0) return [];

  const db = await getDb();
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(inArray(products.slug, uniqueSlugs));

  const validSet = new Set(rows.map((r) => r.slug));
  const details: ProductDetailView[] = [];
  for (const s of uniqueSlugs) {
    if (!validSet.has(s)) continue;
    const d = await getProductBySlug(s);
    if (d) details.push(d);
  }
  return details;
}

export async function getCardsBySlugs(
  slugs: string[],
): Promise<CatalogCardItem[]> {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  if (unique.length === 0) return [];
  const all = await hydratePublicCards();
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  return unique
    .map((s) => bySlug.get(s))
    .filter((c): c is CatalogCardItem => Boolean(c));
}
