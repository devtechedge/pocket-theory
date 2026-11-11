"use client";

import { ArrowRight, Scale, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStorefront } from "@/components/providers/StorefrontProvider";

export function CompareTray() {
  const pathname = usePathname();
  const { compareItems, removeCompare, clearCompare } = useStorefront();

  if (compareItems.length === 0 || pathname.startsWith("/compare") || pathname.startsWith("/admin")) {
    return null;
  }

  const compareHref = `/compare?skus=${encodeURIComponent(
    compareItems.map((i) => i.slug).join(","),
  )}`;

  return (
    <aside
      aria-label="Product comparison tray"
      data-testid="compare-tray"
      className="fixed right-0 bottom-0 left-0 z-40 border-t border-pt-border-strong bg-pt-surface-elevated/95 px-4 py-2.5 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-pt-ink uppercase">
            <Scale className="h-3.5 w-3.5 text-pt-tangerine" />
            Compare ({compareItems.length}/4)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {compareItems.map((item) => (
              <span
                key={item.slug}
                className="inline-flex max-w-[13rem] items-center gap-1.5 rounded border border-pt-border bg-pt-surface px-2 py-1 text-xs text-pt-ink"
              >
                <span className="truncate font-medium">{item.title}</span>
                <button
                  type="button"
                  onClick={() => removeCompare(item.slug)}
                  aria-label={`Remove ${item.title} from comparison`}
                  className="shrink-0 text-pt-ink-muted hover:text-pt-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCompare}
            className="rounded px-2.5 py-1.5 font-mono text-xs text-pt-ink-muted hover:bg-pt-silver hover:text-pt-ink"
          >
            Clear
          </button>
          <Link
            href={compareHref}
            data-testid="compare-tray-open"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-pt-tangerine px-3 text-xs font-semibold text-pt-on-tangerine transition-colors hover:bg-pt-tangerine-hover"
          >
            <span>
              {compareItems.length < 2
                ? "Open Compare (Pick 1 more)"
                : `Compare ${compareItems.length} Items`}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
