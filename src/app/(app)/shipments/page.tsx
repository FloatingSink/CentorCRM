import { Ship } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";

// P7 (crm-spec.md §10) is deliberately stubbed to a nav placeholder — the
// outsourced shipping process isn't confirmed yet, so there's no real
// shipment table/fields to build against (see docs/decisions.md). P8
// (activities, document library, search) is being built next instead;
// this page becomes a real list+detail screen once the process is settled.
export default async function ShipmentsPage() {
  const locale = await getLocale();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{t(locale, "shipment.title")}</h2>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Ship className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t(locale, "shipment.placeholder")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
