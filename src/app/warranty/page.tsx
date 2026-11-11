import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "House Warranty Policy",
  alternates: { canonical: "/warranty" },
};

export default function WarrantyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8 space-y-5 text-sm leading-relaxed text-pt-ink-muted">
        <h1 className="font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          Limited Hardware Warranty
        </h1>
        <p>
          POCKET THEORY snaps your product&apos;s exact warranty duration (6,
          12, 18, or 24 months depending on SKU) onto your immutable order line
          record at checkout, so future policy updates never alter an earlier
          invoice.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-xs">
          <li>
            <strong>Covered:</strong> Internal PCB, GaN switching stage, port
            controller, acoustic driver, and premature cell defects under normal
            consumer operation.
          </li>
          <li>
            <strong>Not Covered:</strong> Normal cosmetic wear, cable jacket
            cuts, power-surge damage from ungrounded sockets, unauthorized
            disassembly, or gradual lithium capacity aging from normal charge
            cycles.
          </li>
          <li>
            <strong>How to Claim:</strong> Submit your order number (`PT-2026-...`)
            via <code>/contact</code> or <code>/account/orders</code>; no
            separate post-purchase warranty registration hurdle is required.
          </li>
        </ul>
      </div>
    </div>
  );
}
