// crm-spec.md §7: store UTC timestamps, render in Asia/Singapore. Every
// user-facing date until now (signed_date, issue_date, etc.) is a day-only
// `date` column with no time-of-day component, so this rule never actually
// applied to a rendered value before — activity.occurred_at is the first one.

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-SG", {
  timeZone: "Asia/Singapore",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(date: Date): string {
  return DATE_TIME_FORMATTER.format(date);
}
