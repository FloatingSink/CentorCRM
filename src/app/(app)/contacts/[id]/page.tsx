import Link from "next/link";
import { notFound } from "next/navigation";

import { updateContactAction } from "../actions";
import { ContactForm } from "../contact-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/initials";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanies } from "@/server/companies";
import { getContactById } from "@/server/contacts";
import { getDocumentsForRelated } from "@/server/documents";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, companies, activities, documents] = await Promise.all([
    getContactById(id),
    getCompanies(),
    getActivitiesForRelated("contact", id),
    getDocumentsForRelated("contact", id),
  ]);
  if (!result) {
    notFound();
  }

  const { contact, company } = result;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-[52px] flex-none items-center justify-center rounded-md bg-neutral-800 font-heading text-lg text-neutral-100">
          {getInitials(contact.nameEn)}
        </span>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl">{contact.nameEn}</h2>
            <Badge variant={contact.isActive ? "outline" : "secondary"}>
              {contact.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {contact.jobTitle ? `${contact.jobTitle} · ` : ""}
            <Link href={`/companies/${company.id}`} className="hover:underline">
              {company.nameEn}
            </Link>
          </p>
        </div>
      </div>

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

      <DocumentLibrary
        relatedType="contact"
        relatedId={id}
        documents={documents}
      />

      <ActivityTimeline
        relatedType="contact"
        relatedId={id}
        activities={activities}
      />
    </div>
  );
}
