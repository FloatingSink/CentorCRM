"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { productFormSchema } from "@/lib/validation/product";
import { createProduct, updateProduct } from "@/server/products";

function parseProductForm(formData: FormData) {
  return productFormSchema.safeParse({
    centorCode: formData.get("centorCode"),
    nameEn: formData.get("nameEn"),
    nameZh: formData.get("nameZh") || null,
    category:
      formData.get("category") === "unspecified"
        ? null
        : formData.get("category"),
    uom: formData.get("uom") || null,
    packSize: formData.get("packSize") || null,
    packDescription: formData.get("packDescription") || null,
    manufacturerCompanyId:
      formData.get("manufacturerCompanyId") === "none"
        ? null
        : formData.get("manufacturerCompanyId"),
    manufacturerPartNo: formData.get("manufacturerPartNo") || null,
    hsCode: formData.get("hsCode") || null,
    notes: formData.get("notes") || null,
    isActive: formData.get("isActive") === "true",
  });
}

export async function createProductAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const created = await createProduct(parsed.data, session.user.id);
  redirect(`/products/${created.id}`);
}

export async function updateProductAction(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateProduct(id, parsed.data);
  redirect(`/products/${id}`);
}
