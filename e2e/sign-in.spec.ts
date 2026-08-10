import { expect, test } from "@playwright/test";

// Smoke test only: confirms the sign-in form renders. Completing the actual
// magic-link flow needs a real inbox, which isn't available in this setup.
test("sign-in page renders the magic-link form", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByText("CENTOR CRM")).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send magic link" }),
  ).toBeVisible();
});
