import Link from "next/link";

import { PurchaseOrdersTable } from "./purchase-orders-table";
import { buttonVariants } from "@/components/ui/button";
import { getPurchaseOrders } from "@/server/purchase-orders";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function PurchaseOrdersPage() {
  const [orders, locale] = await Promise.all([
    getPurchaseOrders(),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "purchaseOrder.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "purchaseOrder.count", orders.length)}
          </p>
        </div>
        <Link href="/purchase-orders/new" className={buttonVariants()}>
          {t(locale, "purchaseOrder.new")}
        </Link>
      </div>

      <PurchaseOrdersTable orders={orders} />
    </div>
  );
}
