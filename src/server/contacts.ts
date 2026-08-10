import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { contact } from "@/db/schema/contact";
import type { ContactFormInput } from "@/lib/validation/contact";

export function getContacts() {
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

export function getContactsByCompany(companyId: string) {
  return db
    .select()
    .from(contact)
    .where(eq(contact.companyId, companyId))
    .orderBy(asc(contact.nameEn));
}

export async function getContactById(id: string) {
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
  const [created] = await db
    .insert(contact)
    .values({ ...input, createdBy })
    .returning();

  return created;
}

export async function updateContact(id: string, input: ContactFormInput) {
  const [updated] = await db
    .update(contact)
    .set(input)
    .where(eq(contact.id, id))
    .returning();

  return updated;
}
