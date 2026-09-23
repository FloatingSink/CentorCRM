import Link from "next/link";

import { OpportunitiesTable } from "./opportunities-table";
import { buttonVariants } from "@/components/ui/button";
import { getOpportunities } from "@/server/opportunities";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function OpportunitiesPage() {
  const [opportunities, locale] = await Promise.all([
    getOpportunities(),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "opportunity.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "opportunity.count", opportunities.length)}
          </p>
        </div>
        <Link href="/opportunities/new" className={buttonVariants()}>
          {t(locale, "opportunity.new")}
        </Link>
      </div>

      <OpportunitiesTable opportunities={opportunities} />
    </div>
  );
}
