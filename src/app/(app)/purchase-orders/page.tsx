import Link from "next/link";

import { PurchaseOrdersTable } from "./purchase-orders-table";
import { buttonVariants } from "@/components/ui/button";
import { getPurchaseOrders } from "@/server/purchase-orders";

export default async function PurchaseOrdersPage() {
  const orders = await getPurchaseOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Purchase Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </div>
        <Link href="/purchase-orders/new" className={buttonVariants()}>
          New purchase order
        </Link>
      </div>

      <PurchaseOrdersTable orders={orders} />
    </div>
  );
}
