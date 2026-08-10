import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCompanyAction } from "../actions";
import { CompanyForm } from "../company-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCompanyById } from "@/server/companies";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCompanyById(id);
  if (!result) {
    notFound();
  }

  const { company, roles, contacts } = result;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{company.nameEn}</h2>
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
        submitLabel="Save changes"
      />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Contacts</h3>
          <Link
            href={`/contacts/new?companyId=${id}`}
            className={buttonVariants()}
          >
            Add contact
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Primary</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="hover:underline"
                  >
                    {contact.nameEn}
                  </Link>
                </TableCell>
                <TableCell>{contact.jobTitle}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.isPrimary ? "Yes" : "No"}</TableCell>
                <TableCell>{contact.isActive ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
