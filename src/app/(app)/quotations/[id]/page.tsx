import { notFound } from "next/navigation";

import { QuotationBuilder } from "../quotation-builder";
import { getCompanies } from "@/server/companies";
import { getContacts } from "@/server/contacts";
import { getLegalEntities } from "@/server/legal-entities";
import { getOpportunities } from "@/server/opportunities";
import { getProducts } from "@/server/products";
import { getQuotationById } from "@/server/quotations";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, opportunities, legalEntities, companies, contacts, products] =
    await Promise.all([
      getQuotationById(id),
      getOpportunities(),
      getLegalEntities(),
      getCompanies(),
      getContacts(),
      getProducts(),
    ]);
  if (!result) {
    notFound();
  }

  const { quotation, lines } = result;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{quotation.quoteNo}</h2>
      <QuotationBuilder
        mode="edit"
        quotationId={quotation.id}
        quoteNo={quotation.quoteNo}
        version={quotation.version}
        status={quotation.status}
        opportunities={opportunities}
        legalEntities={legalEntities}
        companies={companies}
        contacts={contacts}
        products={products}
        defaultHeader={{
          opportunityId: quotation.opportunityId,
          legalEntityId: quotation.legalEntityId,
          customerCompanyId: quotation.customerCompanyId,
          contactId: quotation.contactId,
          issueDate: quotation.issueDate,
          validUntil: quotation.validUntil,
          currency: quotation.currency,
          incoterm: quotation.incoterm,
          namedPlace: quotation.namedPlace,
          paymentTerms: quotation.paymentTerms,
          leadTimeDays: quotation.leadTimeDays,
          language: quotation.language,
          notes: quotation.notes,
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
