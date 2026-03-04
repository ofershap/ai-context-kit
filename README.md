<h1 align="center">contextkit</h1>

<p align="center">
  <strong>Your AI agent is drowning in context it doesn't need.</strong>
</p>

<p align="center">
  An ETH Zurich study found that AGENTS.md files <em>reduce</em> agent accuracy and increase costs by 20%.<br>
  contextkit loads your rules from any format, measures their token cost,<br>
  finds conflicts, and picks only what's relevant for the task at hand.
</p>

<p align="center">
  <a href="#quick-start"><img src="https://img.shields.io/badge/Quick_Start-grey?style=for-the-badge" alt="Quick Start" /></a>
  &nbsp;
  <a href="#api"><img src="https://img.shields.io/badge/API-grey?style=for-the-badge" alt="API" /></a>
  &nbsp;
  <a href="#cli"><img src="https://img.shields.io/badge/CLI-grey?style=for-the-badge" alt="CLI" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/contextkit"><img src="https://img.shields.io/npm/v/contextkit.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/contextkit"><img src="https://img.shields.io/npm/dm/contextkit.svg" alt="npm downloads" /></a>
  <a href="https://github.com/ofershap/contextkit/actions/workflows/ci.yml"><img src="https://github.com/ofershap/contextkit/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

---

## Context Is the New Bottleneck

You have CLAUDE.md, `.cursor/rules/`, AGENTS.md, `.github/copilot-instructions.md`, and maybe `.windsurfrules` too. They overlap. They contradict each other. They grow until they eat half your context window with directory listings and "follow best practices."

Research from ETH Zurich (February 2026) measured what actually happens:

- Auto-generated context files **reduced** task success rates compared to providing nothing
- Human-written ones improved accuracy by only 4%
- Inference costs jumped 20%+ from wasted tokens
- Agents followed unnecessary instructions and got confused

The fix isn't better prose. It's treating context like a budget.

```typescript
import { loadRules, measure, lint, select } from "contextkit";

const rules = await loadRules("./");
const report = measure(rules, 4000);
const issues = lint(rules);
const relevant = select(rules, { task: "fix auth bug", budget: 2000 });
```

Four functions. Load everything, see what it costs, find what's broken, keep what matters.

---

## Quick Start

```bash
npm install contextkit
```

Or use the CLI directly:

```bash
npx contextkit lint
npx contextkit measure
npx contextkit measure --budget 4000
```

---

## What It Does

|             |                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Load**    | Auto-detects and parses rules from `.cursor/rules/`, `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `copilot-instructions.md`, `.windsurfrules`, `.clinerules` |
| **Measure** | Estimates token cost per rule. Shows which files eat your budget                                                                                          |
| **Lint**    | Finds conflicts between rules, duplicate content, bloated files, vague instructions, useless directory trees                                              |
| **Select**  | Picks the right rules for a given task. Respects a token budget. Ranks by relevance                                                                       |
| **Sync**    | Writes your `.cursor/rules/` as CLAUDE.md, AGENTS.md, or any target format                                                                                |
| **Init**    | Scaffolds a starter rule file with tips from the research                                                                                                 |

---

## API

### `loadRules(rootDir?)`

Auto-detect and load all rule files from a project root.

```typescript
const rules = await loadRules("./");
// Finds .cursor/rules/*.mdc, CLAUDE.md, AGENTS.md, etc.

const rules = await loadRules(".cursor/rules/");
// Load from a specific directory
```

Returns `RuleFile[]` with parsed frontmatter, body text, format type, and token count.

### `measure(rules, budget?)`

See what your context costs.

```typescript
const report = measure(rules, 4000);

console.log(report.totalTokens); // 3847
console.log(report.overBudget); // false

for (const rule of report.rules) {
  console.log(`${rule.path}: ${rule.tokens} tokens (${rule.percentage}%)`);
}
```

### `lint(rules)`

Find problems before your agent does.

```typescript
const report = lint(rules);

