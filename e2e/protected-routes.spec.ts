import { expect, test } from "@playwright/test";

// Smoke test only: confirms the (app) layout's auth check actually protects
// these routes when signed out. Authenticated coverage of the app's actual
// critical flows lives in quotation-flow.spec.ts, back-to-back-flow.spec.ts,
// and document-and-activity-flow.spec.ts (see e2e/global-setup.ts for the
// injected-session sign-in those share) — everything else stays covered by
// manual QA via `pnpm dev`, per crm-spec.md §9's "two or three critical
// flows".
for (const path of [
  "/",
  "/companies",
  "/companies/new",
  "/contacts",
  "/contacts/new",
  "/projects",
  "/projects/new",
]) {
  test(`${path} redirects an unauthenticated visitor to /sign-in`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in/);
  });
}
