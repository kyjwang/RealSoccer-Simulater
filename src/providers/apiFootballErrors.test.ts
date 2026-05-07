import { describe, expect, it } from "vitest";

import { classifyApiFootballError } from "./apiFootballErrors";

describe("classifyApiFootballError", () => {
  it("maps explicit quota errors to quota_exceeded", () => {
    expect(classifyApiFootballError(429)).toEqual({
      state: "quota_exceeded",
      message: "API-Football quota limit reached."
    });
  });

  it("maps auth/key errors to missing_key", () => {
    expect(classifyApiFootballError(401, { error: "invalid API key" })).toEqual({
      state: "missing_key",
      message: "API-Football key is invalid or not authorized."
    });
  });

  it("maps forbidden responses to a specific access message", () => {
    const result = classifyApiFootballError(403);
    expect(result.state).toBe("forbidden");
    expect(result.message).toContain("access forbidden");
  });
});
