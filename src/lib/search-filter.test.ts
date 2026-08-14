import { describe, expect, it } from "vitest";

import { matchesQuery } from "./search-filter";

describe("matchesQuery", () => {
  it("matches everything when the query is empty or whitespace", () => {
    expect(matchesQuery(["Anything"], "")).toBe(true);
    expect(matchesQuery(["Anything"], "   ")).toBe(true);
    expect(matchesQuery([null, undefined], "")).toBe(true);
  });

  it("matches case-insensitively", () => {
    expect(matchesQuery(["CENTOR Group"], "centor")).toBe(true);
    expect(matchesQuery(["centor group"], "CENTOR")).toBe(true);
  });

  it("matches a substring anywhere in the value", () => {
    expect(matchesQuery(["China Railway Tunnel Group"], "railway")).toBe(true);
  });

  it("returns false when no field matches", () => {
    expect(matchesQuery(["Alpha", "Beta"], "gamma")).toBe(false);
  });

  it("skips null and undefined values without throwing", () => {
    expect(matchesQuery([null, undefined, "Gamma"], "gamma")).toBe(true);
    expect(matchesQuery([null, undefined], "gamma")).toBe(false);
  });

  it("matches if any of multiple fields matches (OR semantics)", () => {
    expect(matchesQuery(["no match", "CGPL-Q-2026-0001"], "cgpl")).toBe(true);
  });
});
