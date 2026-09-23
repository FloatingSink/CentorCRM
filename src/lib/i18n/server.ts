import { cookies } from "next/headers";

import type { Locale } from "./dictionary";

// The UI language is a per-browser cookie, not a column on `user` — no
// migration, and it works on /sign-in before there is a session to read a
// preference from. Per-user persistence is a deferred upgrade; see
// docs/decisions.md and crm-spec.md §7.
//
// ponytail: cookie, not a user column — a user switching machines gets
// English again. Move to `user.ui_language` if that becomes a complaint.
export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  // Anything other than an exact "zh" falls back to English rather than
  // being trusted — this value is client-settable.
  return cookieStore.get(LOCALE_COOKIE)?.value === "zh" ? "zh" : "en";
}
