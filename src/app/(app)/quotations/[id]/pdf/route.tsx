import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { QuotationDocument } from "@/lib/pdf/quotation-document";
import { getQuotationForPdf } from "@/server/quotations";

// Route handlers aren't covered by the (app) layout's auth() redirect —
// layouts only wrap page.tsx (see docs/decisions.md's "No middleware-based
// route protection" entry) — so this checks auth itself, same as
// products/[id]/documents/[docId]/download/route.ts.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Not signed in", { status: 401 });
  }

  const { id } = await params;
  const data = await getQuotationForPdf(id);
  if (!data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await renderToBuffer(<QuotationDocument data={data} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.quotation.quoteNo}.pdf"`,
    },
  });
}
