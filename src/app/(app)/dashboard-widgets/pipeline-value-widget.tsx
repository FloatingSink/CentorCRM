import { formatMoney } from "@/lib/money";

type Row = { currency: string; totalMinor: number };

// One line per currency, never a single blended total — CLAUDE.md: money
// never gets summed across currencies.
export function PipelineValueWidget({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No open pipeline value.</p>
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
