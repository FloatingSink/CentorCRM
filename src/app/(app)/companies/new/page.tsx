import { createCompanyAction } from "../actions";
import { CompanyForm } from "../company-form";

export default function NewCompanyPage() {
  return (
    <div>
      <h2 className="mb-4 text-2xl">New company</h2>
      <CompanyForm
        action={createCompanyAction}
        mode="create"
        submitLabel="Create company"
      />
    </div>
  );
}
