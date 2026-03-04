import { describe, it, expect } from "vitest";
import { estimateTokens } from "../src/tokens.js";

describe("estimateTokens", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("estimates roughly 1 token per 4 characters", () => {
    const text = "a".repeat(100);
    expect(estimateTokens(text)).toBe(25);
  });

  it("rounds up", () => {
    expect(estimateTokens("hi")).toBe(1);
    expect(estimateTokens("hello")).toBe(2);
  });

  it("handles multiline content", () => {
    const text = "line one\nline two\nline three\n";
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(5);
  });
});
