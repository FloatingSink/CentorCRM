import { ProductDocumentUploadForm } from "../product-document-upload-form";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function NewProductDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const { id } = await params;

  return (
    <div>
      <h2 className="mb-4 text-2xl">{t(locale, "productDocument.upload")}</h2>
      <ProductDocumentUploadForm productId={id} />
    </div>
  );
}
