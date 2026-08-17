import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { contact } from "@/db/schema/contact";
import type { ContactFormInput } from "@/lib/validation/contact";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

export async function getContacts() {
  await requireUser();
  return db
    .select({
      id: contact.id,
      nameEn: contact.nameEn,
      companyId: contact.companyId,
      companyName: company.nameEn,
      jobTitle: contact.jobTitle,
      email: contact.email,
      phone: contact.phone,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
    })
    .from(contact)
    .innerJoin(company, eq(contact.companyId, company.id))
    .orderBy(asc(contact.nameEn));
}

export async function getContactsByCompany(companyId: string) {
  await requireUser();
  return db
    .select()
    .from(contact)
    .where(eq(contact.companyId, companyId))
    .orderBy(asc(contact.nameEn));
}

export async function getContactById(id: string) {
  await requireUser();
  const [row] = await db
    .select({ contact, company })
    .from(contact)
    .innerJoin(company, eq(contact.companyId, company.id))
    .where(eq(contact.id, id));

  return row ?? null;
}

export async function createContact(
  input: ContactFormInput,
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(contact)
      .values({ ...input, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "contact",
      entityId: created.id,
      message: `created contact ${created.nameEn}`,
    });

    return created;
  });
}

export async function updateContact(id: string, input: ContactFormInput) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(contact)
      .set(input)
      .where(eq(contact.id, id))
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "update",
      entityType: "contact",
      entityId: updated.id,
      message: `updated contact ${updated.nameEn}`,
    });

    return updated;
  });
}
