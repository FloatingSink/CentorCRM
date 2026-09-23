import { createCompanyAction } from "../actions";
import { CompanyForm } from "../company-form";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewCompanyPage() {
  const locale = await getLocale();

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "company.new")}</h2>
      <CompanyForm
        action={createCompanyAction}
        mode="create"
        submitLabel="company.create"
      />
    </div>
  );
}
