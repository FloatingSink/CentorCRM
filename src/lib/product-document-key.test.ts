import { describe, expect, it } from "vitest";

import { buildProductDocumentKey } from "./product-document-key";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PRODUCT_ID = "11111111-1111-1111-1111-111111111111";

describe("buildProductDocumentKey", () => {
  it("builds a namespaced key with a random id and the file extension", () => {
    const key = buildProductDocumentKey(
      PRODUCT_ID,
      "TDS",
      "en",
      "tail-seal-grease.pdf",
    );
    expect(key).toMatch(
      new RegExp(`^product-documents/${PRODUCT_ID}/TDS/en/${UUID}\\.pdf$`),
    );
  });

  it("drops an unsafe or malformed extension", () => {
    const key = buildProductDocumentKey(
      PRODUCT_ID,
      "SDS",
      "zh",
      "../../etc/passwd",
    );
    expect(key).toMatch(
      new RegExp(`^product-documents/${PRODUCT_ID}/SDS/zh/${UUID}$`),
    );
  });

  it("handles a filename with no extension", () => {
    const key = buildProductDocumentKey(
      PRODUCT_ID,
      "COC",
      "bilingual",
      "readme",
    );
    expect(key).toMatch(
      new RegExp(`^product-documents/${PRODUCT_ID}/COC/bilingual/${UUID}$`),
    );
  });

  it("produces a different key on each call", () => {
    const a = buildProductDocumentKey(PRODUCT_ID, "other", "en", "a.pdf");
    const b = buildProductDocumentKey(PRODUCT_ID, "other", "en", "a.pdf");
    expect(a).not.toBe(b);
  });
});
