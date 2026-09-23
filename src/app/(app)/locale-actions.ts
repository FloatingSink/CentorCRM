"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { LOCALES } from "@/lib/i18n/dictionary";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

// Not form-bound — language-switcher.tsx calls this directly from the
// segmented control's change handler, same precedent as dashboard-actions.ts.
//
// No auth guard on purpose: this writes no user data and reads none. It is a
// display preference for whoever is holding the browser, and it has to work
// on /sign-in too, before there is a session at all.

const localeSchema = z.enum(LOCALES);

export async function setLocaleAction(
  locale: unknown,
): Promise<{ error?: string }> {
  const parsed = localeSchema.safeParse(locale);
  if (!parsed.success) return { error: "error.invalidInput" };

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, parsed.data, {
    path: "/",
    // Readable by JS is pointless here (every consumer is server-side) and
    // httpOnly costs nothing, so keep it off-limits to scripts.
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  return {};
}
