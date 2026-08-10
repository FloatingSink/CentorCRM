import Link from "next/link";
import { notFound } from "next/navigation";

import { updateContactAction } from "../actions";
import { ContactForm } from "../contact-form";
import { getCompanies } from "@/server/companies";
import { getContactById } from "@/server/contacts";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, companies] = await Promise.all([
    getContactById(id),
    getCompanies(),
  ]);
  if (!result) {
    notFound();
  }

  const { contact, company } = result;

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">{contact.nameEn}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        <Link href={`/companies/${company.id}`} className="hover:underline">
          {company.nameEn}
        </Link>
      </p>
      <ContactForm
        action={updateContactAction.bind(null, id, contact.companyId)}
        companies={companies}
        defaultValues={{
          companyId: contact.companyId,
          nameEn: contact.nameEn,
          nameZh: contact.nameZh,
          jobTitle: contact.jobTitle,
          email: contact.email,
          phone: contact.phone,
          wechatId: contact.wechatId,
          preferredLanguage: contact.preferredLanguage,
          isPrimary: contact.isPrimary,
          isActive: contact.isActive,
          notes: contact.notes,
        }}
        mode="edit"
        submitLabel="Save changes"
      />
    </div>
  );
}
