import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about Pocket Theory shipping across India, GST tax invoices, demo payment sandbox, lithium cabin rules, and warranty.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "Are prices shown on Pocket Theory inclusive of GST?",
    a: "Yes. Every selling price and MRP across the catalogue is stored in integer paise and displayed in INR inclusive of 18% GST. At checkout, your invoice shows the exact reverse-calculated taxable value plus 9% CGST + 9% SGST (within Maharashtra) or 18% IGST (all other Indian states and UTs).",
  },
  {
    q: "Does checkout charge real money in this deployment?",
    a: "When live Razorpay or Stripe credentials are not configured, checkout automatically switches to an unmistakably labelled Non-Charging Demo Payment Sandbox. No card or UPI details are collected, and demo orders are explicitly marked DEMO_CONFIRMED rather than PAID.",
  },
  {
    q: "Why do power banks take slightly longer to reach non-metro PIN codes?",
    a: "High-capacity lithium-ion power banks are routed via DGCA-compliant ground surface linehaul rather than passenger aircraft belly cargo, adding 1 to 2 business days outside Mumbai/Pune.",
  },
  {
    q: "Why do several specification rows say 'Pending Verification'?",
    a: "Pocket Theory separates design targets from certified lab reports. Until supplier batch test sheets, BIS CRS R-numbers, and WPC ETA certificates are verified by the store owner, parameters stay transparently marked as illustrative demo specifications.",
  },
  {
    q: "Can I check out without creating an account?",
    a: "Yes. Guest checkout is supported with a validated 10-digit Indian mobile number, email, and 6-digit PIN code, and you can look up order status anytime at /track-order.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
        Support Knowledgebase
      </p>
      <h1 className="mt-1 font-display text-3xl font-extrabold text-pt-ink">
        Frequently Asked Questions
      </h1>

      <div className="mt-6 space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            open
            className="rounded-xl border border-pt-border bg-pt-surface-elevated p-5"
          >
            <summary className="cursor-pointer font-display text-sm font-bold text-pt-ink">
              {item.q}
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-pt-ink-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
