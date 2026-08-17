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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { matchesQuery } from "@/lib/search-filter";
import { PROJECT_STATUS_HELP } from "./project-form";

type Project = {
  id: string;
  nameEn: string;
  clientCompanyId: string;
  clientCompanyName: string;
  country: string;
  status: "prospect" | "active" | "on_hold" | "completed";
  isActive: boolean;
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? p.isActive : !p.isActive);
      return (
        matchesFilter &&
        matchesQuery([p.nameEn, p.clientCompanyName, p.country], query)
      );
    });
  }, [projects, filter, query]);

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
            placeholder="Search projects…"
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
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/projects/${p.id}`}
                      className="hover:underline"
                    >
                      {p.nameEn}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/companies/${p.clientCompanyId}`}
                      className="hover:underline"
                    >
                      {p.clientCompanyName}
                    </Link>
                  </TableCell>
                  <TableCell>{p.country}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger
                        render={<span className="inline-block" />}
                      >
                        <Badge variant="secondary" className="capitalize">
                          {p.status.replace("_", " ")}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {PROJECT_STATUS_HELP[
                          p.status as keyof typeof PROJECT_STATUS_HELP
                        ] ?? p.status}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="pr-4">
                    {p.isActive ? "Yes" : "No"}
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
