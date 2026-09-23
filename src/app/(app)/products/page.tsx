import Link from "next/link";

import { ProductsTable } from "./products-table";
import { buttonVariants } from "@/components/ui/button";
import { getProducts } from "@/server/products";
import { t, tCount } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

export default async function ProductsPage() {
  const [products, locale] = await Promise.all([getProducts(), getLocale()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">{t(locale, "product.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {tCount(locale, "product.count", products.length)}
          </p>
        </div>
        <Link href="/products/new" className={buttonVariants()}>
          {t(locale, "product.new")}
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
