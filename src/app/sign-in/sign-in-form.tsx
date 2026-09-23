"use client";

import { useSearchParams } from "next/navigation";

import { signInWithMicrosoft } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t, type Locale } from "@/lib/i18n/dictionary";

// Auth.js redirects here with ?error=<code> for failures it handles
// internally (the signIn callback rejecting a deactivated or not-yet-
// provisioned account) — those never throw back to the server action, see
// actions.ts.
const AUTH_ERROR_KEYS: Record<string, string> = {
  Configuration: "signIn.errorConfiguration",
  AccessDenied: "signIn.errorAccessDenied",
};

function authErrorKey(code: string | null): string | undefined {
  if (!code) return undefined;
  return AUTH_ERROR_KEYS[code] ?? "signIn.errorGeneric";
}

// Locale arrives as a prop, not from useT(): /sign-in is outside the (app)
// route group, so there is no LocaleProvider above it — and it is the one
// screen a user sees before any session exists.
export function SignInForm({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const errorKey = authErrorKey(searchParams.get("error"));

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t(locale, "signIn.title")}</CardTitle>
          <CardDescription>{t(locale, "signIn.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {errorKey ? (
            <p className="mb-4 text-sm text-destructive">
              {t(locale, errorKey)}
            </p>
          ) : null}
          <form action={signInWithMicrosoft}>
            <Button type="submit" className="w-full">
              {t(locale, "signIn.button")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
