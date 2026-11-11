"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CategoryMerchRow({
  category,
}: {
  category: {
    id: string;
    name: string;
    slug: string;
    heroTagline: string;
    isFeatured: boolean;
  };
}) {
  const router = useRouter();
  const [tagline, setTagline] = useState(category.heroTagline);
  const [isFeatured, setIsFeatured] = useState(category.isFeatured);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "category",
          categoryId: category.id,
          heroTagline: tagline,
          isFeatured,
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-pt-border bg-pt-surface p-3.5 text-xs">
      <div className="min-w-[12rem]">
        <div className="font-bold text-pt-ink">{category.name}</div>
        <div className="font-mono text-[0.6875rem] text-pt-cobalt">
          /category/{category.slug}
        </div>
      </div>
      <input
        aria-label={`Tagline for ${category.name}`}
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
        className="h-9 min-w-[14rem] flex-1 rounded border border-pt-border bg-pt-surface-elevated px-2.5 text-xs"
      />
      <label className="flex items-center gap-1.5 font-semibold">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="accent-pt-tangerine"
        />
        <span>Featured</span>
      </label>
      <Button size="sm" variant="secondary" disabled={busy} onClick={save}>
        {busy ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
