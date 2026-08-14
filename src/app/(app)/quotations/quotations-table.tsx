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

type Quotation = {
  id: string;
  quoteNo: string;
  version: number;
  status: string;
  issueDate: Date;
  currency: string;
  customerCompanyId: string;
  customerCompanyName: string;
  opportunityId: string;
  opportunityTitle: string;
  total: string;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function QuotationsTable({ quotations }: { quotations: Quotation[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const matchesFilter = filter === "all" || q.status === filter;
      return (
        matchesFilter &&
        matchesQuery(
          [q.quoteNo, q.customerCompanyName, q.opportunityTitle],
          query,
        )
      );
    });
  }, [quotations, filter, query]);

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
            placeholder="Search quotations…"
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
                <TableHead className="pl-4">Quote No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Opportunity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="pr-4">Issue date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/quotations/${q.id}`}
                      className="hover:underline"
                    >
                      {q.quoteNo}
                    </Link>
                    {q.version > 1 ? (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        v{q.version}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/companies/${q.customerCompanyId}`}
                      className="hover:underline"
                    >
                      {q.customerCompanyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/opportunities/${q.opportunityId}`}
                      className="hover:underline"
                    >
                      {q.opportunityTitle}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatMoney(Number(q.total), q.currency)}
                  </TableCell>
                  <TableCell className="pr-4">
                    {q.issueDate.toISOString().slice(0, 10)}
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
