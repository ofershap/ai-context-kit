import type { RuleFile, RuleFormat, RuleFrontmatter } from "./types.js";
import { estimateTokens } from "./tokens.js";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n/;

export function parseFrontmatter(raw: string): {
  frontmatter: RuleFrontmatter;
  body: string;
} {
  const match = FRONTMATTER_RE.exec(raw);
  if (!match?.[1]) {
    return { frontmatter: {}, body: raw };
  }

  const fm: RuleFrontmatter = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!key) continue;

    if (value === "true") fm[key] = true;
    else if (value === "false") fm[key] = false;
    else if (/^\d+$/.test(value)) fm[key] = Number(value);
    else fm[key] = value;
  }

  return {
    frontmatter: fm,
    body: raw.slice(match[0].length),
  };
}

export function detectFormat(filePath: string): RuleFormat {
  const lower = filePath.toLowerCase();
  const name = lower.split("/").pop() ?? "";

  if (lower.includes(".cursor/rules")) return "cursor-rules";
  if (name === ".cursorrules") return "cursor-legacy";
  if (name === "claude.md") return "claude-md";
  if (name === "agents.md") return "agents-md";
  if (name === "copilot-instructions.md") return "copilot-md";
  if (name === ".windsurfrules") return "windsurf-rules";
  if (name === ".clinerules") return "cline-rules";

  return "generic-md";
}

export function parseRule(filePath: string, content: string): RuleFile {
  const format = detectFormat(filePath);
  const { frontmatter, body } = parseFrontmatter(content);

  return {
    path: filePath,
    format,
    content,
    frontmatter,
    body,
    tokens: estimateTokens(content),
  };
}
