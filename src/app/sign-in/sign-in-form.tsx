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

// Auth.js redirects here with ?error=<code> for failures it handles
// internally (the signIn callback rejecting a deactivated or not-yet-
// provisioned account) — those never throw back to the server action, see
// actions.ts.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "We couldn't reach Microsoft sign-in right now. Try again shortly.",
  AccessDenied:
    "This account isn't set up for CENTOR CRM, or has been deactivated. Contact an admin for access.",
};

function authErrorMessage(code: string | null): string | undefined {
  if (!code) return undefined;
  return (
    AUTH_ERROR_MESSAGES[code] ??
    "Something went wrong signing you in. Please try again."
  );
}

export function SignInForm() {
  const searchParams = useSearchParams();
  const error = authErrorMessage(searchParams.get("error"));

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>CENTOR CRM</CardTitle>
          <CardDescription>
            Sign in with your CENTOR Microsoft account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          ) : null}
          <form action={signInWithMicrosoft}>
            <Button type="submit" className="w-full">
              Sign in with Microsoft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
