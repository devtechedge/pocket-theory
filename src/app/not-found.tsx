import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-xs font-bold tracking-widest text-pt-tangerine uppercase">
        404 // Route Not Found
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-pt-ink sm:text-4xl">
        That gadget or page is not on the shelf.
      </h1>
      <p className="mt-3 text-sm text-pt-ink-muted">
        Check the URL or jump straight back into the 40-SKU POCKET THEORY
        catalogue.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/shop"
          className="inline-flex h-10 items-center rounded-md bg-pt-tangerine px-5 text-sm font-semibold text-pt-on-tangerine hover:bg-pt-tangerine-hover"
        >
          Browse All 40 Products
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md border border-pt-border-strong bg-pt-surface-elevated px-5 text-sm font-semibold text-pt-ink hover:bg-pt-silver"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
