import { expect, type Page } from "@playwright/test";

// Shared setup for the quotation- and back-to-back-flow specs: creates an
// opportunity and a one-line quotation against the fixtures seeded by
// src/db/seed.ts (legal entity CGPL, company "China Railway Tunnel Group",
// project "Panama Metro Line 3", and whichever product sorts first in the
// picker). Leaves the quotation in "draft" — callers that need it further
// along (e.g. "accepted", to unlock "Convert to sales order") drive that
// themselves, since asserting the transition is often part of what the
// calling test is actually checking.
export async function createDraftQuotation(
  page: Page,
  reference: string,
  unitPrice: string,
): Promise<{ opportunityId: string; quotationId: string }> {
  await page.goto("/opportunities/new");
  await page.getByLabel("Reference").fill(reference);
  await page.getByLabel("Title").fill(`E2E fixture for ${reference}`);

  await page.getByLabel("Project").click();
  await page.getByRole("option", { name: "Panama Metro Line 3" }).click();

  await page.getByLabel("Customer").click();
  await page
    .getByRole("option", { name: "China Railway Tunnel Group" })
    .click();

  await page.getByLabel("Legal entity").click();
  await page.getByRole("option", { name: /CGPL/ }).click();

  await page.getByRole("button", { name: "Create opportunity" }).click();
  // (?!new) matters: without it this also matches the current
  // /opportunities/new URL itself, resolving instantly without ever
  // waiting for the real post-submit redirect. Timeout generous for the
  // same reason as the quotation wait below: `next dev` is one process
  // shared by every worker, so this can get starved by an unrelated
  // concurrently-running test's CPU-bound PDF rendering.
  await page.waitForURL(/\/opportunities\/(?!new)[^/?]+$/, {
    timeout: 30000,
  });
  const opportunityId = page.url().split("/").pop()!;

  await page.goto("/quotations/new");
  await page.getByLabel("Opportunity").click();
  await page.getByRole("option", { name: new RegExp(reference) }).click();

  const lineRow = page.locator("table tbody tr").first();
  await lineRow.getByText("Select a product").click();
  await page.getByRole("option").first().click();
  await lineRow.getByPlaceholder("0.00").first().fill(unitPrice);

  await page.getByRole("button", { name: "Create quotation" }).click();
  // Generous timeout, not the default 10s: createQuotationAction and the
  // live preview panel's own debounced preview action both call
  // @react-pdf/renderer's renderToBuffer, which is CPU-bound and blocks
  // `next dev`'s single event loop for several seconds — traced this
  // end-to-end (create POST + router.push refetch + router.refresh POST)
  // at anywhere from ~9.5s to ~14s across otherwise-identical runs against
  // a warm dev server with no other load. Doesn't happen in production,
  // where each request gets its own serverless instance.
  await page.waitForURL(/\/quotations\/(?!new)[^/?]+$/, { timeout: 40000 });
  const quotationId = page.url().split("/").pop()!;

  return { opportunityId, quotationId };
}

export async function acceptQuotation(page: Page): Promise<void> {
  await page.getByRole("button", { name: "sent", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "sent", exact: true }),
  ).toBeDisabled({ timeout: 15000 });

  await page.getByRole("button", { name: "accepted", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "accepted", exact: true }),
  ).toBeDisabled({ timeout: 15000 });
}
