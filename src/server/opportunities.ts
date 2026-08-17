import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { opportunity } from "@/db/schema/opportunity";
import { project } from "@/db/schema/project";
import type { OpportunityFormInput } from "@/lib/validation/opportunity";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

export async function getOpportunities() {
  await requireUser();
  return db
    .select({
      id: opportunity.id,
      reference: opportunity.reference,
      title: opportunity.title,
      projectId: opportunity.projectId,
      projectName: project.nameEn,
      customerCompanyId: opportunity.customerCompanyId,
      customerCompanyName: company.nameEn,
      legalEntityId: opportunity.legalEntityId,
      stage: opportunity.stage,
      estimatedValue: opportunity.estimatedValue,
      currency: opportunity.currency,
      ownerUserId: opportunity.ownerUserId,
      isActive: opportunity.isActive,
    })
    .from(opportunity)
    .innerJoin(project, eq(opportunity.projectId, project.id))
    .innerJoin(company, eq(opportunity.customerCompanyId, company.id))
    .orderBy(desc(opportunity.createdAt));
}

export async function getOpportunityById(id: string) {
  await requireUser();
  const [row] = await db
    .select()
    .from(opportunity)
    .where(eq(opportunity.id, id));
  return row ?? null;
}

export async function createOpportunity(
  input: OpportunityFormInput,
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(opportunity)
      .values({ ...input, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "opportunity",
      entityId: created.id,
      message: `created opportunity ${created.reference}`,
    });

    return created;
  });
}

export async function updateOpportunity(
  id: string,
  input: OpportunityFormInput,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(opportunity)
      .where(eq(opportunity.id, id));

    const [updated] = await tx
      .update(opportunity)
      .set(input)
      .where(eq(opportunity.id, id))
      .returning();

    // Stage is one field among several this function can change, not a
    // dedicated status endpoint like quotations/orders — still logged as
    // "update", just with a more specific message when stage moved.
    const message =
      current && current.stage !== updated.stage
        ? `moved opportunity ${updated.reference} to stage ${updated.stage}`
        : `updated opportunity ${updated.reference}`;

    await logActivity(tx, {
      userId: actor.id,
      action: "update",
      entityType: "opportunity",
      entityId: updated.id,
      message,
    });

    return updated;
  });
}
