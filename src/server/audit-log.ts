import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  auditLog,
  type auditAction,
  type auditEntityType,
} from "@/db/schema/audit-log";
import { user } from "@/db/schema/auth";
import { requireAdmin } from "./auth";

// Same local redefinition convention already used per-file in
// quotations.ts/sales-orders.ts/purchase-orders.ts — no shared Tx type
// exists yet, not introducing one here as an unrelated change.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type AuditAction = (typeof auditAction.enumValues)[number];
type AuditEntityType = (typeof auditEntityType.enumValues)[number];

// Called from inside the same transaction as the mutation it describes
// (every call site wraps its statement(s) in db.transaction and passes the
// tx through) — the log entry commits or rolls back with the mutation, not
// as a best-effort side note. Event feed, not a field-level diff: message
// is the whole point, not a structured payload to reconstruct one from.
export async function logActivity(
  executor: Tx | typeof db,
  entry: {
    userId: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    message: string;
  },
): Promise<void> {
  await executor.insert(auditLog).values(entry);
}

// Admin-only (crm-spec.md's role split). Bounded LIMIT, not real pagination
// — same reasoning as every other list page in this app (remediation
// slice 6, docs/decisions.md). Optional per-user filter: "what has each
// user done" implies filtering, not just one global feed.
export async function getActivityLog(opts?: {
  userId?: string;
  limit?: number;
}) {
  await requireAdmin();
  return db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      message: auditLog.message,
      occurredAt: auditLog.occurredAt,
      userId: auditLog.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(auditLog)
    .innerJoin(user, eq(auditLog.userId, user.id))
    .where(opts?.userId ? eq(auditLog.userId, opts.userId) : undefined)
    .orderBy(desc(auditLog.occurredAt))
    .limit(opts?.limit ?? 200);
}
