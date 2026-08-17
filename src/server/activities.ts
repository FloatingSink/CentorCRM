import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { activity, type activityRelatedTypeEnum } from "@/db/schema/activity";
import { user } from "@/db/schema/auth";
import type { ActivityCreateInput } from "@/lib/validation/activity";
import { requireUser } from "./auth";

type RelatedType = (typeof activityRelatedTypeEnum.enumValues)[number];

export async function getActivitiesForRelated(
  relatedType: RelatedType,
  relatedId: string,
) {
  await requireUser();
  return db
    .select({
      id: activity.id,
      type: activity.type,
      subject: activity.subject,
      body: activity.body,
      occurredAt: activity.occurredAt,
      userId: activity.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(activity)
    .innerJoin(user, eq(activity.userId, user.id))
    .where(
      and(
        eq(activity.relatedType, relatedType),
        eq(activity.relatedId, relatedId),
      ),
    )
    .orderBy(desc(activity.occurredAt));
}

export async function createActivity(
  input: ActivityCreateInput,
  userId: string,
  createdBy: string,
) {
  await requireUser();
  const [created] = await db
    .insert(activity)
    .values({ ...input, userId, createdBy })
    .returning();

  return created;
}
