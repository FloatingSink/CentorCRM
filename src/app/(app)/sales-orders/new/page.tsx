import Link from "next/link";

import { SalesOrderBuilder } from "../sales-order-builder";
import { getCompanies } from "@/server/companies";
import { getLegalEntities } from "@/server/legal-entities";
import { getOpportunityById } from "@/server/opportunities";
import { getProducts } from "@/server/products";
import { getProjects } from "@/server/projects";
import { getQuotationById, getQuotations } from "@/server/quotations";

export default async function NewSalesOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ quotationId?: string }>;
}) {
  const { quotationId } = await searchParams;

  if (!quotationId) {
    const quotations = await getQuotations();
    const accepted = quotations.filter((q) => q.status === "accepted");

    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl">New sales order</h2>
        <p className="text-sm text-muted-foreground">
          A sales order is created from an accepted quotation. Pick one:
        </p>
        <ul className="flex flex-col gap-2">
          {accepted.map((q) => (
            <li key={q.id}>
              <Link
                href={`/sales-orders/new?quotationId=${q.id}`}
                className="hover:underline"
              >
                {q.quoteNo} — {q.customerCompanyName}
              </Link>
            </li>
          ))}
          {accepted.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No accepted quotations yet.
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  const result = await getQuotationById(quotationId);
  if (!result) {
    return <p className="text-sm text-destructive">Quotation not found.</p>;
  }
  const { quotation, lines } = result;
  const opportunity = await getOpportunityById(quotation.opportunityId);

  const [legalEntities, companies, projects, products] = await Promise.all([
    getLegalEntities(),
    getCompanies(),
    getProjects(),
    getProducts(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">New sales order</h2>
      <SalesOrderBuilder
        mode="create"
        quoteNo={quotation.quoteNo}
        legalEntities={legalEntities}
        companies={companies}
        projects={projects}
        products={products}
        defaultHeader={{
          quotationId: quotation.id,
          legalEntityId: quotation.legalEntityId,
          customerCompanyId: quotation.customerCompanyId,
          customerLegalEntityId: null,
          projectId: opportunity?.projectId ?? "",
          signedDate: null,
          currency: quotation.currency,
          fxRateToSgd: "1.000000",
          incoterm: quotation.incoterm,
          namedPlace: quotation.namedPlace,
          governingLaw: null,
          arbitrationRules: null,
          contractNo: null,
          notes: null,
        }}
        defaultLines={lines.map((l) => ({
          productId: l.productId,
          descriptionOverride: l.descriptionOverride,
          quantity: l.quantity,
          uom: l.uom,
          unitPrice: l.unitPrice,
          discountPct: l.discountPct,
        }))}
      />
    </div>
  );
}
