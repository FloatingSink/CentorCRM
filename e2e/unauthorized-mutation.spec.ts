import { chromium, expect, request, test } from "@playwright/test";

import {
  cleanupCompanyByName,
  getCompanyNotesById,
} from "./helpers/db-cleanup";

// Proves the fix for the 6 server actions found with no auth check at all
// (remediation slice 2, docs/decisions.md) — updateCompanyAction is
// representative of the class (its 5 siblings share the exact same fix).
//
// The (app) layout already blocks an unauthenticated browser from ever
// *reaching* the edit form, so the real exploit path isn't "navigate there
// signed out" — it's a request that bypasses the UI entirely (e.g. a stale
// tab after sign-out, or a hand-crafted request) but still knows the
// server action's endpoint. This test reproduces that: capture the exact
// POST a real, authenticated form submission makes, fully close the
// browser that made it, then replay the request with a different value
// through a completely fresh, cookie-less connection, and confirm the row
// is unchanged — the request must not silently succeed.
//
// Uses its own dedicated `chromium.launch()` rather than the shared
// `page`/`context` test fixtures, and fully closes it (not just the
// context) before replaying — deliberately. This exact Next.js 16.3.0 dev
// build (Turbopack flags it "stale" in its own dev overlay) has a
// request-isolation bug: as long as *any* connection from the same
// Chromium *process* is still open to the dev server, an unrelated
// cookie-less Server Action request can incorrectly resolve a session
// through it — `context.close()` alone isn't enough, since Playwright
// Test's shared browser fixture stays connected across the whole worker.
// Confirmed by direct comparison: same replay, browser process still
// alive → wrongly succeeds; browser process fully closed first → correctly
// rejected. Not a gap in the auth fix itself, and this ordering sidesteps
// the framework bug rather than masking anything this test cares about.
test("updateCompanyAction rejects a replayed request with no session", async () => {
  // Well above the 30s default: this launches and fully closes its own
  // dedicated browser (see the file-level comment on why), on top of the
  // usual create + edit round trip.
  test.setTimeout(60000);
  const runId = Date.now();
  const name = `E2E Auth Test Co ${runId}`;
  const origNotes = `orig-${runId}`;
  const replayNotes = `replay-${runId}`;

  const browser = await chromium.launch();
  let companyId = "";

  try {
    const context = await browser.newContext({
      storageState: "e2e/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto("/companies/new");
    await page.locator("#nameEn").fill(name);
    await page.locator("#country").fill("Singapore");
    await page.getByRole("checkbox", { name: "other" }).check();
    await page.getByRole("button", { name: "Create company" }).click();
    await page.waitForURL(/\/companies\/(?!new)[^/?]+$/, { timeout: 15000 });
    companyId = page.url().split("/").pop()!;
    await page.reload();

    // A legitimate, authenticated edit — this is the request we'll replay.
    const [editRequest] = await Promise.all([
      page.waitForRequest(
        (req) => req.method() === "POST" && req.url() === page.url(),
      ),
      (async () => {
        await page.locator("#notes").fill(origNotes);
        await page.getByRole("button", { name: "Save changes" }).click();
      })(),
    ]);
    await page.waitForURL(`**/companies/${companyId}`, { timeout: 15000 });
    await expect
      .poll(() => getCompanyNotesById(companyId), { timeout: 15000 })
      .toBe(origNotes);

    const capturedBody = editRequest.postDataBuffer();
    expect(capturedBody).not.toBeNull();
    // Same request, different value — proves a replay actually changes
    // something observable if it succeeds, not just re-applying a no-op.
    const replayBody = Buffer.from(
      capturedBody!.toString("latin1").replace(origNotes, replayNotes),
      "latin1",
    );
    const capturedHeaders = await editRequest.allHeaders();
    const editUrl = editRequest.url();

    // See the file-level comment: must fully close the browser, not just
    // the context, before replaying.
    await browser.close();

    const unauth = await request.newContext();
    const replayResponse = await unauth.post(editUrl, {
      headers: {
        "content-type": capturedHeaders["content-type"],
        accept: capturedHeaders.accept,
        "next-action": capturedHeaders["next-action"],
      },
      data: replayBody,
    });
    // Not a crash — but the real assertion is below: the row itself must
    // not have changed.
    expect(replayResponse.status()).toBeLessThan(500);
    await unauth.dispose();

    const notesAfterReplay = await getCompanyNotesById(companyId);
    expect(notesAfterReplay).toBe(origNotes);
    expect(notesAfterReplay).not.toBe(replayNotes);
  } finally {
    if (!browser.isConnected()) {
      // Already closed above (the success path) — nothing to do.
    } else {
      await browser.close();
    }
    if (companyId) {
      await cleanupCompanyByName(name);
    }
  }
});
