"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { matchesQuery } from "@/lib/search-filter";
import { useT } from "@/lib/i18n/client";

type Product = {
  id: string;
  centorCode: string;
  nameEn: string;
  category: string | null;
  uom: string | null;
  packSize: string | null;
  manufacturerCompanyId: string | null;
  manufacturerCompanyName: string | null;
  isActive: boolean;
};

// `label` is a dictionary key.
const FILTERS = [
  { value: "all", label: "common.all" },
  { value: "active", label: "common.active" },
  { value: "inactive", label: "common.inactive" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function ProductsTable({ products }: { products: Product[] }) {
  const { t } = useT();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? p.isActive : !p.isActive);
      return (
        matchesFilter &&
        matchesQuery([p.centorCode, p.nameEn, p.manufacturerCompanyName], query)
      );
    });
  }, [products, filter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Segmented
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          {FILTERS.map((f) => (
            <SegmentedItem key={f.value} value={f.value}>
              {t(f.label)}
            </SegmentedItem>
          ))}
        </Segmented>

        <div className="relative min-w-[220px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("product.searchPlaceholder")}
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="py-4">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t("product.colCode")}</TableHead>
                <TableHead>{t("product.colName")}</TableHead>
                <TableHead>{t("product.category")}</TableHead>
                <TableHead>{t("product.colUom")}</TableHead>
                <TableHead>{t("product.packSize")}</TableHead>
                <TableHead>{t("product.manufacturer")}</TableHead>
                <TableHead className="pr-4">{t("company.colActive")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/products/${p.id}`}
                      className="hover:underline"
                    >
                      {p.centorCode}
                    </Link>
                  </TableCell>
                  <TableCell>{p.nameEn}</TableCell>
                  <TableCell>
                    {p.category ? (
                      <Badge variant="secondary">
                        {t(`productCategory.${p.category}`)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{p.uom ?? "—"}</TableCell>
                  <TableCell>{p.packSize ?? "—"}</TableCell>
                  <TableCell>
                    {p.manufacturerCompanyId ? (
                      <Link
                        href={`/companies/${p.manufacturerCompanyId}`}
                        className="hover:underline"
                      >
                        {p.manufacturerCompanyName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4">
                    {p.isActive ? t("common.yes") : t("common.no")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
