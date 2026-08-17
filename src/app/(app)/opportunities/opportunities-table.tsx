"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OPPORTUNITY_STAGE_HELP } from "./opportunity-form";
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

type Opportunity = {
  id: string;
  reference: string;
  title: string;
  projectId: string;
  projectName: string;
  customerCompanyId: string;
  customerCompanyName: string;
  stage: string;
  estimatedValue: number | null;
  currency: string | null;
  isActive: boolean;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function OpportunitiesTable({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return opportunities.filter((o) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? o.isActive : !o.isActive);
      return (
        matchesFilter &&
        matchesQuery(
          [o.reference, o.title, o.projectName, o.customerCompanyName],
          query,
        )
      );
    });
  }, [opportunities, filter, query]);

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
            placeholder="Search opportunities…"
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
                <TableHead className="pl-4">Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="pr-4">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/opportunities/${o.id}`}
                      className="hover:underline"
                    >
                      {o.reference}
                    </Link>
                  </TableCell>
                  <TableCell>{o.title}</TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${o.projectId}`}
                      className="hover:underline"
                    >
                      {o.projectName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/companies/${o.customerCompanyId}`}
                      className="hover:underline"
                    >
                      {o.customerCompanyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger
                        render={<span className="inline-block" />}
                      >
                        <Badge variant="secondary" className="capitalize">
                          {o.stage.replace(/_/g, " ")}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {OPPORTUNITY_STAGE_HELP[
                          o.stage as keyof typeof OPPORTUNITY_STAGE_HELP
                        ] ?? o.stage}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {o.estimatedValue !== null && o.currency
                      ? formatMoney(o.estimatedValue, o.currency)
                      : "—"}
                  </TableCell>
                  <TableCell className="pr-4">
                    {o.isActive ? "Yes" : "No"}
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
