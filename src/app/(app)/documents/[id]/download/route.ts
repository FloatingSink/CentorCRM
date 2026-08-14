import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getDownloadUrl } from "@/lib/storage";
import { getDocumentById } from "@/server/documents";

// Route handlers aren't covered by the (app) layout's auth() redirect — see
// products/[id]/documents/[docId]/download/route.ts, the pattern this
// mirrors. Top-level (not nested under one entity's route tree) since a
// document's related_type can be any of six different entity types — no
// single natural route prefix to nest under.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Not signed in", { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocumentById(id);
  if (!doc) {
    return new NextResponse("Not found", { status: 404 });
  }

  const url = await getDownloadUrl(doc.fileKey);
  return NextResponse.redirect(url);
}
