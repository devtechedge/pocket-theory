import Link from "next/link";

export function PaginationBar({
  page,
  totalPages,
  basePath,
  currentParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  currentParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(currentParams)) {
      if (v && k !== "page") usp.set(k, v);
    }
    if (targetPage > 1) usp.set("page", String(targetPage));
    const qs = usp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <nav
      aria-label="Catalogue pagination"
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-pt-border pt-6"
    >
      <p className="font-mono text-xs text-pt-ink-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex h-9 items-center rounded-md border border-pt-border bg-pt-surface-elevated px-3 font-mono text-xs font-semibold text-pt-ink hover:bg-pt-silver"
          >
            ← Prev
          </Link>
        )}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
          <Link
            key={pNum}
            href={buildHref(pNum)}
            aria-current={pNum === page ? "page" : undefined}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border font-mono text-xs font-bold ${
              pNum === page
                ? "border-pt-ink bg-pt-ink text-pt-surface-elevated"
                : "border-pt-border bg-pt-surface-elevated text-pt-ink hover:bg-pt-silver"
            }`}
          >
            {pNum}
          </Link>
        ))}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex h-9 items-center rounded-md border border-pt-border bg-pt-surface-elevated px-3 font-mono text-xs font-semibold text-pt-ink hover:bg-pt-silver"
          >
            Next →
          </Link>
        )}
      </div>
    </nav>
  );
}
