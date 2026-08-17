import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

// A standalone connection, deliberately not going through src/db/client.ts —
// that file imports the full schema barrel (src/db/schema/index.ts), which
// transitively pulls in files using the "@/" path alias (e.g.
// src/db/schema/company.ts -> "@/lib/company-roles"). Playwright's dynamic
// `import()` doesn't apply tsconfig's path mapping the way Next.js/tsc do,
// so that alias fails to resolve here. Raw SQL sidesteps the whole schema
// import graph — this helper only ever needs a handful of columns anyway.
//
// Opens and closes a fresh connection per call rather than memoizing one
// for the whole test file: these calls run after the test's browser-driven
// flow, which can run 30-75s (see the timeout comments in
// helpers/fixtures.ts and the *.spec.ts files) — long enough that a
// connection left idle for that whole span occasionally goes stale against
// Neon and silently no-ops a delete (0 rows affected, no error) instead of
// throwing, which then surfaces later as a confusing FK violation on a row
// that "should" already be gone. A short-lived connection avoids that.
async function withSql<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  const sql = postgres(process.env.DATABASE_URL);
  try {
    return await fn(sql);
  } finally {
    await sql.end();
  }
}

// FK-safe deletion order, worked out the hard way earlier this session:
// order lines before their parent order, orders before the quotation they
// reference, quotation before its opportunity. Every id is optional so a
// single call can clean up however far a given test actually got. Runs as
// one transaction so a partial failure doesn't leave some rows deleted and
// others orphaned.
export async function cleanupOrderChain(ids: {
  purchaseOrderId?: string;
  salesOrderId?: string;
  quotationId?: string;
  opportunityId?: string;
}): Promise<void> {
  await withSql((db) =>
    db.begin(async (tx) => {
      if (ids.purchaseOrderId) {
        await tx`delete from order_line where purchase_order_id = ${ids.purchaseOrderId}`;
        await tx`delete from purchase_order where id = ${ids.purchaseOrderId}`;
      }
      if (ids.salesOrderId) {
        await tx`delete from order_line where sales_order_id = ${ids.salesOrderId}`;
        await tx`delete from sales_order where id = ${ids.salesOrderId}`;
      }
      if (ids.quotationId) {
        await tx`delete from quotation_line where quotation_id = ${ids.quotationId}`;
        await tx`delete from quotation where id = ${ids.quotationId}`;
      }
      if (ids.opportunityId) {
        await tx`delete from opportunity where id = ${ids.opportunityId}`;
      }
    }),
  );
}

// Not exposed anywhere in the app (documents are never deleted through the
// UI — src/lib/storage.ts has no deleteObject helper), so this is
// test-cleanup-only tooling, not app behavior. Best-effort: a storage
// hiccup here shouldn't fail the test's own assertions, which have already
// run by the time cleanup happens.
async function deleteR2Object(fileKey: string): Promise<void> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) return;

  try {
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucketName, Key: fileKey }),
    );
  } catch (err) {
    console.warn("e2e cleanup: failed to delete R2 object", fileKey, err);
  }
}

// Matched by title rather than id since the UI never surfaces a created
// document's id anywhere accessible to the test.
export async function cleanupDocumentByTitle(title: string): Promise<void> {
  await withSql(async (db) => {
    const [row] = await db<{ id: string; file_key: string }[]>`
      select id, file_key from document where title = ${title}
    `;
    if (!row) return;
    await deleteR2Object(row.file_key);
    await db`delete from document where id = ${row.id}`;
  });
}

export async function cleanupActivityBySubject(subject: string): Promise<void> {
  await withSql((db) => db`delete from activity where subject = ${subject}`);
}

// unauthorized-mutation.spec.ts's own throwaway fixture — not seeded data,
// created and torn down within that one test.
export async function cleanupCompanyByName(nameEn: string): Promise<void> {
  await withSql(async (db) => {
    const [row] = await db<{ id: string }[]>`
      select id from company where name_en = ${nameEn}
    `;
    if (!row) return;
    await db`delete from company_role where company_id = ${row.id}`;
    await db`delete from company where id = ${row.id}`;
  });
}

// Reads the current notes column directly — used to prove a replayed,
// unauthenticated mutation attempt did not actually change the row.
export async function getCompanyNotesById(id: string): Promise<string | null> {
  return withSql(async (db) => {
    const [row] = await db<{ notes: string | null }[]>`
      select notes from company where id = ${id}
    `;
    return row?.notes ?? null;
  });
}

// Looks up a seeded fixture's id directly rather than navigating the UI to
// find it — src/db/seed.ts's rows have no stable, guessable id otherwise.
export async function getCompanyIdByName(nameEn: string): Promise<string> {
  return withSql(async (db) => {
    const [row] = await db<{ id: string }[]>`
      select id from company where name_en = ${nameEn}
    `;
    if (!row) {
      throw new Error(
        `Seeded company "${nameEn}" not found — has \`pnpm db:seed\` been run?`,
      );
    }
    return row.id;
  });
}
