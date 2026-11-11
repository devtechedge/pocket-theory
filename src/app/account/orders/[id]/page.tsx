import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountNav } from "@/components/account/AccountNav";
import { OrderDetailActions } from "@/components/account/OrderDetailActions";
import { Badge } from "@/components/ui/Badge";
import { requirePageUser } from "@/domains/auth/rbac";
import { getOrderWithDetails } from "@/domains/orders/service";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser("/account/orders");
  const { id } = await params;
  const detail = await getOrderWithDetails(id);

  // Strict IDOR protection: customers can only inspect their own orders
  if (!detail || detail.order.userId !== user.id) {
    notFound();
  }

  const { order, items, returns } = detail;
  const canCancel = !["SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].includes(
    order.status,
  );
  const canRequestReturn = order.status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AccountNav signedIn />

      <div className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-xs font-bold text-pt-cobalt uppercase">
              Tax Invoice & Order Record
            </p>
            <h1 className="mt-1 font-mono text-2xl font-extrabold text-pt-ink">
              {order.orderNumber}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="cobalt">{order.status}</Badge>
            <Badge tone={order.isDemoOrder ? "amber" : "lime"}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-pt-border pt-4 text-xs sm:grid-cols-2">
          <div>
            <p className="font-mono font-bold text-pt-ink uppercase">
              Shipping Destination
            </p>
            <p className="mt-1 font-semibold text-pt-ink">
              {order.shippingAddressJson.recipientName} (+91{" "}
              {order.shippingAddressJson.phone})
            </p>
            <p className="text-pt-ink-muted">
              {order.shippingAddressJson.line1}
              {order.shippingAddressJson.line2
                ? `, ${order.shippingAddressJson.line2}`
                : ""}
            </p>
            <p className="text-pt-ink-muted">
              {order.shippingAddressJson.city},{" "}
              {order.shippingAddressJson.stateName} (
              {order.shippingStateCode}) - {order.shippingPinCode}
            </p>
          </div>

          <div>
            <p className="font-mono font-bold text-pt-ink uppercase">
              Fulfilment & Carrier Tracking
            </p>
            {order.carrierName ? (
              <p className="mt-1 font-mono text-pt-ink">
                {order.carrierName} // {order.trackingNumber ?? "Pending"}
              </p>
            ) : (
              <p className="mt-1 text-pt-ink-muted">
                Awaiting warehouse dispatch assignment.
              </p>
            )}
            {order.buyerGstin && (
              <p className="mt-1 font-mono text-pt-ink">
                Buyer GSTIN: {order.buyerGstin}
              </p>
            )}
          </div>
        </div>

        {/* Snapshotted Items */}
        <ul className="mt-5 divide-y divide-pt-border border-t border-pt-border text-xs">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <Link
                  href={`/product/${item.productSlug}`}
                  className="font-bold text-pt-ink hover:text-pt-tangerine"
                >
                  {item.productTitle}
                </Link>
                <p className="font-mono text-[0.6875rem] text-pt-ink-muted">
                  {item.variantLabel} | SKU {item.sku} | Qty {item.quantity} |{" "}
                  {item.warrantyMonths}-mo warranty
                </p>
              </div>
              <span className="font-mono font-bold text-pt-ink">
                {formatPaise(item.lineTotalPaise)}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <dl className="mt-4 space-y-1.5 border-t border-pt-border pt-4 text-xs">
          <div className="flex justify-between">
            <dt className="text-pt-ink-muted">Items Subtotal</dt>
            <dd className="font-mono">{formatPaise(order.subtotalPaise)}</dd>
          </div>
          {order.discountPaise > 0 && (
            <div className="flex justify-between text-pt-lime-ink">
              <dt>Promo ({order.couponCode})</dt>
              <dd className="font-mono">-{formatPaise(order.discountPaise)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-pt-ink-muted">Shipping ({order.shippingMethod})</dt>
            <dd className="font-mono">
              {order.shippingPaise === 0
                ? "FREE"
                : formatPaise(order.shippingPaise)}
            </dd>
          </div>
          <div className="flex justify-between text-pt-ink-muted">
            <dt>GST Breakup</dt>
            <dd className="font-mono">
              Taxable {formatPaise(order.taxableAmountPaise)} +{" "}
              {order.igstPaise > 0
                ? `IGST ${formatPaise(order.igstPaise)}`
                : `CGST ${formatPaise(order.cgstPaise)} + SGST ${formatPaise(
                    order.sgstPaise,
                  )}`}
            </dd>
          </div>
          <div className="flex justify-between border-t border-pt-border pt-2.5 text-sm font-bold text-pt-ink">
            <dt>Grand Total</dt>
            <dd className="font-mono">{formatPaise(order.grandTotalPaise)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-pt-border pt-5">
          <OrderDetailActions
            orderId={order.id}
            canCancel={canCancel}
            canRequestReturn={canRequestReturn}
            items={items}
          />
        </div>

        {returns.length > 0 && (
          <div className="mt-6 border-t border-pt-border pt-5">
            <h2 className="font-mono text-xs font-bold text-pt-ink uppercase">
              Return / Replacement Requests on This Order
            </h2>
            <ul className="mt-2 space-y-2 text-xs">
              {returns.map((r) => (
                <li
                  key={r.id}
                  className="rounded border border-pt-border bg-pt-surface p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-pt-ink">{r.reason}</span>
                    <Badge tone="amber">{r.status}</Badge>
                  </div>
                  <p className="mt-1 text-pt-ink-muted">{r.details}</p>
                  {r.resolutionNote && (
                    <p className="mt-1 font-mono text-pt-cobalt">
                      Resolution: {r.resolutionNote}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
