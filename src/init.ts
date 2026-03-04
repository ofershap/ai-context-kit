import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { InitOptions, RuleFormat } from "./types.js";

const TEMPLATES: Record<string, { path: string; content: string }> = {
  "cursor-rules": {
    path: ".cursor/rules/conventions.mdc",
    content: `---
description: Project conventions and coding standards
alwaysApply: true
---

# Conventions

Add your project-specific rules here. Keep each rule file focused on one topic.

Tips from research:
- Specific instructions beat vague ones ("use Zod for validation" > "validate inputs")
- Shorter files outperform long ones (aim for under 2000 tokens per file)
- Skip directory listings and codebase overviews (agents can read the filesystem)
- Task-relevant rules only. Don't inject everything into every conversation
`,
  },
  "claude-md": {
    path: "CLAUDE.md",
    content: `# Project Rules

Add your project-specific rules here.

Tips from research:
- Specific instructions beat vague ones
- Shorter files outperform long ones
- Skip directory listings and codebase overviews
`,
  },
  "agents-md": {
    path: "AGENTS.md",
    content: `# Agent Instructions

Add your project-specific rules here.

Tips from research:
- Specific instructions beat vague ones
- Shorter files outperform long ones
- Skip directory listings and codebase overviews
`,
  },
};

export async function init(options: InitOptions = {}): Promise<string> {
  const root = resolve(options.path ?? ".");
  const format: RuleFormat = options.format ?? "cursor-rules";
  const fallback = TEMPLATES["cursor-rules"];
  const template = TEMPLATES[format] ?? fallback;
  if (!template) throw new Error(`Unknown format: ${format}`);

  const fullPath = join(root, template.path);
  await mkdir(join(root, ".cursor/rules"), { recursive: true });
  await writeFile(fullPath, template.content, "utf-8");

  return fullPath;
}
