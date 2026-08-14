import { expect, test } from "@playwright/test";

import { cleanupOrderChain } from "./helpers/db-cleanup";
import { acceptQuotation, createDraftQuotation } from "./helpers/fixtures";

// Critical flow 1 (crm-spec.md §9): opportunity -> quotation -> PDF export
// -> status transitions. Runs authenticated via the session global-setup.ts
// saved, against the seeded fixtures in src/db/seed.ts (legal entity CGPL,
// company "China Railway Tunnel Group", project "Panama Metro Line 3", and
// one of the 9 seeded products).
test.use({ storageState: "e2e/.auth/user.json" });

const RUN_ID = Date.now().toString(36);

test("create an opportunity, build a quotation, export a valid PDF, and move it through status transitions", async ({
  page,
}) => {
  // Default 30s is too tight — see the timeout comments in
  // helpers/fixtures.ts on why each step's wait is itself generous.
  test.setTimeout(120000);

  const reference = `E2E-QUOTE-${RUN_ID}`;
  let opportunityId: string | undefined;
  let quotationId: string | undefined;

  try {
    ({ opportunityId, quotationId } = await createDraftQuotation(
      page,
      reference,
      "100.00",
    ));

    // --- PDF export: fetch the same route "Export PDF" links to, and check
    // the response is a real PDF rather than clicking through a new tab. ---
    const pdfResponse = await page.request.get(
      `/quotations/${quotationId}/pdf`,
    );
    expect(pdfResponse.ok()).toBe(true);
    const pdfBytes = await pdfResponse.body();
    expect(pdfBytes.subarray(0, 5).toString("utf-8")).toBe("%PDF-");

    // --- Status transitions: draft -> sent -> accepted ---
    await acceptQuotation(page);
  } finally {
    await cleanupOrderChain({ quotationId, opportunityId });
  }
});
