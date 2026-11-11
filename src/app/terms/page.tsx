import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Sale & Demo Use",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-pt-ink-muted">
        <h1 className="font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          Terms of Sale & Demonstration Environment Notice
        </h1>
        <p>
          This deployment operates as a full-stack reference direct-to-consumer
          electronics store for India (`INR`, `Asia/Kolkata`). Unless live
          commercial gateway credentials and verified statutory product
          registrations (`DEMO_MODE=0`) are enabled by the store operator,
          orders placed here represent non-binding demonstration records.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-xs">
          <li>
            All monetary calculations run server-side in integer paise; client
            price manipulation is ignored.
          </li>
          <li>
            Quantity per SKU line is capped at 10 units per consumer order to
            prevent bulk reseller hoarding.
          </li>
          <li>
            Grievance redressal follows the 48-hour acknowledgement and 30-day
            resolution timeline published on <code>/contact</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
