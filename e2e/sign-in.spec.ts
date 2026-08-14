import { expect, test } from "@playwright/test";

// Smoke test only: confirms the sign-in form renders without completing the
// actual magic-link flow, which needs a real inbox (MailDev, run locally —
// see e2e/global-setup.ts) and is exercised once for the whole suite there
// rather than per spec.
test("sign-in page renders the magic-link form", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByText("CENTOR CRM")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send magic link" }),
  ).toBeVisible();
});
