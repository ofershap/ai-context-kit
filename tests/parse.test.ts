import { describe, it, expect } from "vitest";
import { parseFrontmatter, detectFormat, parseRule } from "../src/parse.js";

describe("parseFrontmatter", () => {
  it("parses YAML frontmatter from a rule file", () => {
    const raw = `---
description: My rule
alwaysApply: true
---

# Rule Body

Some content here.`;

    const result = parseFrontmatter(raw);
    expect(result.frontmatter.description).toBe("My rule");
    expect(result.frontmatter.alwaysApply).toBe(true);
    expect(result.body).toContain("# Rule Body");
    expect(result.body).toContain("Some content here.");
  });

  it("returns empty frontmatter when none exists", () => {
    const raw = "# Just a markdown file\n\nNo frontmatter here.";
    const result = parseFrontmatter(raw);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(raw);
  });

  it("parses numeric values", () => {
    const raw = `---
priority: 10
---
content`;
    const result = parseFrontmatter(raw);
    expect(result.frontmatter.priority).toBe(10);
  });

  it("handles false boolean", () => {
    const raw = `---
alwaysApply: false
---
content`;
    const result = parseFrontmatter(raw);
    expect(result.frontmatter.alwaysApply).toBe(false);
  });
});

describe("detectFormat", () => {
  it("detects .cursor/rules/ files", () => {
    expect(detectFormat(".cursor/rules/my-rule.mdc")).toBe("cursor-rules");
    expect(detectFormat("project/.cursor/rules/conventions.md")).toBe(
      "cursor-rules",
    );
  });

  it("detects .cursorrules legacy", () => {
    expect(detectFormat(".cursorrules")).toBe("cursor-legacy");
    expect(detectFormat("/home/user/project/.cursorrules")).toBe(
      "cursor-legacy",
    );
  });

  it("detects CLAUDE.md", () => {
    expect(detectFormat("CLAUDE.md")).toBe("claude-md");
    expect(detectFormat("/project/CLAUDE.md")).toBe("claude-md");
  });

  it("detects AGENTS.md", () => {
    expect(detectFormat("AGENTS.md")).toBe("agents-md");
  });

  it("detects copilot instructions", () => {
    expect(detectFormat(".github/copilot-instructions.md")).toBe("copilot-md");
  });

  it("detects windsurf rules", () => {
    expect(detectFormat(".windsurfrules")).toBe("windsurf-rules");
  });

  it("detects cline rules", () => {
    expect(detectFormat(".clinerules")).toBe("cline-rules");
  });

  it("falls back to generic-md", () => {
    expect(detectFormat("docs/conventions.md")).toBe("generic-md");
    expect(detectFormat("rules.txt")).toBe("generic-md");
  });
});

describe("parseRule", () => {
  it("creates a full RuleFile from path and content", () => {
    const content = `---
description: API conventions
alwaysApply: true
---

# API Conventions

Use RESTful patterns. Return JSON.`;

    const rule = parseRule(".cursor/rules/api.mdc", content);
    expect(rule.format).toBe("cursor-rules");
    expect(rule.frontmatter.description).toBe("API conventions");
    expect(rule.frontmatter.alwaysApply).toBe(true);
    expect(rule.body).toContain("Use RESTful patterns");
    expect(rule.tokens).toBeGreaterThan(0);
    expect(rule.path).toBe(".cursor/rules/api.mdc");
  });

  it("estimates tokens based on content length", () => {
    const short = parseRule("test.md", "short");
    const long = parseRule("test.md", "a".repeat(400));
    expect(long.tokens).toBeGreaterThan(short.tokens);
  });
});
