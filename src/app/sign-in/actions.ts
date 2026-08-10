"use server";

import { AuthError } from "next-auth";

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

  try {
    await signIn("nodemailer", { email: parsed.data.email, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Could not send the sign-in link. Try again." };
    }
    throw error;
  }

  return {};
}
