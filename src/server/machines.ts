import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { machine } from "@/db/schema/machine";
import { project } from "@/db/schema/project";
import type { MachineFormInput } from "@/lib/validation/machine";
import { requireUser } from "./auth";

export async function getMachinesByProject(projectId: string) {
  await requireUser();
  return db
    .select()
    .from(machine)
    .where(eq(machine.projectId, projectId))
    .orderBy(asc(machine.designation));
}

export async function getMachineById(id: string) {
  await requireUser();
  const [row] = await db
    .select({ machine, project })
    .from(machine)
    .innerJoin(project, eq(machine.projectId, project.id))
    .where(eq(machine.id, id));

  return row ?? null;
}

export async function createMachine(
  input: MachineFormInput,
  createdBy: string,
) {
  await requireUser();
  const [created] = await db
    .insert(machine)
    .values({ ...input, createdBy })
    .returning();

  return created;
}

export async function updateMachine(id: string, input: MachineFormInput) {
  await requireUser();
  const [updated] = await db
    .update(machine)
    .set(input)
    .where(eq(machine.id, id))
    .returning();

  return updated;
}
