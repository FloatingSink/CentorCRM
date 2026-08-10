"use client";

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

export default function SignInPage() {
  const [state, formAction, pending] = useActionState(
    requestMagicLink,
    undefined,
  );

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
          {state?.error ? (
            <p className="mb-4 text-sm text-destructive">{state.error}</p>
          ) : null}
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
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
