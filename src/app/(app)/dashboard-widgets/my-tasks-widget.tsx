import Link from "next/link";

import { formatDate } from "@/lib/date";
import { useT } from "@/lib/i18n/client";

type Row = {
  id: string;
  title: string;
  dueDate: Date | null;
};

export function MyTasksWidget({ rows }: { rows: Row[] }) {
  const { locale, t } = useT();
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("task.mineEmpty")}</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <li key={row.id} className="flex items-center justify-between gap-2">
          <Link href="/tasks" className="truncate hover:underline">
            {row.title}
          </Link>
          {row.dueDate ? (
            <span className="flex-none text-xs text-muted-foreground">
              {t("task.due", { date: formatDate(row.dueDate, locale) })}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
