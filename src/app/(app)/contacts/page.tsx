import Link from "next/link";

import { ContactsTable } from "./contacts-table";
import { buttonVariants } from "@/components/ui/button";
import { getContacts } from "@/server/contacts";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Contacts</h2>
          <p className="text-sm text-muted-foreground">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </p>
        </div>
        <Link href="/contacts/new" className={buttonVariants()}>
          New contact
        </Link>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}
