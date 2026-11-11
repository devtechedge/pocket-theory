import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/domains/auth/session";
import { getOrderWithDetails } from "@/domains/orders/service";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const [detail, user] = await Promise.all([
    getOrderWithDetails(orderNumber),
    getCurrentUser(),
  ]);

  if (!detail) notFound();
  const { order, items } = detail;

  const isFailed = order.paymentStatus === "FAILED" || order.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div
        data-testid="order-confirmation-card"
        className="rounded-xl border border-pt-border-strong bg-pt-surface-elevated p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isFailed ? "danger" : order.isDemoOrder ? "amber" : "lime"}>
            {isFailed
              ? "Order Cancelled / Payment Failed"
              : order.isDemoOrder
                ? "Non-Charging Demo Order Confirmed"
                : "Order Confirmed"}
          </Badge>
          <span className="font-mono text-xs text-pt-ink-muted">
            {order.paymentStatus}
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-extrabold text-pt-ink sm:text-3xl">
          {isFailed
            ? `Order ${order.orderNumber} Was Not Charged`
            : `Thank you, ${order.customerName.split(" ")[0]}.`}
        </h1>
        <p className="mt-1 font-mono text-sm font-bold text-pt-cobalt">
          Order Reference: {order.orderNumber}
        </p>

        {order.isDemoOrder && !isFailed && (
          <p className="mt-3 rounded-md border border-pt-amber-ink/30 bg-pt-amber-soft p-3 text-xs text-pt-amber-ink">
            <strong>Demo Honesty Notice:</strong> This order ran through the
            non-charging demo payment flow (`DEMO_SANDBOX`). Zero real-world
            payment was captured and no physical parcel will be dispatched.
          </p>
        )}

        <div className="mt-6 border-t border-pt-border pt-5">
          <h2 className="font-mono text-xs font-bold text-pt-ink uppercase">
            Snapshotted Line Items & Warranty Terms
          </h2>
          <ul className="mt-3 divide-y divide-pt-border text-xs">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <div className="font-bold text-pt-ink">
                    {item.productTitle} ({item.variantLabel}) x {item.quantity}
                  </div>
                  <div className="font-mono text-[0.6875rem] text-pt-ink-muted">
                    SKU {item.sku} | HSN {item.hsnCode} |{" "}
                    {item.warrantyMonths}-mo warranty |{" "}
                    {item.returnWindowDays}-day return window
                  </div>
                </div>
                <span className="font-mono font-bold text-pt-ink">
                  {formatPaise(item.lineTotalPaise)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-4 space-y-1.5 border-t border-pt-border pt-4 text-xs">
          <div className="flex justify-between">
            <dt className="text-pt-ink-muted">Subtotal</dt>
            <dd className="font-mono">{formatPaise(order.subtotalPaise)}</dd>
          </div>
          {order.discountPaise > 0 && (
            <div className="flex justify-between text-pt-lime-ink">
              <dt>Promo ({order.couponCode})</dt>
              <dd className="font-mono">-{formatPaise(order.discountPaise)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-pt-ink-muted">Shipping</dt>
            <dd className="font-mono">
              {order.shippingPaise === 0
                ? "FREE"
                : formatPaise(order.shippingPaise)}
            </dd>
          </div>
          <div className="flex justify-between text-pt-ink-muted">
            <dt>Taxable Value + GST Split</dt>
            <dd className="font-mono">
              Taxable {formatPaise(order.taxableAmountPaise)} |{" "}
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

        <div className="mt-6 flex flex-wrap gap-3">
          {user && order.userId === user.id ? (
            <Link
              href={`/account/orders/${order.id}`}
              className="inline-flex h-10 items-center rounded-md bg-pt-tangerine px-4 text-xs font-semibold text-pt-on-tangerine"
            >
              View in My Account
            </Link>
          ) : (
            <Link
              href="/track-order"
              className="inline-flex h-10 items-center rounded-md bg-pt-tangerine px-4 text-xs font-semibold text-pt-on-tangerine"
            >
              Track Order Status
            </Link>
          )}
          <Link
            href="/shop"
            className="inline-flex h-10 items-center rounded-md border border-pt-border-strong bg-pt-surface px-4 text-xs font-semibold text-pt-ink"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
