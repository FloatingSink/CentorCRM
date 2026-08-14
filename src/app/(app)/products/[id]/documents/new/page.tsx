import { ProductDocumentUploadForm } from "../product-document-upload-form";

export default async function NewProductDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h2 className="mb-4 text-2xl">Upload document</h2>
      <ProductDocumentUploadForm productId={id} />
    </div>
  );
}
