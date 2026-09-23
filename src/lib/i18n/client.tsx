"use client";

import { createContext, useContext, useMemo } from "react";

import { t, tCount, type Locale } from "./dictionary";

// A context rather than props because the client graph is deep in the places
// that need this: dashboard-grid → 9 widgets → widget-card, the three order
// builders → order-line-editor / pdf-preview-panel, and the shared
// task-panel / activity-timeline / document-library trio, each rendered from
// six different detail pages. Mounted once in src/app/(app)/layout.tsx
// beside the existing TooltipProvider.
const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useLocale();
  return useMemo(
    () => ({
      locale,
      t: (key: string, vars?: Record<string, string | number>) =>
        t(locale, key, vars),
      tCount: (key: string, n: number) => tCount(locale, key, n),
    }),
    [locale],
  );
}
