import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { company, companyRoleEnum } from "@/db/schema/company";

export const companyFormSchema = createInsertSchema(company, {
  nameEn: (schema) => schema.min(1, "Name is required"),
  country: (schema) => schema.min(1, "Country is required"),
})
  .omit({ id: true, createdAt: true, updatedAt: true, createdBy: true })
  .extend({
    roles: z
      .array(z.enum(companyRoleEnum.enumValues))
      .min(1, "Select at least one role"),
  });

export type CompanyFormInput = z.infer<typeof companyFormSchema>;
