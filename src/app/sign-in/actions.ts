"use server";

import { signIn } from "@/lib/auth";
import { signInSchema } from "@/lib/validation/sign-in";

export async function requestMagicLink(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = signInSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  // Provider failures (e.g. SMTP send errors) don't throw here — Auth.js
  // handles them internally and redirects to pages.error ("/sign-in?error=…")
  // instead. See sign-in-form.tsx for where that's actually surfaced.
  await signIn("nodemailer", { email: parsed.data.email, redirectTo: "/" });

  return {};
}
