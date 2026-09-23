import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";
import { getCompanies } from "@/server/companies";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewProductPage() {
  const [companies, locale] = await Promise.all([getCompanies(), getLocale()]);

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "product.new")}</h2>
      <ProductForm
        action={createProductAction}
        companies={companies}
        mode="create"
        submitLabel="product.create"
      />
    </div>
  );
}
