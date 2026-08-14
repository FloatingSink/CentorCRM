import { QuotationBuilder } from "../quotation-builder";
import { getCompanies } from "@/server/companies";
import { getContacts } from "@/server/contacts";
import { getLegalEntities } from "@/server/legal-entities";
import { getOpportunities } from "@/server/opportunities";
import { getProducts } from "@/server/products";

export default async function NewQuotationPage() {
  const [opportunities, legalEntities, companies, contacts, products] =
    await Promise.all([
      getOpportunities(),
      getLegalEntities(),
      getCompanies(),
      getContacts(),
      getProducts(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">New quotation</h2>
      <QuotationBuilder
        mode="create"
        opportunities={opportunities}
        legalEntities={legalEntities}
        companies={companies}
        contacts={contacts}
        products={products}
      />
    </div>
  );
}
