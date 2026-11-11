import { desc, eq, lte, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  categories,
  emailOutbox,
  orderItems,
  orders,
  products,
  productVariants,
  returnRequests,
} from "@/db/schema";

export async function getAdminAnalyticsOverview() {
  const db = await getDb();

  const [
    allOrders,
    allOrderItems,
    allProducts,
    allCategories,
    lowStockVars,
    pendingReturns,
    outboxRows,
  ] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db.select().from(products),
    db.select().from(categories),
    db
      .select({
        variant: productVariants,
        productTitle: products.title,
        productSlug: products.slug,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(lte(productVariants.stock, 12)),
    db
      .select()
      .from(returnRequests)
      .where(eq(returnRequests.status, "REQUESTED")),
    db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(20),
  ]);

  const validOrders = allOrders.filter((o) => o.status !== "CANCELLED");
  const totalRevenuePaise = validOrders.reduce(
    (sum, o) => sum + o.grandTotalPaise,
    0,
  );
  const orderCount = validOrders.length;
  const averageOrderValuePaise =
    orderCount > 0 ? Math.round(totalRevenuePaise / orderCount) : 0;

  const validOrderIds = new Set(validOrders.map((o) => o.id));
  const prodById = new Map(allProducts.map((p) => [p.id, p]));
  const catById = new Map(allCategories.map((c) => [c.id, c]));

  const categorySalesMap = new Map<
    string,
    { categoryName: string; units: number; revenuePaise: number }
  >();
  const productSalesMap = new Map<
    string,
    { title: string; sku: string; units: number; revenuePaise: number }
  >();

  for (const line of allOrderItems) {
    if (!validOrderIds.has(line.orderId)) continue;
    const prod = line.productId ? prodById.get(line.productId) : undefined;
    const catName = prod
      ? (catById.get(prod.categoryId)?.name ?? "Uncategorized")
      : "Uncategorized";

    const prevCat = categorySalesMap.get(catName) ?? {
      categoryName: catName,
      units: 0,
      revenuePaise: 0,
    };
    prevCat.units += line.quantity;
    prevCat.revenuePaise += line.lineTotalPaise;
    categorySalesMap.set(catName, prevCat);

    const pKey = line.productId ?? line.sku;
    const prevProd = productSalesMap.get(pKey) ?? {
      title: line.productTitle,
      sku: line.sku,
      units: 0,
      revenuePaise: 0,
    };
    prevProd.units += line.quantity;
    prevProd.revenuePaise += line.lineTotalPaise;
    productSalesMap.set(pKey, prevProd);
  }

  const unpublishedCount = allProducts.filter(
    (p) => p.status !== "ACTIVE",
  ).length;
  const nonCancelledRecent = await db
    .select()
    .from(orders)
    .where(ne(orders.status, "CANCELLED"))
    .orderBy(desc(orders.createdAt))
    .limit(6);

  return {
    totalRevenuePaise,
    orderCount,
    averageOrderValuePaise,
    activeProductCount: allProducts.length - unpublishedCount,
    unpublishedCount,
    pendingReturnCount: pendingReturns.length,
    outboxCount: outboxRows.length,
    lowStockVariants: lowStockVars.slice(0, 8),
    categoryPerformance: Array.from(categorySalesMap.values()).sort(
      (a, b) => b.revenuePaise - a.revenuePaise,
    ),
    topProducts: Array.from(productSalesMap.values())
      .sort((a, b) => b.revenuePaise - a.revenuePaise)
      .slice(0, 6),
    recentOrders: nonCancelledRecent,
  };
}
