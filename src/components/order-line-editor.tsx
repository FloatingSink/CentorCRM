"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, parseMoneyToMinorUnits } from "@/lib/money";
import { calculateLineTotal } from "@/lib/quotation-math";

// Shared by the quotation and sales-order builders (both need the same
// add/edit/remove-row line-item table with live totals) — real duplication
// between the two, unlike the earlier one-off cases, so extracted rather
// than copy-pasted (docs/decisions.md, 2026-08-12).

export type LineRow = {
  key: string;
  productId: string;
  descriptionOverride: string;
  quantity: string;
  uom: string;
  unitPrice: string;
  discountPct: string;
};

export function emptyLine(): LineRow {
  return {
    key: crypto.randomUUID(),
    productId: "",
    descriptionOverride: "",
    quantity: "1",
    uom: "",
    unitPrice: "",
    discountPct: "",
  };
}

export function lineRowsFromExisting(
  lines: {
    productId: string;
    descriptionOverride: string | null;
    quantity: number;
    uom: string | null;
    unitPrice: number;
    discountPct: string | null;
  }[],
): LineRow[] {
  if (lines.length === 0) return [emptyLine()];
  return lines.map((l) => ({
    key: crypto.randomUUID(),
    productId: l.productId,
    descriptionOverride: l.descriptionOverride ?? "",
    quantity: String(l.quantity),
    uom: l.uom ?? "",
    unitPrice: (l.unitPrice / 100).toFixed(2),
    discountPct: l.discountPct ?? "",
  }));
}

export function OrderLineEditor({
  lines,
  onLinesChange,
  currency,
  products,
}: {
  lines: LineRow[];
  onLinesChange: (lines: LineRow[]) => void;
  currency: string;
  products: { id: string; centorCode: string; nameEn: string }[];
}) {
  function updateLine(key: string, patch: Partial<LineRow>) {
    onLinesChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    onLinesChange(lines.filter((l) => l.key !== key));
  }

  const grandTotalMinor = useMemo(() => {
    return lines.reduce((sum, line) => {
      const minor = parseMoneyToMinorUnits(line.unitPrice || "0", currency);
      const qty = Number(line.quantity);
      if (minor === null || !Number.isFinite(qty)) return sum;
      return sum + calculateLineTotal(qty, minor, line.discountPct || null);
    }, 0);
  }, [lines, currency]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">Line items</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onLinesChange([...lines, emptyLine()])}
        >
          Add line
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product *</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Qty *</TableHead>
            <TableHead>UOM</TableHead>
            <TableHead>Unit price *</TableHead>
            <TableHead>Discount %</TableHead>
            <TableHead>Line total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const minor = parseMoneyToMinorUnits(
              line.unitPrice || "0",
              currency,
            );
            const qty = Number(line.quantity);
            const lineTotal =
              minor !== null && Number.isFinite(qty)
                ? calculateLineTotal(qty, minor, line.discountPct || null)
                : 0;

            return (
              <TableRow key={line.key}>
                <TableCell className="min-w-40">
                  <Select
                    value={line.productId}
                    onValueChange={(v) =>
                      updateLine(line.key, { productId: v ?? "" })
                    }
                    items={products.map((p) => ({
                      value: p.id,
                      label: `${p.centorCode} — ${p.nameEn}`,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.centorCode} — {p.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={line.descriptionOverride}
                    onChange={(e) =>
                      updateLine(line.key, {
                        descriptionOverride: e.target.value,
                      })
                    }
                  />
                </TableCell>
                <TableCell className="w-20">
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, { quantity: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="w-20">
                  <Input
                    value={line.uom}
                    onChange={(e) =>
                      updateLine(line.key, { uom: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="w-28">
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(line.key, { unitPrice: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="w-24">
                  <Input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={line.discountPct}
                    onChange={(e) =>
                      updateLine(line.key, { discountPct: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatMoney(lineTotal, currency)}
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex justify-end font-heading text-lg">
        Total: {formatMoney(grandTotalMinor, currency)}
      </div>
    </div>
  );
}
