import type { Locale } from "./i18n/dictionary";

// crm-spec.md §7: store UTC timestamps, render in Asia/Singapore. Every
// user-facing date until now (signed_date, issue_date, etc.) is a day-only
// `date` column with no time-of-day component, so this rule never actually
// applied to a rendered value before — activity.occurred_at is the first one.

// The time zone is fixed by the spec and does not follow the UI language —
// only the language the month/era is written in does. Formatters are built
// once per locale and cached, same as the module-scope singletons they
// replace (constructing an Intl formatter is not cheap).
const BASE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Singapore",
  year: "numeric",
  month: "short",
  day: "numeric",
};

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-SG",
  zh: "zh-SG",
};

const dateTimeFormatters = new Map<Locale, Intl.DateTimeFormat>();
const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

function formatter(
  cache: Map<Locale, Intl.DateTimeFormat>,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const cached = cache.get(locale);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat(INTL_LOCALES[locale], options);
  cache.set(locale, created);
  return created;
}

export function formatDateTime(date: Date, locale: Locale = "en"): string {
  return formatter(dateTimeFormatters, locale, {
    ...BASE_OPTIONS,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(date: Date, locale: Locale = "en"): string {
  return formatter(dateFormatters, locale, BASE_OPTIONS).format(date);
}
