import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { machine } from "@/db/schema/machine";
import { project } from "@/db/schema/project";
import type { ProjectFormInput } from "@/lib/validation/project";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

export async function getProjects() {
  await requireUser();
  return db
    .select({
      id: project.id,
      nameEn: project.nameEn,
      clientCompanyId: project.clientCompanyId,
      clientCompanyName: company.nameEn,
      country: project.country,
      status: project.status,
      isActive: project.isActive,
    })
    .from(project)
    .innerJoin(company, eq(project.clientCompanyId, company.id))
    .orderBy(asc(project.nameEn));
}

export async function getProjectById(id: string) {
  await requireUser();
  const [projectRow] = await db
    .select()
    .from(project)
    .where(eq(project.id, id));
  if (!projectRow) return null;

  const machines = await db
    .select()
    .from(machine)
    .where(eq(machine.projectId, id))
    .orderBy(asc(machine.designation));

  return { project: projectRow, machines };
}

export async function createProject(
  input: ProjectFormInput,
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(project)
      .values({ ...input, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "project",
      entityId: created.id,
      message: `created project ${created.nameEn}`,
    });

    return created;
  });
}

export async function updateProject(id: string, input: ProjectFormInput) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(project)
      .set(input)
      .where(eq(project.id, id))
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "update",
      entityType: "project",
      entityId: updated.id,
      message: `updated project ${updated.nameEn}`,
    });

    return updated;
  });
}
