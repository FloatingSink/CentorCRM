import Link from "next/link";

import { formatDate } from "@/lib/date";

type Row = {
  id: string;
  quoteNo: string;
  customerCompanyName: string;
  validUntil: Date | null;
};

export function QuotesExpiringWidget({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nothing expiring soon.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-2">
          <Link
            href={`/quotations/${row.id}`}
            className="truncate hover:underline"
          >
            {row.quoteNo} — {row.customerCompanyName}
          </Link>
          <span className="flex-none text-muted-foreground">
            {row.validUntil ? formatDate(row.validUntil) : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
