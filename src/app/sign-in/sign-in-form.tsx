"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { requestMagicLink } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Auth.js redirects here with ?error=<code> for failures it handles
// internally (send failures, the signIn callback rejecting an inactive
// user) — those never throw back to the server action, see actions.ts.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "We couldn't send the sign-in email right now. Try again shortly.",
  AccessDenied: "This account is deactivated. Contact an admin for access.",
  Verification:
    "That sign-in link is invalid or has expired. Request a new one below.",
};

function authErrorMessage(code: string | null): string | undefined {
  if (!code) return undefined;
  return (
    AUTH_ERROR_MESSAGES[code] ??
    "Something went wrong signing you in. Please try again."
  );
}

export function SignInForm() {
  const [state, formAction, pending] = useActionState(
    requestMagicLink,
    undefined,
  );
  const searchParams = useSearchParams();
  const error = state?.error ?? authErrorMessage(searchParams.get("error"));

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>CENTOR CRM</CardTitle>
          <CardDescription>
            Sign in with your work email to get a magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          ) : null}
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@centor.com"
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
