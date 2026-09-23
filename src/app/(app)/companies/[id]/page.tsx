import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCompanyAction } from "../actions";
import { CompanyForm } from "../company-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { DocumentLibrary } from "@/components/document-library";
import { TaskPanel } from "@/components/task-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { pickName } from "@/lib/display-name";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import { getInitials } from "@/lib/initials";
import { getActivitiesForRelated } from "@/server/activities";
import { getCompanyById } from "@/server/companies";
import { getDocumentsForRelated } from "@/server/documents";
import { getTasksForRelated } from "@/server/tasks";
import { getUsers } from "@/server/users";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, result, activities, documents, tasks, users, locale] =
    await Promise.all([
      auth(),
      getCompanyById(id),
      getActivitiesForRelated("company", id),
      getDocumentsForRelated("company", id),
      getTasksForRelated("company", id),
      getUsers(),
      getLocale(),
    ]);
  if (!result) {
    notFound();
  }

  const { company, roles, contacts } = result;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-[52px] flex-none items-center justify-center rounded-md bg-neutral-800 font-heading text-lg text-neutral-100">
          {getInitials(company.nameEn)}
        </span>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl">
              {pickName(company.nameEn, company.nameZh, locale)}
            </h2>
            <Badge variant={company.isActive ? "outline" : "secondary"}>
              {company.isActive
                ? t(locale, "common.active")
                : t(locale, "common.inactive")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {company.country}
            {roles.length > 0
              ? ` · ${roles.map((r) => t(locale, `companyRole.${r}`)).join("、")}`
              : ""}
          </p>
        </div>
      </div>

      <CompanyForm
        action={updateCompanyAction.bind(null, id)}
        defaultValues={{
          nameEn: company.nameEn,
          nameZh: company.nameZh,
          country: company.country,
          registrationNo: company.registrationNo,
          address: company.address,
          website: company.website,
          notes: company.notes,
          isActive: company.isActive,
          roles,
        }}
        mode="edit"
        submitLabel="common.saveChanges"
      />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg">{t(locale, "company.contacts")}</h3>
          <Link
            href={`/contacts/new?companyId=${id}`}
            className={buttonVariants()}
          >
            {t(locale, "company.addContact")}
          </Link>
        </div>
        <Card className="py-4">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">
                    {t(locale, "company.contactName")}
                  </TableHead>
                  <TableHead>{t(locale, "company.contactJobTitle")}</TableHead>
                  <TableHead>{t(locale, "company.contactEmail")}</TableHead>
                  <TableHead>{t(locale, "company.contactPhone")}</TableHead>
                  <TableHead>{t(locale, "company.contactPrimary")}</TableHead>
                  <TableHead className="pr-4">
                    {t(locale, "company.colActive")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="pl-4 font-medium">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="hover:underline"
                      >
                        {pickName(contact.nameEn, contact.nameZh, locale)}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.jobTitle}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>
                      {contact.isPrimary ? (
                        <Badge variant="outline">
                          {t(locale, "company.contactPrimary")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      {contact.isActive
                        ? t(locale, "common.yes")
                        : t(locale, "common.no")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DocumentLibrary
        relatedType="company"
        relatedId={id}
        documents={documents}
      />

      <ActivityTimeline
        relatedType="company"
        relatedId={id}
        activities={activities}
      />

      <TaskPanel
        relatedType="company"
        relatedId={id}
        tasks={tasks}
        users={users}
        currentUserId={session!.user.id}
      />
    </div>
  );
}
