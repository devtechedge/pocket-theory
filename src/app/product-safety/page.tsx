import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Safety, Lithium Care & E-Waste Management",
  description:
    "Lithium-ion battery cabin safety, thermal dashboard precautions, coin-cell child safety, BIS/WPC transparency, and CPCB E-Waste & Battery disposal guidance.",
  alternates: { canonical: "/product-safety" },
};

export default function ProductSafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-pt-ink-muted">
        <h1 className="font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          Product Safety, Lithium Care & E-Waste Management
        </h1>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            1. Lithium-Ion Power Bank & Battery Safety
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-xs">
            <li>
              <strong>Flight Cabin Rule:</strong> Carry portable power banks
              (≤100 Wh) in hand/cabin baggage only; never pack lithium batteries
              in checked aircraft hold baggage.
            </li>
            <li>
              <strong>Indian Summer Vehicle Heat:</strong> Never leave
              rechargeable power banks, cordless mini vacuums, or TWS cases on
              sunlit car dashboards or parcel shelves where cabin temperatures
              exceed 50 C. Prefer supercapacitor dashcams (RoadView) and corded
              12V vacuums (CarClean 12V) for permanent vehicle storage.
            </li>
            <li>
              <strong>Swelling or Odour:</strong> Immediately stop using and
              charging any battery pack that exhibits enclosure bulging, unusual
              heat, or chemical odour; isolate on a non-flammable surface and
              transfer to an authorized battery recycler.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            2. Button / Coin Cell Child Safety (CR2032 / CR1632)
          </h2>
          <p className="text-xs">
            Item trackers (FindLoop) and compact Bluetooth remotes use lithium
            coin batteries. Swallowing a coin cell can cause severe internal
            chemical burns within two hours. Always keep coin-cell compartments
            locked and spare cells out of children&apos;s reach.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            3. E-Waste (Management) Rules, 2022 & Battery Waste Management Rules, 2022
          </h2>
          <p className="text-xs">
            Crossed-out wheeled-bin symbol reminder: End-of-life chargers,
            cables, earbuds, smartwatches, and waste batteries must{" "}
            <strong>never be discarded in unsorted household municipal waste</strong>{" "}
            or incinerated. Deposit end-of-life electronics and portable cells
            only with CPCB-registered recyclers or producer take-back collection
            points.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-pt-ink">
            4. BIS CRS & WPC ETA Publication Gate
          </h2>
          <p className="text-xs">
            POCKET THEORY enforces a strict server-side publication gate: no SKU
            in this demo store fabricates BIS R-numbers, WPC ETA numbers, or IP
            test ratings. In live commercial mode (`DEMO_MODE=0`), products
            missing verified statutory registration references remain blocked in
            <code>DRAFT</code> state.
          </p>
        </section>
      </div>
    </div>
  );
}
