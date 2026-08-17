import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { product } from "@/db/schema/product";
import type { ProductFormInput } from "@/lib/validation/product";
import { requireUser } from "./auth";

export async function getProducts() {
  await requireUser();
  return db
    .select({
      id: product.id,
      centorCode: product.centorCode,
      nameEn: product.nameEn,
      category: product.category,
      uom: product.uom,
      packSize: product.packSize,
      manufacturerCompanyId: product.manufacturerCompanyId,
      manufacturerCompanyName: company.nameEn,
      isActive: product.isActive,
    })
    .from(product)
    .leftJoin(company, eq(product.manufacturerCompanyId, company.id))
    .orderBy(asc(product.centorCode));
}

export async function getProductById(id: string) {
  await requireUser();
  const [productRow] = await db
    .select()
    .from(product)
    .where(eq(product.id, id));
  if (!productRow) return null;

  return productRow;
}

export async function createProduct(
  input: ProductFormInput,
  createdBy: string,
) {
  await requireUser();
  const [created] = await db
    .insert(product)
    .values({ ...input, createdBy })
    .returning();

  return created;
}

export async function updateProduct(id: string, input: ProductFormInput) {
  await requireUser();
  const [updated] = await db
    .update(product)
    .set(input)
    .where(eq(product.id, id))
    .returning();

  return updated;
}
