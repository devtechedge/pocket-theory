import { NextResponse } from "next/server";
import { getCardsBySlugs } from "@/domains/catalog/service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("slugs") ?? "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const items = await getCardsBySlugs(slugs);
  return NextResponse.json({ items });
}
