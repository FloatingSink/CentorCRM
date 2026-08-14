import { expect, test } from "@playwright/test";

import { cleanupOrderChain } from "./helpers/db-cleanup";
import { acceptQuotation, createDraftQuotation } from "./helpers/fixtures";
import { formatMoney } from "../src/lib/money";

// Critical flow 2 (crm-spec.md §9, and the spec's own stated core business
// value, §1): an accepted quotation -> sales order -> a linked purchase
// order at a different (lower) unit price -> the margin section on the
// sales order's own detail page. Runs authenticated via the session
// global-setup.ts saved.
test.use({ storageState: "e2e/.auth/user.json" });

const RUN_ID = Date.now().toString(36);

// Both legs are SGD with an implicit 1:1 fx_rate_to_sgd, so margin math
// reduces to straight subtraction: easy to hand-verify, while still
// exercising the real convertMinorToSgd path (src/lib/money.ts) rather than
// just asserting "something rendered".
const SALES_UNIT_PRICE = "100.00";
const PURCHASE_UNIT_PRICE = "60.00";
const EXPECTED_SALES_VALUE_MINOR = 10000;
const EXPECTED_PURCHASE_VALUE_MINOR = 6000;
const EXPECTED_MARGIN_MINOR = 4000;
const EXPECTED_MARGIN_PCT = "40.0";

test("accepted quotation converts to a sales order, a linked purchase order at a different price shows the right margin", async ({
  page,
}) => {
  // Default 30s is far too tight — see the timeout comments in
  // helpers/fixtures.ts and above the purchase-order wait below on why
  // each step's own wait is generous. This flow chains five such steps
  // (opportunity, quotation, sales order, purchase order, margin page),
  // so the worst case adds up even when nothing is actually wrong.
  test.setTimeout(180000);

  const reference = `E2E-B2B-${RUN_ID}`;
  let opportunityId: string | undefined;
  let quotationId: string | undefined;
  let salesOrderId: string | undefined;
  let purchaseOrderId: string | undefined;

  try {
    ({ opportunityId, quotationId } = await createDraftQuotation(
      page,
      reference,
      SALES_UNIT_PRICE,
    ));
    await acceptQuotation(page);

    // --- Convert to sales order ---
    await page.getByRole("link", { name: "Convert to sales order" }).click();
    await page.waitForURL(/\/sales-orders\/new\?quotationId=/);
    await page.getByRole("button", { name: "Create sales order" }).click();
    // Generous timeout: sales-order-builder.tsx has no PDF preview of its
    // own, but `next dev` is one process shared by every worker, so CPU-
    // bound PDF rendering from a concurrently-running quotation/purchase-
    // order test can still starve this request. A prior 10s timeout here
    // caused a nastier failure mode than a slow test: the server-side
    // create had already succeeded by the time the client gave up
    // waiting, so salesOrderId never got captured, cleanup then skipped
    // deleting the real (orphaned) row, and the *next* run's quotation
    // delete failed on a stale FK — worth the extra headroom to avoid.
    await page.waitForURL(/\/sales-orders\/(?!new)[^/?]+$/, {
      timeout: 30000,
    });
    salesOrderId = page.url().split("/").pop();

    // --- Linked purchase order, at a different (lower) unit price ---
    await page
      .getByRole("link", { name: "Create linked purchase order" })
      .click();
    await page.waitForURL(/\/purchase-orders\/new\?linkedSalesOrderId=/);

    await page.getByLabel("Legal entity (buyer)").click();
    await page.getByRole("option", { name: /CGPL/ }).click();

    // Supplier defaults to "External company" — switch to one of our own
    // legal entities, matching the real back-to-back pattern crm-spec.md §5
    // describes (an internal leg, not an external supplier). By this point
    // the buyer's own "Select an entity" trigger is already filled in, so
    // this now uniquely matches the (still-empty) supplier trigger.
    await page.getByRole("radio", { name: "Our own legal entity" }).click();
    await page.getByText("Select an entity", { exact: true }).click();
    await page.getByRole("option", { name: /ITP/ }).click();

    const lineRow = page.locator("table tbody tr").first();
    const unitPriceInput = lineRow.getByPlaceholder("0.00").first();
    await unitPriceInput.fill("");
    await unitPriceInput.fill(PURCHASE_UNIT_PRICE);

    await page.getByRole("button", { name: "Create purchase order" }).click();
    // Generous timeout: purchase-order-builder.tsx also has a live PDF
    // preview panel (previewPurchaseOrderPdfAction), which shares the same
    // renderToBuffer slowness explained in helpers/fixtures.ts.
    await page.waitForURL(/\/purchase-orders\/(?!new)[^/?]+$/, {
      timeout: 40000,
    });
    purchaseOrderId = page.url().split("/").pop();

    // --- Margin, back on the sales order's own detail page ---
    await page.goto(`/sales-orders/${salesOrderId}`);

    const salesRow = page
      .locator("div.flex.justify-between")
      .filter({ hasText: "Sales value (SGD)" });
    await expect(salesRow).toContainText(
      formatMoney(EXPECTED_SALES_VALUE_MINOR, "SGD"),
    );

    const purchaseRow = page
      .locator("div.flex.justify-between")
      .filter({ hasText: "Purchase value (SGD)" });
    await expect(purchaseRow).toContainText(
      formatMoney(EXPECTED_PURCHASE_VALUE_MINOR, "SGD"),
    );

    // Plain "div.flex.justify-between" filtered by "Margin" also matches
    // the section header ("Linked purchase orders & margin") — hasText is
    // a case-insensitive substring match, and that heading contains
    // "margin" too. font-heading is the class that's actually unique to
    // this specific row.
    const marginRow = page.locator("div.flex.justify-between.font-heading");
    await expect(marginRow).toContainText(
      formatMoney(EXPECTED_MARGIN_MINOR, "SGD"),
    );
    await expect(marginRow).toContainText(`${EXPECTED_MARGIN_PCT}%`);
  } finally {
    await cleanupOrderChain({
      purchaseOrderId,
      salesOrderId,
      quotationId,
      opportunityId,
    });
  }
});
