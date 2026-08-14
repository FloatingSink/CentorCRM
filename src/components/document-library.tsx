"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createDocumentAction,
  requestDocumentUploadUrl,
} from "./document-library-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/date";
import { matchesQuery } from "@/lib/search-filter";

export type DocumentRelatedType =
  | "company"
  | "contact"
  | "project"
  | "opportunity"
  | "sales_order"
  | "purchase_order";

type DocumentRow = {
  id: string;
  title: string;
  docType: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// doc_type is free text (crm-spec.md §6.6, confirmed with Jia Long — no
// closed taxonomy), so unlike the status/active Segmented filters
// elsewhere, these segments can't be a fixed list — they're derived from
// whatever doc_type values are actually present among this entity's own
// documents.
const FILTER_ALL = "all";
const FILTER_UNTYPED = "untyped";

export function DocumentLibrary({
  relatedType,
  relatedId,
  documents,
}: {
  relatedType: DocumentRelatedType;
  relatedId: string;
  documents: DocumentRow[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [typeFilter, setTypeFilter] = useState(FILTER_ALL);
  const [query, setQuery] = useState("");

  // Grouped case-insensitively — "Contract" and "contract" are the same
  // segment, not two, since doc_type is free text a user could type either
  // way. The filter value is the lowercased key; the label shown is
  // whichever casing was typed first for that key, since there's no
  // canonical casing to prefer.
  const filterOptions = useMemo(() => {
    const types = new Map<string, string>();
    let hasUntyped = false;
    for (const d of documents) {
      if (d.docType) {
        const key = d.docType.toLowerCase();
        if (!types.has(key)) types.set(key, d.docType);
      } else {
        hasUntyped = true;
      }
    }
    return [
      { value: FILTER_ALL, label: "All" },
      ...[...types.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([key, label]) => ({ value: key, label })),
      ...(hasUntyped ? [{ value: FILTER_UNTYPED, label: "Untyped" }] : []),
    ];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchesFilter =
        typeFilter === FILTER_ALL ||
        (typeFilter === FILTER_UNTYPED
          ? !d.docType
          : d.docType?.toLowerCase() === typeFilter);
      return matchesFilter && matchesQuery([d.title, d.docType], query);
    });
  }, [documents, typeFilter, query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file");
      return;
    }

    setPending(true);
    setError(undefined);

    const urlResult = await requestDocumentUploadUrl({
      relatedType,
      relatedId,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });
    if ("error" in urlResult) {
      setError(urlResult.error);
      setPending(false);
      return;
    }

    // A network-level failure (e.g. the bucket rejecting the browser's PUT
    // via CORS) rejects this fetch instead of resolving with a non-ok
    // response — this try/catch is the fix for the bug found earlier this
    // session in product-document-upload-form.tsx, built in from the start
    // here rather than retrofitted.
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

    const createResult = await createDocumentAction({
      title,
      docType: docType || null,
      fileKey: urlResult.fileKey,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      relatedType,
      relatedId,
    });
    if ("error" in createResult) {
      setError(createResult.error);
      setPending(false);
      return;
    }

    setTitle("");
    setDocType("");
    setFile(null);
    setFileInputKey((k) => k + 1);
    // This form's target URL never changes, so pending must be reset
    // explicitly rather than relying on navigation to do it — same
    // discipline as activity-timeline.tsx.
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg">Documents</h3>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="docTitle">Title</Label>
                <Input
                  id="docTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="docType">Type (optional)</Label>
                <Input
                  id="docType"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="e.g. Contract, Certificate"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="file">File</Label>
              <Input
                key={fileInputKey}
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

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <Segmented
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter((value as string) ?? FILTER_ALL)
              }
            >
              {filterOptions.map((f) => (
                <SegmentedItem key={f.value} value={f.value}>
                  {f.label}
                </SegmentedItem>
              ))}
            </Segmented>

            <div className="relative min-w-[220px]">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search documents…"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents match.</p>
          ) : (
            <Card className="py-4">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="pr-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="pl-4 font-medium">
                          {d.title}
                        </TableCell>
                        <TableCell>{d.docType ?? "—"}</TableCell>
                        <TableCell>{formatFileSize(d.sizeBytes)}</TableCell>
                        <TableCell>{formatDateTime(d.createdAt)}</TableCell>
                        <TableCell className="pr-4">
                          <a
                            href={`/documents/${d.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            Download
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
