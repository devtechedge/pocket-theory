import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "About Pocket Theory",
  description:
    "Why Pocket Theory builds calm, specification-transparent everyday electronics for Indian bags, desks, and car cabins.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-10">
        <Badge tone="tangerine">Brand Philosophy</Badge>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-pt-ink sm:text-4xl">
          Useful tech. Zero fuss.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-pt-ink-muted">
          Personal electronics in India became loud: spinning discount wheels,
          85%-off inflated MRPs, zero-hour countdown clocks, and specification
          tables that hide port power-sharing behind vague buzzwords.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-pt-ink-muted">
          <strong>POCKET THEORY</strong> is an original single-brand D2C
          hardware store built around the opposite premise. Forty tools across
          five daily environments - Power & Charging, Audio, Wearables &
          Trackers, Desk & Creator Gear, and Automotive & Travel - presented
          with clear port schematics, honest Wh and thermal notes, integer-paise
          INR GST invoices, and explicit statutory verification labels.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-pt-border pt-6 sm:grid-cols-3 text-xs">
          <div>
            <h2 className="font-mono font-bold text-pt-ink uppercase">
              01 // Spec Honesty
            </h2>
            <p className="mt-1 text-pt-ink-muted">
              Every demo parameter is labelled illustrative until supplier lab
              sheets are verified; zero fabricated certifications.
            </p>
          </div>
          <div>
            <h2 className="font-mono font-bold text-pt-ink uppercase">
              02 // Repairable & Safe
            </h2>
            <p className="mt-1 text-pt-ink-muted">
              Supercapacitors in hot car cabins, standard 22mm watch lugs, and
              CPCB battery/e-waste take-back guidance.
            </p>
          </div>
          <div>
            <h2 className="font-mono font-bold text-pt-ink uppercase">
              03 // Transparent Math
            </h2>
            <p className="mt-1 text-pt-ink-muted">
              Integer-paise server calculations, exact CGST/SGST vs IGST
              breakup, and no hidden checkout add-ons.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex h-10 items-center rounded-md bg-pt-tangerine px-5 text-xs font-semibold text-pt-on-tangerine"
          >
            Browse All 40 SKUs
          </Link>
          <Link
            href="/product-safety"
            className="inline-flex h-10 items-center rounded-md border border-pt-border-strong bg-pt-surface px-5 text-xs font-semibold text-pt-ink"
          >
            Safety & Regulatory Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
