import { createContactAction } from "../actions";
import { ContactForm } from "../contact-form";
import { getCompanies } from "@/server/companies";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const companies = await getCompanies();

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">New contact</h2>
      <ContactForm
        action={createContactAction}
        companies={companies}
        defaultCompanyId={companyId}
        mode="create"
        submitLabel="Create contact"
      />
    </div>
  );
}
