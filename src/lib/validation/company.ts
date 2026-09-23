import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { company, companyRoleEnum } from "@/db/schema/company";

// Messages are i18n dictionary keys, not display text: the action returns
// one to the form, which renders it through t(). An unconverted message on
// another schema still renders verbatim, since t() returns unknown keys
// unchanged — so this can be rolled out a screen at a time.
export const companyFormSchema = createInsertSchema(company, {
  nameEn: (schema) => schema.min(1, "error.nameRequired"),
  country: (schema) => schema.min(1, "error.countryRequired"),
})
  .omit({ id: true, createdAt: true, updatedAt: true, createdBy: true })
  .extend({
    roles: z
      .array(z.enum(companyRoleEnum.enumValues))
      .min(1, "error.selectAtLeastOneRole"),
  });

export type CompanyFormInput = z.infer<typeof companyFormSchema>;
