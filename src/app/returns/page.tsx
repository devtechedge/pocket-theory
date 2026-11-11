import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns, Cancellations & Replacements",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-pt-ink-muted">
        <h1 className="font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          Returns, Cancellations & Refund Policy
        </h1>
        <p>
          Every POCKET THEORY product page discloses its exact return window
          (7 days from delivery across seeded SKUs) prior to checkout in
          accordance with the Consumer Protection (E-Commerce) Rules, 2020.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-xs">
          <li>
            <strong>Pre-Shipment Cancellation:</strong> Orders in{" "}
            <code>PENDING_PAYMENT</code>, <code>DEMO_CONFIRMED</code>,{" "}
            <code>CONFIRMED</code>, or <code>PACKED</code> states can be
            cancelled directly from <code>/account/orders/[id]</code>, releasing
            reserved stock immediately.
          </li>
          <li>
            <strong>7-Day Replacement / Return:</strong> Unused products with
            intact retail carton, cables, spare ear-tips, and matching serial
            sticker qualify within 7 days of delivery. Defective-on-arrival
            claims are prioritized for replacement or full refund.
          </li>
          <li>
            <strong>Exclusions:</strong> Liquid ingress, bent USB connectors,
            thermal abuse from parked dashboards, missing accessories, or
            used in-ear silicone tips (unless unit is defective on arrival).
          </li>
        </ul>
      </div>
    </div>
  );
}
