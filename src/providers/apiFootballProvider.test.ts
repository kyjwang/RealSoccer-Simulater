import { describe, expect, it } from "vitest";

import { previousSeason } from "./season";

describe("previousSeason", () => {
  it("returns the prior year for numeric seasons", () => {
    expect(previousSeason("2026")).toBe("2025");
  });

  it("returns undefined for invalid season formats", () => {
    expect(previousSeason("2025/2026")).toBeUndefined();
    expect(previousSeason(undefined)).toBeUndefined();
  });
});
