import { describe, expect, it } from "vitest";

import { rmbAmountToCapitalWords } from "./chinese-numerals";

describe("rmbAmountToCapitalWords", () => {
  it("converts a whole-yuan amount with no fraction", () => {
    expect(rmbAmountToCapitalWords(10000)).toBe("壹佰元整"); // 100.00
  });

  it("handles internal zero-bridging within a group", () => {
    expect(rmbAmountToCapitalWords(1000500)).toBe("壹万零伍元整"); // 10,005.00
  });

  it("handles a zero group between two non-zero groups", () => {
    // 100,000,001.00 -> 壹亿零壹元整 (the whole 万-group is zero, single
    // bridging 零 before the final 壹, not one per skipped position)
    expect(rmbAmountToCapitalWords(10000000100)).toBe("壹亿零壹元整");
  });

  it("drops trailing zeros without a spurious trailing 零", () => {
    expect(rmbAmountToCapitalWords(13000000)).toBe("壹拾叁万元整"); // 130,000.00
    expect(rmbAmountToCapitalWords(105000)).toBe("壹仟零伍拾元整"); // 1,050.00
  });

  it("omits a fully-zero low group with nothing following it", () => {
    expect(rmbAmountToCapitalWords(2000000)).toBe("贰万元整"); // 20,000.00
  });

  it("handles jiao and fen together", () => {
    expect(rmbAmountToCapitalWords(10055)).toBe("壹佰元伍角伍分"); // 100.55
  });

  it("appends 整 after 角 when there are no fen at all", () => {
    expect(rmbAmountToCapitalWords(10050)).toBe("壹佰元伍角整"); // 100.50
  });

  it("bridges a zero when jiao is absent but fen is present", () => {
    expect(rmbAmountToCapitalWords(10005)).toBe("壹佰元零伍分"); // 100.05
  });

  it("never appends 整 when fen is present", () => {
    expect(rmbAmountToCapitalWords(1)).toBe("零元零壹分"); // 0.01
  });

  it("handles a zero amount", () => {
    expect(rmbAmountToCapitalWords(0)).toBe("零元整");
  });

  it("handles a realistic purchase-order-scale amount", () => {
    // 52 drums x 250kg tail seal grease at a round per-drum price, e.g.
    // 52 x ¥800.00 = ¥41,600.00
    expect(rmbAmountToCapitalWords(4160000)).toBe("肆万壹仟陆佰元整");
  });

  it("throws for a negative or non-integer amount", () => {
    expect(() => rmbAmountToCapitalWords(-100)).toThrow();
    expect(() => rmbAmountToCapitalWords(1.5)).toThrow();
  });
});
