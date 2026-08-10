import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { legalEntity } from "@/db/schema";

export function getLegalEntities() {
  return db.select().from(legalEntity).orderBy(asc(legalEntity.shortCode));
}