console.log(report.score); // 85/100
console.log(report.passed); // true (no errors, some warnings)

for (const issue of report.issues) {
  console.log(`[${issue.severity}] ${issue.path}: ${issue.message}`);
}
```

Checks for:

| Rule                | What it catches                                         |
| ------------------- | ------------------------------------------------------- |
| `token-budget`      | Files over 2000 tokens (warning) or 5000 tokens (error) |
| `empty-rule`        | Files too short to be useful                            |
| `duplicate-content` | Same instruction in multiple files                      |
| `conflict`          | "always use X" in one file, "never use X" in another    |
| `directory-listing` | Large directory trees that waste tokens without helping |
| `vague-instruction` | "follow best practices" and similar non-instructions    |

### `select(rules, options)`

Pick the rules that matter for the current task.

```typescript
const relevant = select(rules, {
  task: "fix auth bug in /api/auth",
  budget: 2000,
  tags: ["security", "api"],
  exclude: ["style"],
});
```

Rules with `alwaysApply: true` in frontmatter are prioritized. Path matches and content matches boost relevance. Token budget is respected - high-relevance rules are included first.

### `sync(options)`

Keep all your context files in sync from a single source.

```typescript
const results = await sync({
  source: ".cursor/rules/",
  targets: ["CLAUDE.md", "AGENTS.md"],
  dryRun: true,
});

for (const result of results) {
  console.log(
    `${result.target}: ${result.changes ? "would update" : "up to date"}`,
  );
}
```

### `init(options?)`

Create a starter rule file.

```typescript
await init({ format: "cursor-rules" });
// Creates .cursor/rules/conventions.mdc
```

---

## CLI

### `contextkit lint`

```bash
npx contextkit lint
npx contextkit lint --path ./my-project
npx contextkit lint --json
```

Exits with code 1 if errors are found. Warnings don't fail.

### `contextkit measure`

```bash
npx contextkit measure
npx contextkit measure --budget 4000
npx contextkit measure --json
```

### `contextkit sync`

```bash
npx contextkit sync --source .cursor/rules/ --target CLAUDE.md,AGENTS.md
npx contextkit sync --source .cursor/rules/ --target CLAUDE.md --dry-run
```

### `contextkit init`

```bash
npx contextkit init
npx contextkit init --format claude-md
npx contextkit init --format agents-md
```

---

## Use with Vercel AI SDK / LangChain / Custom Agents

contextkit is not tied to any IDE. Use it anywhere you build agents:

```typescript
import { loadRules, select } from "contextkit";
import { generateText } from "ai";

const allRules = await loadRules("./rules");
const relevant = select(allRules, {
  task: userMessage,
  budget: 3000,
});

const systemPrompt = relevant.map((r) => r.body).join("\n\n");

const { text } = await generateText({
  model: openai("gpt-4o"),
  system: systemPrompt,
  prompt: userMessage,
});
```

Works with any framework that accepts a system prompt string.

---

## Supported Formats

| Format          | Path                              | Tool                 |
| --------------- | --------------------------------- | -------------------- |
| Cursor (modern) | `.cursor/rules/*.mdc`             | Cursor IDE           |
| Cursor (legacy) | `.cursorrules`                    | Cursor IDE           |
| Claude Code     | `CLAUDE.md`                       | Claude Code          |
| AGENTS.md       | `AGENTS.md`                       | Multi-agent standard |
| GitHub Copilot  | `.github/copilot-instructions.md` | GitHub Copilot       |
| Windsurf        | `.windsurfrules`                  | Windsurf             |
| Cline           | `.clinerules`                     | Cline                |

---

**Stack:** TypeScript (strict) · Vitest · tsup (ESM + CJS) · zero dependencies

---

## Author

[![Made by ofershap](https://gitshow.dev/api/card/ofershap)](https://gitshow.dev/ofershap)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/ofershap)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github&logoColor=white)](https://github.com/ofershap)

## License

[MIT](LICENSE) &copy; [Ofer Shapira](https://github.com/ofershap)
