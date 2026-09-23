import { useT } from "@/lib/i18n/client";

// Shipments (P7) is on hold with no real schema to query — see
// docs/decisions.md. This is a static stand-in, not a stubbed data fetch,
// so there's nothing here pretending to be real data.
export function ShipmentsPlaceholderWidget() {
  const { t } = useT();

  return (
    <p className="text-sm text-muted-foreground">
      {t("widget.shipmentsComingSoon")}
    </p>
  );
}
