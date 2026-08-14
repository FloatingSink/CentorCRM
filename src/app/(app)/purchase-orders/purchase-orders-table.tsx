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
import { formatMoney } from "@/lib/money";
import { matchesQuery } from "@/lib/search-filter";

type PurchaseOrder = {
  id: string;
  orderNo: string;
  status: string;
  signedDate: Date | null;
  currency: string;
  totalValue: number;
  supplierCompanyId: string | null;
  supplierCompanyName: string | null;
  supplierLegalEntityId: string | null;
  supplierLegalEntityName: string | null;
  projectId: string;
  projectName: string;
  linkedSalesOrderId: string | null;
  linkedSalesOrderNo: string | null;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function PurchaseOrdersTable({ orders }: { orders: PurchaseOrder[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter = filter === "all" || o.status === filter;
      return (
        matchesFilter &&
        matchesQuery(
          [
            o.orderNo,
            o.supplierCompanyName,
            o.supplierLegalEntityName,
            o.projectName,
            o.linkedSalesOrderNo,
          ],
          query,
        )
      );
    });
  }, [orders, filter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Segmented
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          {FILTERS.map((f) => (
            <SegmentedItem key={f.value} value={f.value}>
              {f.label}
            </SegmentedItem>
          ))}
        </Segmented>

        <div className="relative min-w-[220px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders…"
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
                <TableHead className="pl-4">Order No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Linked SO</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="pr-4">Signed date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/purchase-orders/${o.id}`}
                      className="hover:underline"
                    >
                      {o.orderNo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.supplierCompanyId ? (
                      <Link
                        href={`/companies/${o.supplierCompanyId}`}
                        className="hover:underline"
                      >
                        {o.supplierCompanyName}
                      </Link>
                    ) : (
                      <span>{o.supplierLegalEntityName} (ours)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${o.projectId}`}
                      className="hover:underline"
                    >
                      {o.projectName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {o.linkedSalesOrderId ? (
                      <Link
                        href={`/sales-orders/${o.linkedSalesOrderId}`}
                        className="hover:underline"
                      >
                        <Badge variant="outline">{o.linkedSalesOrderNo}</Badge>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {o.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMoney(o.totalValue, o.currency)}</TableCell>
                  <TableCell className="pr-4">
                    {o.signedDate
                      ? o.signedDate.toISOString().slice(0, 10)
                      : "—"}
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
