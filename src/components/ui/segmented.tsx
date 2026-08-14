"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

import { cn } from "@/lib/utils";

// Nocturne's .seg/.seg-opt (design_handoff_centor_crm/nocturne.css) — a
// single-select filter row, built on Base UI's radio primitives like
// Checkbox is (src/components/ui/checkbox.tsx), not a new dependency.
function Segmented({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup
      data-slot="segmented"
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-border",
        className,
      )}
      {...props}
    />
  );
}

function SegmentedItem({
  className,
  ...props
}: React.ComponentProps<typeof Radio.Root>) {
  return (
    <Radio.Root
      data-slot="segmented-item"
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 border-l border-border px-3 py-1.5 text-[13px] outline-none first:border-l-0",
        "not-data-checked:hover:bg-accent data-checked:text-primary data-checked:shadow-[inset_0_0_0_1px_var(--primary)]",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

export { Segmented, SegmentedItem };
