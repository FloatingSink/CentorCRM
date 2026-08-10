import { expect, test } from "@playwright/test";

// Smoke test only: confirms the (app) layout's auth check actually protects
// these routes. Can't verify their rendered content without a real inbox to
// complete magic-link sign-in (same constraint as sign-in.spec.ts) — full
// create/edit/deactivate flows are verified manually via `pnpm dev`.
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
