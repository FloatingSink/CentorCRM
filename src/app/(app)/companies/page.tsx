import Link from "next/link";

import { CompaniesTable } from "./companies-table";
import { buttonVariants } from "@/components/ui/button";
import { getCompanies } from "@/server/companies";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Companies</h2>
          <p className="text-sm text-muted-foreground">
            {companies.length}{" "}
            {companies.length === 1 ? "company" : "companies"}
          </p>
        </div>
        <Link href="/companies/new" className={buttonVariants()}>
          New company
        </Link>
      </div>

      <CompaniesTable companies={companies} />
    </div>
  );
}
