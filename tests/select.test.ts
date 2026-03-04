import { describe, it, expect } from "vitest";
import { select } from "../src/select.js";
import { parseRule } from "../src/parse.js";

function makeRule(path: string, content: string) {
  return parseRule(path, content);
}

describe("select", () => {
  it("returns all rules when no options given", () => {
    const rules = [
      makeRule("a.md", "content a"),
      makeRule("b.md", "content b"),
    ];
    const selected = select(rules);
    expect(selected).toHaveLength(2);
  });

  it("filters by include paths", () => {
    const rules = [
      makeRule("api/auth.md", "auth rules"),
      makeRule("ui/styles.md", "style rules"),
    ];

    const selected = select(rules, { include: ["api"] });
    expect(selected).toHaveLength(1);
    expect(selected[0]!.path).toBe("api/auth.md");
  });

  it("filters by exclude paths", () => {
    const rules = [
      makeRule("api/auth.md", "auth rules"),
      makeRule("ui/styles.md", "style rules"),
    ];

    const selected = select(rules, { exclude: ["ui"] });
    expect(selected).toHaveLength(1);
    expect(selected[0]!.path).toBe("api/auth.md");
  });

  it("ranks rules by task relevance", () => {
    const rules = [
      makeRule("style.md", "use tailwind for styling"),
      makeRule("auth.md", "always validate JWT tokens for auth endpoints"),
    ];

    const selected = select(rules, { task: "fix auth bug" });
    expect(selected[0]!.path).toBe("auth.md");
  });

  it("prioritizes alwaysApply rules", () => {
    const rules = [
      makeRule("optional.md", "some optional rule"),
      parseRule("core.md", "---\nalwaysApply: true\n---\ncore rules"),
    ];

    const selected = select(rules, { task: "anything" });
    expect(selected[0]!.path).toBe("core.md");
  });

  it("respects token budget", () => {
    const rules = [
      makeRule("big.md", "x".repeat(2000)),
      makeRule("small.md", "tiny rule"),
    ];

    const selected = select(rules, { budget: 100 });
    expect(selected).toHaveLength(1);
    expect(selected[0]!.path).toBe("small.md");
  });

  it("matches tags against file paths and content", () => {
    const rules = [
      makeRule("api-conventions.md", "use REST patterns"),
      makeRule("style.md", "use tailwind"),
    ];

    const selected = select(rules, { tags: ["api"] });
    expect(selected[0]!.path).toBe("api-conventions.md");
  });
});
