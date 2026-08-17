import { chromium, type FullConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { mkdir } from "node:fs/promises";
import path from "node:path";

loadEnv({ path: ".env.local" });

// Runs once before the whole suite. Signs the seeded admin user in by
// inserting a `session` row directly (same mechanism verified working
// against the real Auth.js cookie shape during the Neon region-move
// verification, docs/decisions.md) rather than driving a real Microsoft
// OAuth redirect — that needs an interactive Microsoft login, which can't
// be automated in a headless browser. Saves the resulting session as
// storage state so individual spec files can reuse it via
// `test.use({ storageState: "e2e/.auth/user.json" })` instead of each
// doing their own sign-in.
const EMAIL = "yjialong2000@gmail.com";
const STORAGE_STATE_PATH = "e2e/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  await mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const postgres = (await import("postgres")).default;
  const client = postgres(process.env.DATABASE_URL!);

  const [seededUser] = await client`
    select id from "user" where email = ${EMAIL}
  `;
  if (!seededUser) {
    await client.end();
    throw new Error(
      `No seeded user with email ${EMAIL} — run \`pnpm db:seed\` first.`,
    );
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await client`
    insert into session (session_token, user_id, expires)
    values (${sessionToken}, ${seededUser.id}, ${expires})
  `;
  await client.end();

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    // Cookie shape matches @auth/core's defaultCookies() for a non-HTTPS
    // origin: no "__Secure-" prefix, plain "authjs.session-token" name.
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: new URL(baseURL).hostname,
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        expires: Math.floor(expires.getTime() / 1000),
      },
    ]);

    // Confirms the injected cookie is actually recognized as a valid
    // session by the running app, not just present in the browser.
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);
    await page.waitForURL(`${baseURL}/`, { timeout: 10000 });

    await context.storageState({ path: STORAGE_STATE_PATH });
  } finally {
    await browser.close();
  }
}
