import { describe, it, expect } from "vitest";
import { lint } from "../src/lint.js";
import { parseRule } from "../src/parse.js";

function makeRule(path: string, content: string) {
  return parseRule(path, content);
}

describe("lint", () => {
  it("passes clean rules with no issues", () => {
    const rules = [
      makeRule(
        "api.md",
        "Use Zod for request validation. Return proper HTTP status codes.",
      ),
    ];

    const report = lint(rules);
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
    expect(report.issues).toHaveLength(0);
  });

  it("warns on high-token rules", () => {
    const rules = [makeRule("big.md", "x".repeat(10000))];
    const report = lint(rules);
    expect(report.issues.some((i) => i.rule === "token-budget")).toBe(true);
  });

  it("errors on very high-token rules", () => {
    const rules = [makeRule("huge.md", "x".repeat(25000))];
    const report = lint(rules);
    const tokenIssue = report.issues.find((i) => i.rule === "token-budget");
    expect(tokenIssue?.severity).toBe("error");
    expect(report.passed).toBe(false);
  });

  it("warns on empty rules", () => {
    const rules = [makeRule("empty.md", "hi")];
    const report = lint(rules);
    expect(report.issues.some((i) => i.rule === "empty-rule")).toBe(true);
  });

  it("detects duplicate content across files", () => {
    const shared =
      "This is a long duplicated instruction that appears in both files for testing.";
    const rules = [makeRule("a.md", shared), makeRule("b.md", shared)];
    const report = lint(rules);
    expect(report.issues.some((i) => i.rule === "duplicate-content")).toBe(
      true,
    );
  });

  it("detects conflicting instructions", () => {
    const rules = [
      makeRule("a.md", "Always use semicolons in TypeScript code."),
      makeRule("b.md", "Never use semicolons in the codebase."),
    ];
    const report = lint(rules);
    expect(report.issues.some((i) => i.rule === "conflict")).toBe(true);
  });

  it("warns on large directory trees", () => {
    const tree = Array.from({ length: 15 }, (_, i) => `├── file${i}.ts`).join(
      "\n",
    );
    const rules = [makeRule("structure.md", `# Project Structure\n\n${tree}`)];
    const report = lint(rules);
    expect(report.issues.some((i) => i.rule === "directory-listing")).toBe(
      true,
    );
  });

  it("flags vague instructions", () => {
    const rules = [
      makeRule(
        "vague.md",
        "follow best practices when writing code and keep it simple.",
      ),
    ];
    const report = lint(rules);
    expect(report.issues.some((i) => i.rule === "vague-instruction")).toBe(
      true,
    );
  });

  it("computes a score that decreases with issues", () => {
    const clean = lint([
      makeRule("ok.md", "Use Zod for validation. Return JSON."),
    ]);
    const messy = lint([
      makeRule("huge.md", "x".repeat(25000)),
      makeRule("vague.md", "follow best practices when writing code."),
    ]);

    expect(clean.score).toBeGreaterThan(messy.score);
  });
});
