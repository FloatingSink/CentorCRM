import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { useT } from "@/lib/i18n/client";

type Row = {
  id: string;
  orderNo: string;
  currency: string;
  totalValue: number;
};

export function PurchaseOrdersAwaitingConfirmationWidget({
  rows,
}: {
  rows: Row[];
}) {
  const { t } = useT();
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("widget.emptyPurchaseOrders")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-2">
          <Link href={`/purchase-orders/${row.id}`} className="hover:underline">
            {row.orderNo}
          </Link>
          <span className="text-muted-foreground">
            {formatMoney(row.totalValue, row.currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}
