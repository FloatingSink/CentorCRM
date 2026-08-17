import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/schema/auth";
import { requireUser } from "./auth";

// Just the lookup the project-owner <Select> needs — a full Users
// management screen is a later Settings phase (crm-spec.md §8).
export async function getUsers() {
  await requireUser();
  return db
    .select({ id: user.id, name: user.name })
    .from(user)
    .orderBy(asc(user.name));
}
