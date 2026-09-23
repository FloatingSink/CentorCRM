import { describe, expect, it } from "vitest";

import { t, tCount } from "./dictionary";

describe("t", () => {
  it("returns the translation for a known key", () => {
    expect(t("en", "nav.companies")).toBe("Companies");
    expect(t("zh", "nav.companies")).toBe("公司");
  });

  // Load-bearing: zod messages in src/lib/validation/* are dictionary keys,
  // and the ones not yet converted must keep rendering their own English
  // text rather than disappearing or throwing mid-rollout.
  it("returns an unknown key unchanged", () => {
    expect(t("zh", "Named place is required for this incoterm")).toBe(
      "Named place is required for this incoterm",
    );
    expect(t("zh", "error.notAKey")).toBe("error.notAKey");
  });

  it("interpolates named vars", () => {
    expect(t("en", "company.count_other", { n: 7 })).toBe("7 companies");
  });

  it("leaves a placeholder alone when no var matches it", () => {
    expect(t("en", "company.count_other")).toBe("{n} companies");
    expect(t("en", "company.count_other", { other: 7 })).toBe("{n} companies");
  });
});

describe("tCount", () => {
  it("picks the singular form in English only at exactly one", () => {
    expect(tCount("en", "company.count", 1)).toBe("1 company");
    expect(tCount("en", "company.count", 0)).toBe("0 companies");
    expect(tCount("en", "company.count", 2)).toBe("2 companies");
  });

  it("never picks a singular form in Chinese", () => {
    expect(tCount("zh", "company.count", 1)).toBe("1 家公司");
    expect(tCount("zh", "company.count", 2)).toBe("2 家公司");
  });
});
