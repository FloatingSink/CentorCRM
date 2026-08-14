"use server";

import { auth } from "@/lib/auth";
import { buildDocumentKey } from "@/lib/document-key";
import { getUploadUrl } from "@/lib/storage";
import {
  documentCreateSchema,
  documentUploadRequestSchema,
  type DocumentUploadRequestInput,
} from "@/lib/validation/document";
import { createDocument } from "@/server/documents";

// Not form-bound (no <form action>/useActionState) — the upload flow needs a
// direct-to-R2 PUT between these two server calls, same precedent as
// products/[id]/documents/actions.ts.

export async function requestDocumentUploadUrl(
  input: DocumentUploadRequestInput,
): Promise<{ uploadUrl: string; fileKey: string } | { error: string }> {
  const parsed = documentUploadRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const { relatedType, relatedId, filename, contentType } = parsed.data;
  const fileKey = buildDocumentKey(relatedType, relatedId, filename);
  const uploadUrl = await getUploadUrl(fileKey, contentType);

  return { uploadUrl, fileKey };
}

export async function createDocumentAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = documentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const created = await createDocument(
    parsed.data,
    session.user.id,
    session.user.id,
  );
  return { id: created.id };
}
