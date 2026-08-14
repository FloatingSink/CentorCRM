"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createProductDocumentAction,
  requestProductDocumentUploadUrl,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DOC_TYPES = [
  { value: "TDS", label: "TDS" },
  { value: "SDS", label: "SDS" },
  { value: "COC", label: "COC" },
  { value: "test_report", label: "Test report" },
  { value: "other", label: "Other" },
] as const;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "bilingual", label: "Bilingual" },
] as const;

export function ProductDocumentUploadForm({
  productId,
}: {
  productId: string;
}) {
  const router = useRouter();
  const [docType, setDocType] =
    useState<(typeof DOC_TYPES)[number]["value"]>("TDS");
  const [language, setLanguage] =
    useState<(typeof LANGUAGES)[number]["value"]>("en");
  const [version, setVersion] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file");
      return;
    }

    setPending(true);
    setError(undefined);

    const urlResult = await requestProductDocumentUploadUrl({
      productId,
      docType,
      language,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });
    if ("error" in urlResult) {
      setError(urlResult.error);
      setPending(false);
      return;
    }

    // A network-level failure (e.g. the storage bucket rejecting the
    // browser's PUT via CORS) rejects this fetch instead of resolving with a
    // non-ok response — without a try/catch that rejection was unhandled,
    // leaving pending stuck true and the button permanently on "Uploading…"
    // with no error shown.
    let putResponse: Response;
    try {
      putResponse = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
    } catch {
      setError("Upload to storage failed");
      setPending(false);
      return;
    }
    if (!putResponse.ok) {
      setError("Upload to storage failed");
      setPending(false);
      return;
    }

    const createResult = await createProductDocumentAction({
      productId,
      docType,
      language,
      version: version || null,
      issuedDate: issuedDate || null,
      fileKey: urlResult.fileKey,
    });
    if ("error" in createResult) {
      setError(createResult.error);
      setPending(false);
      return;
    }

    // Navigates to the parent product page (a different URL than this form's
    // own), so this remounts naturally — setPending(false) added anyway for
    // consistency with quotation-builder.tsx/sales-order-builder.tsx, where
    // relying on implicit unmount was the actual bug (button stuck on
    // "Saving…" when the target URL is unchanged, e.g. editing in place).
    router.push(`/products/${productId}`);
    router.refresh();
    setPending(false);
  }

  return (
    <Card>
      <CardContent>
        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="docType" required>
                Type
              </Label>
              <Select
                value={docType}
                onValueChange={(v) => setDocType(v as typeof docType)}
                items={DOC_TYPES}
              >
                <SelectTrigger id="docType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="language" required>
                Language
              </Label>
              <Select
                value={language}
                onValueChange={(v) => setLanguage(v as typeof language)}
                items={LANGUAGES}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="issuedDate">Issued date</Label>
              <Input
                id="issuedDate"
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file" required>
              File
            </Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
          </div>

          <Button type="submit" disabled={pending} className="w-fit">
            {pending ? "Uploading…" : "Upload document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
