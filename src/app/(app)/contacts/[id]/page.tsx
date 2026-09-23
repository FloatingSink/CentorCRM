import Link from "next/link";
import { notFound } from "next/navigation";

import { updateContactAction } from "../actions";
import { ContactForm } from "../contact-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { TaskPanel } from "@/components/task-panel";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getInitials } from "@/lib/initials";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanies } from "@/server/companies";
import { getContactById } from "@/server/contacts";
import { getDocumentsForRelated } from "@/server/documents";
import { getTasksForRelated } from "@/server/tasks";
import { getUsers } from "@/server/users";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    session,
    result,
    companies,
    activities,
    documents,
    tasks,
    users,
    locale,
  ] = await Promise.all([
    auth(),
    getContactById(id),
    getCompanies(),
    getActivitiesForRelated("contact", id),
    getDocumentsForRelated("contact", id),
    getTasksForRelated("contact", id),
    getUsers(),
    getLocale(),
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
              {contact.isActive
                ? t(locale, "common.active")
                : t(locale, "common.inactive")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {contact.jobTitle
              ? `${contact.jobTitle}${company ? " · " : ""}`
              : ""}
            {company ? (
              <Link
                href={`/companies/${company.id}`}
                className="hover:underline"
              >
                {company.nameEn}
              </Link>
            ) : null}
          </p>
        </div>
      </div>

      <ContactForm
        action={updateContactAction.bind(null, id)}
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
        submitLabel="common.saveChanges"
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

      <TaskPanel
        relatedType="contact"
        relatedId={id}
        tasks={tasks}
        users={users}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
