import Link from "next/link";

import { SalesOrdersTable } from "./sales-orders-table";
import { buttonVariants } from "@/components/ui/button";
import { getSalesOrders } from "@/server/sales-orders";

export default async function SalesOrdersPage() {
  const orders = await getSalesOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Sales Orders</h2>
          <p className="text-sm text-muted-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </div>
        <Link href="/sales-orders/new" className={buttonVariants()}>
          New sales order
        </Link>
      </div>

      <SalesOrdersTable orders={orders} />
    </div>
  );
}
