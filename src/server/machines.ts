import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { machine } from "@/db/schema/machine";
import { project } from "@/db/schema/project";
import type { MachineFormInput } from "@/lib/validation/machine";

export function getMachinesByProject(projectId: string) {
  return db
    .select()
    .from(machine)
    .where(eq(machine.projectId, projectId))
    .orderBy(asc(machine.designation));
}

export async function getMachineById(id: string) {
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
  const [created] = await db
    .insert(machine)
    .values({ ...input, createdBy })
    .returning();

  return created;
}

export async function updateMachine(id: string, input: MachineFormInput) {
  const [updated] = await db
    .update(machine)
    .set(input)
    .where(eq(machine.id, id))
    .returning();

  return updated;
}
