import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { RuleFile } from "./types.js";
import { parseRule, detectFormat } from "./parse.js";

const KNOWN_FILES = [
  ".cursorrules",
  "CLAUDE.md",
  "AGENTS.md",
  ".github/copilot-instructions.md",
  ".windsurfrules",
  ".clinerules",
];

const KNOWN_DIRS = [".cursor/rules"];

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function readRuleFiles(dir: string): Promise<RuleFile[]> {
  const rules: RuleFile[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await readRuleFiles(fullPath);
      rules.push(...nested);
    } else if (
      entry.name.endsWith(".md") ||
      entry.name.endsWith(".mdc") ||
      entry.name.endsWith(".txt")
    ) {
      const content = await readFile(fullPath, "utf-8");
      rules.push(parseRule(fullPath, content));
    }
  }

  return rules;
}

export async function loadRules(rootDir?: string): Promise<RuleFile[]> {
  const root = resolve(rootDir ?? ".");
  const rules: RuleFile[] = [];

  if (await isDirectory(root)) {
    const format = detectFormat(root);
    if (format === "cursor-rules") {
      return readRuleFiles(root);
    }
  }

  for (const file of KNOWN_FILES) {
    const filePath = join(root, file);
    if (await exists(filePath)) {
      const content = await readFile(filePath, "utf-8");
      rules.push(parseRule(filePath, content));
    }
  }

  for (const dir of KNOWN_DIRS) {
    const dirPath = join(root, dir);
    if (await isDirectory(dirPath)) {
      const dirRules = await readRuleFiles(dirPath);
      rules.push(...dirRules);
    }
  }

  return rules;
}
