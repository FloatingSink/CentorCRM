import Link from "next/link";

import { SalesOrdersTable } from "./sales-orders-table";
import { buttonVariants } from "@/components/ui/button";
import { getSalesOrders } from "@/server/sales-orders";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function SalesOrdersPage() {
  const [orders, locale] = await Promise.all([getSalesOrders(), getLocale()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "salesOrder.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "salesOrder.count", orders.length)}
          </p>
        </div>
        <Link href="/sales-orders/new" className={buttonVariants()}>
          {t(locale, "salesOrder.new")}
        </Link>
      </div>

      <SalesOrdersTable orders={orders} />
    </div>
  );
}
