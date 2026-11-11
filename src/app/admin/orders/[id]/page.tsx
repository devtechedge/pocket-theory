import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminOrderControls } from "@/components/admin/AdminOrderControls";
import { Badge } from "@/components/ui/Badge";
import { requirePageCapability } from "@/domains/auth/rbac";
import { getOrderWithDetails } from "@/domains/orders/service";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Order Fulfilment",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePageCapability("MANAGE_ORDERS_RETURNS");
  const { id } = await params;
  const detail = await getOrderWithDetails(id);
  if (!detail) notFound();

  const { order, items, returns } = detail;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminNav role={actor.role} email={actor.email} />

      <div className="mb-6 rounded-xl border border-pt-border bg-pt-surface-elevated p-5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-mono text-xl font-extrabold text-pt-ink">
            {order.orderNumber}
          </h1>
          <div className="flex gap-1.5">
            <Badge tone="cobalt">{order.status}</Badge>
            <Badge tone={order.isDemoOrder ? "amber" : "lime"}>
              {order.paymentStatus}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-pt-ink-muted">
          Customer: <strong className="text-pt-ink">{order.customerName}</strong>{" "}
          ({order.customerEmail} | +91 {order.customerPhone})
        </p>
        <p className="text-pt-ink-muted">
          Address: {order.shippingAddressJson.line1},{" "}
          {order.shippingAddressJson.city},{" "}
          {order.shippingAddressJson.stateName} - {order.shippingPinCode}
        </p>

        <ul className="mt-4 divide-y divide-pt-border border-t border-pt-border">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between py-2">
              <span>
                {i.productTitle} ({i.variantLabel} // {i.sku}) x {i.quantity}
              </span>
              <span className="font-mono font-bold">
                {formatPaise(i.lineTotalPaise)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex justify-between border-t border-pt-border pt-2.5 text-sm font-bold">
          <span>Grand Total (Incl. GST)</span>
          <span className="font-mono">{formatPaise(order.grandTotalPaise)}</span>
        </div>
      </div>

      <AdminOrderControls order={order} returns={returns} />
    </div>
  );
}
