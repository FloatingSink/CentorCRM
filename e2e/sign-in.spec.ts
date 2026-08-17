import { expect, test } from "@playwright/test";

// Smoke test only: confirms the sign-in page renders the Microsoft SSO
// button without completing an actual OAuth round trip, which needs a real
// interactive Microsoft login and can't be automated headlessly — the
// suite's authenticated coverage instead signs in via a directly-injected
// session row, see e2e/global-setup.ts.
test("sign-in page renders the Microsoft sign-in button", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page.getByText("CENTOR CRM")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with Microsoft" }),
  ).toBeVisible();
});
