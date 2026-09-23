import Link from "next/link";

import { SalesOrderBuilder } from "../sales-order-builder";
import { getCompanies } from "@/server/companies";
import { getLegalEntities } from "@/server/legal-entities";
import { getOpportunityById } from "@/server/opportunities";
import { getProducts } from "@/server/products";
import { getProjects } from "@/server/projects";
import { getQuotationById, getQuotations } from "@/server/quotations";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewSalesOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ quotationId?: string }>;
}) {
  const { quotationId } = await searchParams;

  if (!quotationId) {
    const [quotations, locale] = await Promise.all([
      getQuotations(),
      getLocale(),
    ]);
    const accepted = quotations.filter((q) => q.status === "accepted");

    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl">{t(locale, "salesOrder.new")}</h2>
        <p className="text-sm text-muted-foreground">
          {t(locale, "salesOrder.pickAcceptedQuotation")}
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
              {t(locale, "salesOrder.noAcceptedQuotations")}
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  const result = await getQuotationById(quotationId);
  if (!result) {
    return (
      <p className="text-sm text-destructive">
        {t(await getLocale(), "quotation.notFound")}
      </p>
    );
  }
  const { quotation, lines } = result;
  const opportunity = await getOpportunityById(quotation.opportunityId);

  const [legalEntities, companies, projects, products, locale] =
    await Promise.all([
      getLegalEntities(),
      getCompanies(),
      getProjects(),
      getProducts(),
      getLocale(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{t(locale, "salesOrder.new")}</h2>
      <SalesOrderBuilder
        mode="create"
        quoteNo={quotation.quoteNo}
        legalEntities={legalEntities}
        companies={companies}
        projects={projects}
        products={products}
        documents={[]}
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
          executedDocumentId: null,
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
