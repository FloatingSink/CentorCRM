// MailDev REST API wrapper used to complete real magic-link sign-ins in
// e2e tests, against the MailDev instance that must already be running
// locally (SMTP on :1025, matching .env.local's EMAIL_SERVER, REST API on
// :1080) — see e2e/global-setup.ts for why this can't be auto-started.
const MAILDEV_API = "http://localhost:1080/api";

type MailDevEmail = {
  html: string;
  to: { address: string }[];
};

export async function clearInbox(): Promise<void> {
  await fetch(`${MAILDEV_API}/email/all`, { method: "DELETE" });
}

// Polls for an email to the given address and extracts the first link from
// its HTML body (the sign-in magic link). Throws if none arrives in time.
export async function getMagicLink(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${MAILDEV_API}/email`);
    const emails = (await res.json()) as MailDevEmail[];
    const mail = emails.find((e) => e.to.some((t) => t.address === email));
    if (mail) {
      const match = mail.html.match(/href="([^"]+)"/);
      if (match) return match[1].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No magic-link email arrived for ${email} in time`);
}
