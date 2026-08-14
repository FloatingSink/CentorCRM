"use server";

import { auth } from "@/lib/auth";
import { buildProductDocumentKey } from "@/lib/product-document-key";
import { getUploadUrl } from "@/lib/storage";
import {
  productDocumentCreateSchema,
  productDocumentUploadRequestSchema,
  type ProductDocumentUploadRequestInput,
} from "@/lib/validation/product-document";
import { createProductDocument } from "@/server/product-documents";

// Not form-bound (no <form action>/useActionState) — the upload flow needs a
// direct-to-R2 PUT between these two server calls, so the client component
// calls each of these directly and drives its own pending/error state.

export async function requestProductDocumentUploadUrl(
  input: ProductDocumentUploadRequestInput,
): Promise<{ uploadUrl: string; fileKey: string } | { error: string }> {
  const parsed = productDocumentUploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const { productId, docType, language, filename, contentType } = parsed.data;
  const fileKey = buildProductDocumentKey(
    productId,
    docType,
    language,
    filename,
  );
  const uploadUrl = await getUploadUrl(fileKey, contentType);

  return { uploadUrl, fileKey };
}

export async function createProductDocumentAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = productDocumentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const created = await createProductDocument(parsed.data, session.user.id);
  return { id: created.id };
}
