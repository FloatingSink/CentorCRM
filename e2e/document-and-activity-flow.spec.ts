import { expect, test } from "@playwright/test";

import {
  cleanupActivityBySubject,
  cleanupDocumentByTitle,
  getCompanyIdByName,
} from "./helpers/db-cleanup";

// Critical flow 3 (crm-spec.md §9): uploading a real document (R2
// credentials are present in .env.local, so this hits real object storage,
// not a mock) and logging an activity against an entity — exercised here
// on the seeded "China Railway Tunnel Group" company. Runs authenticated
// via the session global-setup.ts saved.
test.use({ storageState: "e2e/.auth/user.json" });

const RUN_ID = Date.now().toString(36);

test("upload a document and log an activity on a company", async ({ page }) => {
  // Default 30s can be tight under shared dev-server load — see the
  // timeout comments in helpers/fixtures.ts for why (`next dev` is one
  // process shared by every worker, so an unrelated concurrently-running
  // test's CPU-bound PDF rendering can starve this one's real R2 upload).
  test.setTimeout(60000);

  const documentTitle = `E2E test document ${RUN_ID}`;
  const activitySubject = `E2E test activity ${RUN_ID}`;

  const companyId = await getCompanyIdByName("China Railway Tunnel Group");

  try {
    await page.goto(`/companies/${companyId}`);

    // --- Document upload ---
    await page.getByLabel("Title").fill(documentTitle);
    await page.getByLabel("Type (optional)").fill("E2E fixture");
    await page.getByLabel("File").setInputFiles({
      name: "e2e-fixture.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("E2E flow test fixture — safe to delete.", "utf-8"),
    });
    await page.getByRole("button", { name: "Upload document" }).click();
    await expect(page.getByText(documentTitle)).toBeVisible({
      timeout: 10000,
    });

    // --- Activity log ---
    await page.getByLabel("Subject").fill(activitySubject);
    await page.getByRole("button", { name: "Log activity" }).click();
    await expect(page.getByText(activitySubject)).toBeVisible({
      timeout: 10000,
    });
  } finally {
    await cleanupDocumentByTitle(documentTitle);
    await cleanupActivityBySubject(activitySubject);
  }
});
