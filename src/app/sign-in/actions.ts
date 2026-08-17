"use server";

import { signIn } from "@/lib/auth";

export async function signInWithMicrosoft() {
  // Provider/signIn-callback failures (deactivated or not-yet-provisioned
  // account) don't throw here — Auth.js handles them internally and
  // redirects to pages.error ("/sign-in?error=…") instead. See
  // sign-in-form.tsx for where that's actually surfaced.
  await signIn("microsoft-entra-id", { redirectTo: "/" });
}
