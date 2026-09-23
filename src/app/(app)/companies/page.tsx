import Link from "next/link";

import { CompaniesTable } from "./companies-table";
import { buttonVariants } from "@/components/ui/button";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import { getCompanies } from "@/server/companies";

export default async function CompaniesPage() {
  const [companies, locale] = await Promise.all([getCompanies(), getLocale()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "company.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "company.count", companies.length)}
          </p>
        </div>
        <Link href="/companies/new" className={buttonVariants()}>
          {t(locale, "company.new")}
        </Link>
      </div>

      <CompaniesTable companies={companies} />
    </div>
  );
}
