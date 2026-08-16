import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { activityRelatedTypeEnum } from "@/db/schema/activity";
import { activityRelatedHref } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/date";

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
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity logged yet.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {row.type}
            </Badge>
            <Link
              href={activityRelatedHref(row.relatedType, row.relatedId)}
              className="truncate hover:underline"
            >
              {row.subject}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {row.userName ?? "Someone"} · {formatDateTime(row.occurredAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
