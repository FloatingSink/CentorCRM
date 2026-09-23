import { formatMoney } from "@/lib/money";
import { useT } from "@/lib/i18n/client";

type Row = { currency: string; totalMinor: number };

// One line per currency, never a single blended total — CLAUDE.md: money
// never gets summed across currencies.
export function PipelineValueWidget({ rows }: { rows: Row[] }) {
  const { t } = useT();
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("widget.emptyPipelineValue")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {rows.map((row) => (
        <li key={row.currency} className="flex items-center justify-between">
          <span className="text-muted-foreground">{row.currency}</span>
          <span>{formatMoney(row.totalMinor, row.currency)}</span>
        </li>
      ))}
    </ul>
  );
}
