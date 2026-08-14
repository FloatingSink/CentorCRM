"use client";

import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

const DEBOUNCE_MS = 1000;

type PreviewResult =
  { pdfBase64: string } | { incomplete: true } | { error: string };

type PanelState = "loading" | "incomplete" | "error" | "ready";

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "application/pdf" });
}

// Shared between the Quotation and Purchase Order builders — debounces on
// `payloadKey` (a JSON-stringified snapshot of the builder's current draft)
// so a PDF isn't regenerated on every keystroke, then renders the result as
// an object-URL iframe. Sales Orders have no PDF export, so this isn't used
// there.
export function PdfPreviewPanel({
  payloadKey,
  fetchPreview,
}: {
  payloadKey: string;
  fetchPreview: () => Promise<PreviewResult>;
}) {
  const [state, setState] = useState<PanelState>("loading");
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // "Adjusting state when a prop changes" — react.dev's documented pattern
  // for resetting state in response to a changing prop without the flash of
  // a stale render that a reset-via-effect would cause. Snapshotting
  // payloadKey in state and comparing during render (rather than in an
  // effect) is what lets this setState call happen synchronously in the same
  // pass, instead of a separate cascading render.
  const [trackedPayloadKey, setTrackedPayloadKey] = useState(payloadKey);
  if (payloadKey !== trackedPayloadKey) {
    setTrackedPayloadKey(payloadKey);
    setState("loading");
  }

  // Latest-ref pattern: fetchPreview is a fresh closure every render (it
  // reads current form state), but the debounce effect below must only
  // re-fire when payloadKey itself changes, not on every render. Updating
  // the ref in its own effect (rather than during render) keeps ref writes
  // out of the render phase.
  const fetchPreviewRef = useRef(fetchPreview);
  useEffect(() => {
    fetchPreviewRef.current = fetchPreview;
  });

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      void fetchPreviewRef.current().then((result) => {
        if (cancelled) return;

        if ("error" in result) {
          setState("error");
          return;
        }
        if ("incomplete" in result) {
          setState("incomplete");
          return;
        }

        const url = URL.createObjectURL(base64ToBlob(result.pdfBase64));
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = url;
        setObjectUrl(url);
        setState("ready");
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [payloadKey]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return (
    <Card className="sticky top-6 h-[calc(100vh-6rem)] overflow-hidden py-0">
      <CardContent className="h-full p-0">
        {state === "ready" && objectUrl ? (
          <iframe
            src={objectUrl}
            title="Document preview"
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {state === "loading"
              ? "Updating preview…"
              : state === "incomplete"
                ? "Fill in the required fields to see a preview."
                : "Couldn't generate a preview. Try again shortly."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
