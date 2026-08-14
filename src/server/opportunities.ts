import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { opportunity } from "@/db/schema/opportunity";
import { project } from "@/db/schema/project";
import type { OpportunityFormInput } from "@/lib/validation/opportunity";

export function getOpportunities() {
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
  const [created] = await db
    .insert(opportunity)
    .values({ ...input, createdBy })
    .returning();

  return created;
}

export async function updateOpportunity(
  id: string,
  input: OpportunityFormInput,
) {
  const [updated] = await db
    .update(opportunity)
    .set(input)
    .where(eq(opportunity.id, id))
    .returning();

  return updated;
}
