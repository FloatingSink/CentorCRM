import { QuotationBuilder } from "../quotation-builder";
import { getCompanies } from "@/server/companies";
import { getContacts } from "@/server/contacts";
import { getLegalEntities } from "@/server/legal-entities";
import { getOpportunities } from "@/server/opportunities";
import { getProducts } from "@/server/products";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewQuotationPage() {
  const [opportunities, legalEntities, companies, contacts, products, locale] =
    await Promise.all([
      getOpportunities(),
      getLegalEntities(),
      getCompanies(),
      getContacts(),
      getProducts(),
      getLocale(),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{t(locale, "quotation.new")}</h2>
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
