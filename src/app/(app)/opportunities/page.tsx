import Link from "next/link";

import { OpportunitiesTable } from "./opportunities-table";
import { buttonVariants } from "@/components/ui/button";
import { getOpportunities } from "@/server/opportunities";

export default async function OpportunitiesPage() {
  const opportunities = await getOpportunities();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Opportunities</h2>
          <p className="text-sm text-muted-foreground">
            {opportunities.length}{" "}
            {opportunities.length === 1 ? "opportunity" : "opportunities"}
          </p>
        </div>
        <Link href="/opportunities/new" className={buttonVariants()}>
          New opportunity
        </Link>
      </div>

      <OpportunitiesTable opportunities={opportunities} />
    </div>
  );
}
