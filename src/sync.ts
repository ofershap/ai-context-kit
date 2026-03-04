import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { RuleFile, SyncOptions, SyncResult } from "./types.js";
import { loadRules } from "./load.js";
import { detectFormat } from "./parse.js";

function rulesToMarkdown(rules: RuleFile[]): string {
  const sections: string[] = [];

  for (const rule of rules) {
    const name =
      rule.path
        .split("/")
        .pop()
        ?.replace(/\.(md|mdc|txt)$/, "") ?? "rule";
    sections.push(`## ${name}\n\n${rule.body.trim()}`);
  }

  return sections.join("\n\n---\n\n") + "\n";
}

function wrapForFormat(content: string, targetPath: string): string {
  const format = detectFormat(targetPath);

  switch (format) {
    case "claude-md":
      return `# Project Rules\n\n${content}`;
    case "agents-md":
      return `# Agent Instructions\n\n${content}`;
    case "copilot-md":
      return content;
    default:
      return content;
  }
}

export async function sync(options: SyncOptions): Promise<SyncResult[]> {
  const sourceRules = await loadRules(resolve(options.source));
  const merged = rulesToMarkdown(sourceRules);
  const results: SyncResult[] = [];

  for (const target of options.targets) {
    const targetPath = resolve(target);
    const content = wrapForFormat(merged, targetPath);

    let existingContent = "";
    try {
      existingContent = await readFile(targetPath, "utf-8");
    } catch {
      // file doesn't exist yet
    }

    const changed = existingContent !== content;

    if (!options.dryRun && changed) {
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, content, "utf-8");
    }

    results.push({
      target: targetPath,
      written: !options.dryRun && changed,
      content,
      changes: changed ? 1 : 0,
    });
  }

  return results;
}
