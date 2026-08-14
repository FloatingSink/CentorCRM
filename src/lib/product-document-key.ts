import { randomUUID } from "node:crypto";

const SAFE_EXTENSION = /^\.[a-zA-Z0-9]{1,10}$/;

// Object key for a product document upload to R2. The random UUID guarantees
// uniqueness; only a validated extension is kept from the user-supplied filename
// so the raw filename never reaches the storage key.
export function buildProductDocumentKey(
  productId: string,
  docType: string,
  language: string,
  filename: string,
): string {
  const dotIndex = filename.lastIndexOf(".");
  const candidateExt = dotIndex === -1 ? "" : filename.slice(dotIndex);
  const ext = SAFE_EXTENSION.test(candidateExt) ? candidateExt : "";

  return `product-documents/${productId}/${docType}/${language}/${randomUUID()}${ext}`;
}
