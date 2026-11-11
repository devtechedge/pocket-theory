import { NextResponse } from "next/server";
import { suggestCatalogProducts } from "@/domains/catalog/service";
import { checkRateLimit, hashClientIp } from "@/lib/security/rate-limit";

export async function GET(req: Request) {
  const rl = await checkRateLimit({
    scope: "search_suggest",
    identifier: hashClientIp(req),
    limit: 60,
    windowSeconds: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json({ suggestions: [] }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const items = await suggestCatalogProducts(q, 6);

  return NextResponse.json({
    suggestions: items.map((i) => ({
      slug: i.slug,
      sku: i.sku,
      title: i.title,
      categoryName: i.categoryName,
      pricePaise: i.pricePaise,
      imageUrl: i.primaryImage.url,
    })),
  });
}
