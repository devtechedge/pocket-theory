import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-pt-ink-muted">
        <h1 className="font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          Privacy & Data Minimization Policy
        </h1>
        <p>
          POCKET THEORY collects only the fields necessary to calculate GST,
          deliver orders, and honour warranties: recipient name, email, 10-digit
          Indian mobile number, postal address, and optional buyer GSTIN.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-xs">
          <li>
            <strong>Zero Card Storage:</strong> Card numbers, CVVs, and UPI PINs
            are never accepted or stored by POCKET THEORY servers.
          </li>
          <li>
            <strong>Hashed Tokens & Passwords:</strong> Passwords use{" "}
            <code>scrypt</code> with random 16-byte per-user salts; session and
            cart tokens are stored only as SHA-256 hashes in PostgreSQL; rate
            limiters store salted IP hashes rather than raw client IPs.
          </li>
          <li>
            <strong>Role-Scoped Staff Redaction:</strong> Non-support catalog
            staff see masked customer email and phone records inside the Admin
            Console.
          </li>
        </ul>
      </div>
    </div>
  );
}
