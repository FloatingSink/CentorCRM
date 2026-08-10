import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContacts } from "@/server/contacts";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <Link href="/contacts/new" className={buttonVariants()}>
          New contact
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
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
              <TableCell>
                <Link
                  href={`/companies/${contact.companyId}`}
                  className="hover:underline"
                >
                  {contact.companyName}
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
  );
}
