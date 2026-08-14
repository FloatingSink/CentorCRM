import Link from "next/link";

import { QuotationsTable } from "./quotations-table";
import { buttonVariants } from "@/components/ui/button";
import { getQuotations } from "@/server/quotations";

export default async function QuotationsPage() {
  const quotations = await getQuotations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Quotations</h2>
          <p className="text-sm text-muted-foreground">
            {quotations.length}{" "}
            {quotations.length === 1 ? "quotation" : "quotations"}
          </p>
        </div>
        <Link href="/quotations/new" className={buttonVariants()}>
          New quotation
        </Link>
      </div>

      <QuotationsTable quotations={quotations} />
    </div>
  );
}
