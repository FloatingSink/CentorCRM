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
import { getInitials } from "@/lib/initials";
import { matchesQuery } from "@/lib/search-filter";

type Company = {
  id: string;
  nameEn: string;
  country: string;
  roles: string[];
  isActive: boolean;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? c.isActive : !c.isActive);
      return matchesFilter && matchesQuery([c.nameEn, c.country], query);
    });
  }, [companies, filter, query]);

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
            placeholder="Search companies…"
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
                <TableHead className="pl-4">Company</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="pr-4">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/companies/${c.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <span className="flex size-7 flex-none items-center justify-center rounded-[7px] bg-neutral-800 text-[11px] text-neutral-200">
                        {getInitials(c.nameEn)}
                      </span>
                      {c.nameEn}
                    </Link>
                  </TableCell>
                  <TableCell>{c.country}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="secondary"
                          className="capitalize"
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4">
                    {c.isActive ? "Yes" : "No"}
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
