import Link from "next/link";

import { ContactsTable } from "./contacts-table";
import { buttonVariants } from "@/components/ui/button";
import { getContacts } from "@/server/contacts";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function ContactsPage() {
  const [contacts, locale] = await Promise.all([getContacts(), getLocale()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "contact.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "contact.count", contacts.length)}
          </p>
        </div>
        <Link href="/contacts/new" className={buttonVariants()}>
          {t(locale, "contact.new")}
        </Link>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  );
}
