import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company, companyRole } from "@/db/schema/company";
import { contact } from "@/db/schema/contact";
import type { CompanyFormInput } from "@/lib/validation/company";

export async function getCompanies() {
  const [companies, roles] = await Promise.all([
    db.select().from(company).orderBy(asc(company.nameEn)),
    db.select().from(companyRole),
  ]);

  const rolesByCompany = new Map<string, string[]>();
  for (const r of roles) {
    const list = rolesByCompany.get(r.companyId) ?? [];
    list.push(r.role);
    rolesByCompany.set(r.companyId, list);
  }

  return companies.map((c) => ({
    ...c,
    roles: rolesByCompany.get(c.id) ?? [],
  }));
}

export async function getCompanyById(id: string) {
  const [companyRow] = await db
    .select()
    .from(company)
    .where(eq(company.id, id));
  if (!companyRow) return null;

  const [roles, contacts] = await Promise.all([
    db.select().from(companyRole).where(eq(companyRole.companyId, id)),
    db
      .select()
      .from(contact)
      .where(eq(contact.companyId, id))
      .orderBy(asc(contact.nameEn)),
  ]);

  return { company: companyRow, roles: roles.map((r) => r.role), contacts };
}

export async function createCompany(
  input: CompanyFormInput,
  createdBy: string,
) {
  const { roles, ...companyData } = input;

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(company)
      .values({ ...companyData, createdBy })
      .returning();

    await tx
      .insert(companyRole)
      .values(roles.map((role) => ({ companyId: created.id, role })));

    return created;
  });
}

export async function updateCompany(id: string, input: CompanyFormInput) {
  const { roles, ...companyData } = input;

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(company)
      .set(companyData)
      .where(eq(company.id, id))
      .returning();

    await tx.delete(companyRole).where(eq(companyRole.companyId, id));
    await tx
      .insert(companyRole)
      .values(roles.map((role) => ({ companyId: id, role })));

    return updated;
  });
}
