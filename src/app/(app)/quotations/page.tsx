import Link from "next/link";

import { QuotationsTable } from "./quotations-table";
import { buttonVariants } from "@/components/ui/button";
import { getQuotations } from "@/server/quotations";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function QuotationsPage() {
  const [quotations, locale] = await Promise.all([
    getQuotations(),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "quotation.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "quotation.count", quotations.length)}
          </p>
        </div>
        <Link href="/quotations/new" className={buttonVariants()}>
          {t(locale, "quotation.new")}
        </Link>
      </div>

      <QuotationsTable quotations={quotations} />
    </div>
  );
}
