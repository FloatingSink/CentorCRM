import Link from "next/link";

import { ProductsTable } from "./products-table";
import { buttonVariants } from "@/components/ui/button";
import { getProducts } from "@/server/products";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Products</h2>
          <p className="text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>
        <Link href="/products/new" className={buttonVariants()}>
          New product
        </Link>
      </div>

      <ProductsTable products={products} />
    </div>
  );
}
