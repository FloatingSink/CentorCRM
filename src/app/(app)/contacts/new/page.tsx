import { createContactAction } from "../actions";
import { ContactForm } from "../contact-form";
import { getCompanies } from "@/server/companies";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const [companies, locale] = await Promise.all([getCompanies(), getLocale()]);

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "contact.new")}</h2>
      <ContactForm
        action={createContactAction}
        companies={companies}
        defaultCompanyId={companyId}
        mode="create"
        submitLabel="contact.create"
      />
    </div>
  );
}
