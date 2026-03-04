import { loadRules } from "./load.js";
import { measure } from "./measure.js";
import { lint } from "./lint.js";
import { sync } from "./sync.js";
import { init } from "./init.js";
import type { RuleFormat } from "./types.js";

const HELP = `
ai-context-kit - Intelligent context management for AI coding agents

Usage:
  ai-context-kit <command> [options]

Commands:
  lint      Lint rules for quality issues, conflicts, and token waste
  measure   Measure token cost of all rules
  sync      Sync rules across formats (Cursor, Claude, Copilot, etc.)
  init      Create starter rule files
  help      Show this help message

Options:
  --path <dir>        Root directory (default: current directory)
  --budget <number>   Token budget for measure command
  --source <path>     Source rules path for sync
  --target <paths>    Comma-separated target paths for sync
  --format <format>   Format for init (cursor-rules, claude-md, agents-md)
  --dry-run           Preview sync changes without writing
  --json              Output as JSON
`;

function formatNumber(n: number): string {
  return n.toLocaleString();
}

async function runLint(args: string[]): Promise<void> {
  const path = getFlagValue(args, "--path");
  const json = args.includes("--json");

  const rules = await loadRules(path);

  if (rules.length === 0) {
    console.log(
      "No rule files found. Run `ai-context-kit init` to get started.",
    );
    process.exit(0);
  }

  const report = lint(rules);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`\nai-context-kit lint - ${rules.length} rule file(s) found\n`);

  if (report.issues.length === 0) {
    console.log("  No issues found.\n");
  } else {
    for (const issue of report.issues) {
      const icon =
        issue.severity === "error"
          ? "x"
          : issue.severity === "warning"
            ? "!"
            : "i";
      console.log(`  [${icon}] ${issue.path}`);
      console.log(`      ${issue.message}\n`);
    }
  }

  console.log(
    `  Score: ${report.score}/100${report.passed ? "" : " (FAILED)"}\n`,
  );

  process.exit(report.passed ? 0 : 1);
}

async function runMeasure(args: string[]): Promise<void> {
  const path = getFlagValue(args, "--path");
  const budgetStr = getFlagValue(args, "--budget");
  const budget = budgetStr ? Number(budgetStr) : undefined;
  const json = args.includes("--json");

  const rules = await loadRules(path);

  if (rules.length === 0) {
    console.log(
      "No rule files found. Run `ai-context-kit init` to get started.",
    );
    process.exit(0);
  }

  const report = measure(rules, budget);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`\nai-context-kit measure - ${rules.length} rule file(s)\n`);
  console.log(`  Total: ${formatNumber(report.totalTokens)} tokens\n`);

  for (const rule of report.rules) {
    const bar = "#".repeat(Math.max(1, Math.round(rule.percentage / 3)));
    console.log(
      `  ${bar} ${formatNumber(rule.tokens)} tokens (${rule.percentage}%) - ${rule.path}`,
    );
  }

  if (budget) {
    console.log(
      `\n  Budget: ${formatNumber(budget)} tokens${report.overBudget ? " - OVER BUDGET" : " - within budget"}`,
    );
  }

  console.log();
}

async function runSync(args: string[]): Promise<void> {
  const source = getFlagValue(args, "--source");
  const targetStr = getFlagValue(args, "--target");
  const dryRun = args.includes("--dry-run");
  const json = args.includes("--json");

  if (!source || !targetStr) {
    console.error(
      "Usage: ai-context-kit sync --source <path> --target <paths>",
    );
    console.error(
      "Example: ai-context-kit sync --source .cursor/rules/ --target CLAUDE.md,AGENTS.md",
    );
    process.exit(1);
    return;
  }

  const targets = targetStr.split(",").map((t) => t.trim());
  const results = await sync({ source, targets, dryRun });

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(`\nai-context-kit sync${dryRun ? " (dry run)" : ""}\n`);

  for (const result of results) {
    const status = result.written
      ? "written"
      : result.changes
        ? "would write"
        : "up to date";
    console.log(`  ${status}: ${result.target}`);
  }

  console.log();
}

async function runInit(args: string[]): Promise<void> {
  const path = getFlagValue(args, "--path");
  const format = (getFlagValue(args, "--format") ??
    "cursor-rules") as RuleFormat;

  const created = await init({ path: path ?? ".", format });
  console.log(`\nCreated: ${created}\n`);
  console.log("Edit this file with your project-specific rules, then run:");
  console.log("  ai-context-kit lint     # check for issues");
  console.log("  ai-context-kit measure  # see token cost\n");
}

function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "lint":
      await runLint(args);
      break;
    case "measure":
      await runMeasure(args);
      break;
    case "sync":
      await runSync(args);
      break;
    case "init":
      await runInit(args);
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
