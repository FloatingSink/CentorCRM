import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDownloadUrl } from "@/lib/storage";
import { getProductDocumentById } from "@/server/product-documents";

// Route handlers aren't covered by the (app) layout's auth() redirect —
// layouts only wrap page.tsx (see docs/decisions.md's "No middleware-based
// route protection" entry) — so this checks auth itself.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Not signed in", { status: 401 });
  }

  const { id, docId } = await params;
  const doc = await getProductDocumentById(docId);
  if (!doc || doc.productId !== id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = await getDownloadUrl(doc.fileKey);
  return NextResponse.redirect(url);
}
