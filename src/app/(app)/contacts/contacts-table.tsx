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
import { useT } from "@/lib/i18n/client";

type Contact = {
  id: string;
  nameEn: string;
  companyId: string | null;
  companyName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  isPrimary: boolean;
  isActive: boolean;
};

// `label` is a dictionary key.
const FILTERS = [
  { value: "all", label: "common.all" },
  { value: "active", label: "common.active" },
  { value: "inactive", label: "common.inactive" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const { t } = useT();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesFilter =
        filter === "all" || (filter === "active" ? c.isActive : !c.isActive);
      return (
        matchesFilter &&
        matchesQuery(
          [c.nameEn, c.companyName, c.jobTitle, c.email, c.phone],
          query,
        )
      );
    });
  }, [contacts, filter, query]);

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
            placeholder={t("contact.searchPlaceholder")}
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
                <TableHead className="pl-4">{t("contact.colName")}</TableHead>
                <TableHead>{t("contact.company")}</TableHead>
                <TableHead>{t("contact.jobTitle")}</TableHead>
                <TableHead>{t("contact.email")}</TableHead>
                <TableHead>{t("contact.phone")}</TableHead>
                <TableHead>{t("contact.primary")}</TableHead>
                <TableHead className="pr-4">{t("company.colActive")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="pl-4 font-medium">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-2.5 hover:underline"
                    >
                      <span className="flex size-7 flex-none items-center justify-center rounded-[7px] bg-neutral-800 text-[11px] text-neutral-200">
                        {getInitials(contact.nameEn)}
                      </span>
                      {contact.nameEn}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {contact.companyId ? (
                      <Link
                        href={`/companies/${contact.companyId}`}
                        className="hover:underline"
                      >
                        {contact.companyName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{contact.jobTitle}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>
                    {contact.isPrimary ? (
                      <Badge variant="outline">{t("contact.primary")}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-4">
                    {contact.isActive ? t("common.yes") : t("common.no")}
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
