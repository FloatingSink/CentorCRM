import { createProductAction } from "../actions";
import { ProductForm } from "../product-form";
import { getCompanies } from "@/server/companies";

export default async function NewProductPage() {
  const companies = await getCompanies();

  return (
    <div>
      <h2 className="mb-4 text-2xl">New product</h2>
      <ProductForm
        action={createProductAction}
        companies={companies}
        mode="create"
        submitLabel="Create product"
      />
    </div>
  );
}
