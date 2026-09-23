import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { activityRelatedTypeEnum } from "@/db/schema/activity";
import { activityRelatedHref } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/date";
import { useT } from "@/lib/i18n/client";

type Row = {
  id: string;
  type: string;
  subject: string;
  occurredAt: Date;
  relatedType: (typeof activityRelatedTypeEnum.enumValues)[number];
  relatedId: string;
  userName: string | null;
};

export function RecentActivityWidget({ rows }: { rows: Row[] }) {
  const { locale, t } = useT();
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("activity.empty")}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t(`activityType.${row.type}`)}</Badge>
            <Link
              href={activityRelatedHref(row.relatedType, row.relatedId)}
              className="truncate hover:underline"
            >
              {row.subject}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.userName ?? t("widget.someone")} ·{" "}
            {formatDateTime(row.occurredAt, locale)}
          </p>
        </li>
      ))}
    </ul>
  );
}
