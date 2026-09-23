"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocaleAction } from "./locale-actions";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import { useT } from "@/lib/i18n/client";

export function LanguageSwitcher() {
  const { locale, t } = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Segmented
      aria-label={t("common.language")}
      value={locale}
      onValueChange={(value) => {
        if (value === locale) return;
        startTransition(async () => {
          await setLocaleAction(value);
          // The cookie is the only state that changed, and every reader of
          // it is a server component, so the tree has to be re-fetched.
          // router.refresh() does that without a full page load; there is no
          // revalidatePath anywhere in this repo to follow instead.
          router.refresh();
        });
      }}
      className="text-[11px]"
    >
      <SegmentedItem value="en" disabled={pending} className="px-2 py-1">
        EN
      </SegmentedItem>
      <SegmentedItem value="zh" disabled={pending} className="px-2 py-1">
        中文
      </SegmentedItem>
    </Segmented>
  );
}
