import type { MetadataRoute } from "next";
import {
  listCategoriesWithCounts,
  queryCatalog,
} from "@/domains/catalog/service";
import { BUYING_GUIDES } from "@/domains/content/guides";
import { getSiteUrl } from "@/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [categories, catalog] = await Promise.all([
    listCategoriesWithCounts(),
    queryCatalog({ sort: "index-asc", pageSize: 48 }),
  ]);

  const staticRoutes = [
    "",
    "/shop",
    "/compare",
    "/search",
    "/guides",
    "/brand/pocket-theory",
    "/track-order",
    "/about",
    "/contact",
    "/faq",
    "/shipping",
    "/returns",
    "/warranty",
    "/privacy",
    "/terms",
    "/product-safety",
  ];

  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1.0 : 0.7,
    })),
    ...categories.map((cat) => ({
      url: `${base}/category/${cat.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...BUYING_GUIDES.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...catalog.items.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
