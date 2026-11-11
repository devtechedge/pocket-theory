"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPaise } from "@/lib/money";

interface SuggestionItem {
  slug: string;
  sku: string;
  title: string;
  categoryName: string;
  pricePaise: number;
  imageUrl: string;
}

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggest?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const data = (await res.json()) as { suggestions?: SuggestionItem[] };
          setSuggestions(data.suggestions ?? []);
        }
      } catch {
        // Aborted or offline
      }
    }, 150);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    const trimmed = query.trim();
    router.push(
      trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/search",
    );
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 max-w-md">
      <form onSubmit={handleSubmit} role="search" className="relative flex">
        <label htmlFor="header-search-input" className="sr-only">
          Search gadgets, wattages, or SKU
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-pt-ink-muted"
        />
        <input
          id="header-search-input"
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder="Search 65W GaN, ANC, cable, dashcam..."
          data-testid="header-search-input"
          className="h-9 w-full min-w-0 rounded-md border border-pt-border bg-pt-surface pr-8 pl-9 text-sm text-pt-ink placeholder:text-pt-ink-muted focus:border-pt-cobalt"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search query"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-pt-ink-muted hover:text-pt-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {open && suggestions.length > 0 && (
        <div
          role="region"
          aria-label="Search suggestions"
          className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-lg border border-pt-border-strong bg-pt-surface-elevated shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-pt-border px-3 py-1.5 font-mono text-[0.6875rem] text-pt-ink-muted uppercase">
            <span>{query.trim() ? "Matching Hardware" : "Popular Picks"}</span>
            <Link
              href={
                query.trim()
                  ? `/shop?q=${encodeURIComponent(query.trim())}`
                  : "/search"
              }
              onClick={() => setOpen(false)}
              className="font-semibold text-pt-cobalt hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-pt-border">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/product/${s.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-pt-silver/60"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-pt-ink">
                      {s.title}
                    </div>
                    <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
                      {s.sku} - {s.categoryName}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-bold text-pt-ink">
                    {formatPaise(s.pricePaise)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
