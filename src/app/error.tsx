"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route boundary error:", error.digest ?? "client");
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-xs font-bold tracking-widest text-pt-danger uppercase">
        Unexpected Fault
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold text-pt-ink sm:text-3xl">
        Something interrupted this view.
      </h1>
      <p className="mt-3 text-sm text-pt-ink-muted">
        No payment or personal card information was processed. Try reloading the
        section below.
      </p>
      <div className="mt-6 flex justify-center">
        <Button onClick={reset}>Retry View</Button>
      </div>
    </section>
  );
}
