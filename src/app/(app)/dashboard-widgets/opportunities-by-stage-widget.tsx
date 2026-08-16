import { opportunityStageEnum } from "@/db/schema/opportunity";

type Row = {
  stage: (typeof opportunityStageEnum.enumValues)[number];
  count: number;
};

// Always renders every stage in pipeline order, zero-filling stages the
// query didn't return a row for, rather than only showing whichever
// stages happen to have an open opportunity right now.
export function OpportunitiesByStageWidget({ rows }: { rows: Row[] }) {
  const counts = new Map(rows.map((r) => [r.stage, r.count]));

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {opportunityStageEnum.enumValues.map((stage) => (
        <li key={stage} className="flex items-center justify-between">
          {/* The opportunities list has no stage filter to link into yet
              (crm-spec.md §8 describes it as kanban + table, not a
              query-param filter), so this is a label, not a link. */}
          <span className="capitalize">{stage.replace("_", " ")}</span>
          <span className="text-muted-foreground">
            {counts.get(stage) ?? 0}
          </span>
        </li>
      ))}
    </ul>
  );
}
