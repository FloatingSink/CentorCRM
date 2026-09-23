import { Suspense } from "react";

import { SignInForm } from "./sign-in-form";
import { getLocale } from "@/lib/i18n/server";

export default async function SignInPage() {
  const locale = await getLocale();

  return (
    <Suspense>
      <SignInForm locale={locale} />
    </Suspense>
  );
}
