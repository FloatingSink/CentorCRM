import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";

type Row = {
  id: string;
  reference: string;
  title: string;
  stage: string;
};

export function MyOpenOpportunitiesWidget({ rows }: { rows: Row[] }) {
  const { t } = useT();
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("widget.emptyMyOpportunities")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-2">
          <Link
            href={`/opportunities/${row.id}`}
            className="truncate hover:underline"
          >
            {row.reference} — {row.title}
          </Link>
          <Badge variant="secondary" className="flex-none">
            {t(`opportunityStage.${row.stage}`)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
