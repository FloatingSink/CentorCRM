import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { machine } from "@/db/schema/machine";
import { project } from "@/db/schema/project";
import type { MachineFormInput } from "@/lib/validation/machine";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

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
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(machine)
      .values({ ...input, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "machine",
      entityId: created.id,
      message: `created machine ${created.designation}`,
    });

    return created;
  });
}

export async function updateMachine(id: string, input: MachineFormInput) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(machine)
      .set(input)
      .where(eq(machine.id, id))
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "update",
      entityType: "machine",
      entityId: updated.id,
      message: `updated machine ${updated.designation}`,
    });

    return updated;
  });
}
