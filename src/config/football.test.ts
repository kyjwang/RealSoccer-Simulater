import { describe, expect, it } from "vitest";

import { buildSupportedSeasons } from "./football";

describe("buildSupportedSeasons", () => {
  it("builds descending season labels from base year", () => {
    expect(buildSupportedSeasons(2026, 5)).toEqual(["2026", "2025", "2024", "2023", "2022"]);
  });

  it("always returns at least one season", () => {
    expect(buildSupportedSeasons(2026, 0)).toEqual(["2026"]);
  });
});
