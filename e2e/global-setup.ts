import { chromium, type FullConfig } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { clearInbox, getMagicLink } from "./helpers/maildev";

// Runs once before the whole suite. Requires MailDev running locally
// (see e2e/helpers/maildev.ts) — this signs in for real, once, and saves
// the resulting session as storage state so individual spec files can
// reuse it via `test.use({ storageState: "e2e/.auth/user.json" })`
// instead of repeating the magic-link round trip per test.
const EMAIL = "yjialong2000@gmail.com";
const STORAGE_STATE_PATH = "e2e/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  await mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await clearInbox();

    await page.goto(`${baseURL}/sign-in`);
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByRole("button", { name: "Send magic link" }).click();
    // The form submit itself redirects to next-auth's "check your email"
    // page; waiting for that to settle before navigating to the emailed
    // link avoids a race where the pending redirect overrides our own
    // navigation (found the hard way while building this suite).
    await page.waitForURL(/verify-request/, { timeout: 10000 });

    const link = await getMagicLink(EMAIL);
    await page.goto(link);
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });

    await page.context().storageState({ path: STORAGE_STATE_PATH });
  } finally {
    await browser.close();
  }
}
