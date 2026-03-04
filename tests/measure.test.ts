import { describe, it, expect } from "vitest";
import { measure } from "../src/measure.js";
import { parseRule } from "../src/parse.js";

function makeRule(path: string, content: string) {
  return parseRule(path, content);
}

describe("measure", () => {
  it("sums tokens across all rules", () => {
    const rules = [
      makeRule("a.md", "a".repeat(100)),
      makeRule("b.md", "b".repeat(200)),
    ];

    const report = measure(rules);
    expect(report.totalTokens).toBe(75);
    expect(report.rules).toHaveLength(2);
  });

  it("sorts rules by token count descending", () => {
    const rules = [
      makeRule("small.md", "x".repeat(40)),
      makeRule("big.md", "x".repeat(400)),
    ];

    const report = measure(rules);
    expect(report.rules[0]!.path).toBe("big.md");
    expect(report.rules[1]!.path).toBe("small.md");
  });

  it("calculates percentage per rule", () => {
    const rules = [
      makeRule("half.md", "x".repeat(200)),
      makeRule("other.md", "x".repeat(200)),
    ];

    const report = measure(rules);
    expect(report.rules[0]!.percentage).toBe(50);
    expect(report.rules[1]!.percentage).toBe(50);
  });

  it("reports over budget when exceeded", () => {
    const rules = [makeRule("big.md", "x".repeat(10000))];
    const report = measure(rules, 100);
    expect(report.overBudget).toBe(true);
  });

  it("reports within budget when not exceeded", () => {
    const rules = [makeRule("small.md", "hello")];
    const report = measure(rules, 100);
    expect(report.overBudget).toBe(false);
  });

  it("handles empty rules array", () => {
    const report = measure([]);
    expect(report.totalTokens).toBe(0);
    expect(report.rules).toEqual([]);
  });
});
