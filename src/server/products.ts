import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { product } from "@/db/schema/product";
import type { ProductFormInput } from "@/lib/validation/product";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

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
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(product)
      .values({ ...input, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "product",
      entityId: created.id,
      message: `created product ${created.centorCode}`,
    });

    return created;
  });
}

export async function updateProduct(id: string, input: ProductFormInput) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(product)
      .set(input)
      .where(eq(product.id, id))
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "update",
      entityType: "product",
      entityId: updated.id,
      message: `updated product ${updated.centorCode}`,
    });

    return updated;
  });
}
