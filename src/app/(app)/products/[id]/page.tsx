import { Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateProductAction } from "../actions";
import { ProductForm } from "../product-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getCompanies } from "@/server/companies";
import { getProductDocuments } from "@/server/product-documents";
import { getProductById } from "@/server/products";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, companies, documents, locale] = await Promise.all([
    getProductById(id),
    getCompanies(),
    getProductDocuments(id),
    getLocale(),
  ]);
  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3.5">
        <span className="flex size-[52px] flex-none items-center justify-center rounded-md border border-primary text-primary">
          <Package className="size-6" />
        </span>
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl">{product.centorCode}</h2>
            <Badge variant={product.isActive ? "outline" : "secondary"}>
              {product.isActive
                ? t(locale, "common.active")
                : t(locale, "common.inactive")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {product.nameEn}
            {product.category
              ? ` · ${t(locale, `productCategory.${product.category}`)}`
              : ""}
          </p>
        </div>
      </div>

      <ProductForm
        action={updateProductAction.bind(null, id)}
        companies={companies}
        defaultValues={{
          centorCode: product.centorCode,
          nameEn: product.nameEn,
          nameZh: product.nameZh,
          category: product.category,
          uom: product.uom,
          packSize: product.packSize,
          packDescription: product.packDescription,
          manufacturerCompanyId: product.manufacturerCompanyId,
          manufacturerPartNo: product.manufacturerPartNo,
          hsCode: product.hsCode,
          notes: product.notes,
          isActive: product.isActive,
        }}
        mode="edit"
        submitLabel="common.saveChanges"
      />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg">{t(locale, "product.documents")}</h3>
          <Link
            href={`/products/${id}/documents/new`}
            className={buttonVariants()}
          >
            Upload document
          </Link>
        </div>
        <Card className="py-4">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">
                    {t(locale, "product.colDocType")}
                  </TableHead>
                  <TableHead>{t(locale, "product.colLanguage")}</TableHead>
                  <TableHead>{t(locale, "product.colVersion")}</TableHead>
                  <TableHead>{t(locale, "product.colIssuedDate")}</TableHead>
                  <TableHead>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="cursor-help underline decoration-dotted underline-offset-2" />
                        }
                      >
                        {t(locale, "product.current")}
                      </TooltipTrigger>
                      <TooltipContent>
                        {t(locale, "product.currentHelp")}
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="pr-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="pl-4 font-medium">
                      {t(locale, `productDocType.${doc.docType}`)}
                    </TableCell>
                    <TableCell>
                      {t(locale, `language.${doc.language}`)}
                    </TableCell>
                    <TableCell>{doc.version ?? "—"}</TableCell>
                    <TableCell>
                      {doc.issuedDate
                        ? doc.issuedDate.toISOString().slice(0, 10)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {doc.isCurrent ? (
                        <Badge variant="outline">
                          {t(locale, "product.current")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <a
                        href={`/products/${id}/documents/${doc.id}/download`}
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
      </div>
    </div>
  );
}
