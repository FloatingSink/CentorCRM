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
import { pickName } from "@/lib/display-name";
import { useT } from "@/lib/i18n/client";
import { getInitials } from "@/lib/initials";
import { matchesQuery } from "@/lib/search-filter";

type Company = {
  id: string;
  nameEn: string;
  nameZh: string | null;
  country: string;
  roles: string[];
  isActive: boolean;
};

// Same shape as the FILTERS array on five other list pages; `label` is now a
// dictionary key rather than display text.
const FILTERS = [
  { value: "all", label: "common.all" },
  { value: "active", label: "common.active" },
  { value: "inactive", label: "common.inactive" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const { locale, t } = useT();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? c.isActive : !c.isActive);
      // Both names are searchable regardless of UI language — someone typing
      // a Chinese name while the UI is in English should still find the row.
      return (
        matchesFilter &&
        matchesQuery([c.nameEn, c.nameZh ?? "", c.country], query)
      );
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
              {t(f.label)}
            </SegmentedItem>
          ))}
        </Segmented>

        <div className="relative min-w-[220px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("company.searchPlaceholder")}
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
                <TableHead className="pl-4">
                  {t("company.colCompany")}
                </TableHead>
                <TableHead>{t("company.colCountry")}</TableHead>
                <TableHead>{t("company.colRoles")}</TableHead>
                <TableHead className="pr-4">{t("company.colActive")}</TableHead>
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
                      {/* Initials stay derived from the English name on
                        purpose: getInitials() is Latin-oriented, and an
                        avatar that changes with the UI language stops
                        working as a recognition cue. */}
                      <span className="flex size-7 flex-none items-center justify-center rounded-[7px] bg-neutral-800 text-[11px] text-neutral-200">
                        {getInitials(c.nameEn)}
                      </span>
                      {pickName(c.nameEn, c.nameZh, locale)}
                    </Link>
                  </TableCell>
                  <TableCell>{c.country}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {t(`companyRole.${role}`)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4">
                    {c.isActive ? t("common.yes") : t("common.no")}
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
