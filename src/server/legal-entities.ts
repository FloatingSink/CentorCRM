import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { legalEntity } from "@/db/schema";
import { requireUser } from "./auth";

export async function getLegalEntities() {
  await requireUser();
  return db.select().from(legalEntity).orderBy(asc(legalEntity.shortCode));
}
