import type { RuleFile, LintIssue, LintReport } from "./types.js";

const HIGH_TOKEN_THRESHOLD = 2000;
const VERY_HIGH_TOKEN_THRESHOLD = 5000;
const MIN_BODY_LENGTH = 20;

function lintTokenBudget(rules: RuleFile[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const rule of rules) {
    if (rule.tokens > VERY_HIGH_TOKEN_THRESHOLD) {
      issues.push({
        rule: "token-budget",
        path: rule.path,
        severity: "error",
        message: `Rule is ${rule.tokens} tokens. Files over ${VERY_HIGH_TOKEN_THRESHOLD} tokens waste context window and reduce agent accuracy (ETH Zurich, Feb 2026). Split into focused files.`,
      });
    } else if (rule.tokens > HIGH_TOKEN_THRESHOLD) {
      issues.push({
        rule: "token-budget",
        path: rule.path,
        severity: "warning",
        message: `Rule is ${rule.tokens} tokens. Consider splitting to keep each file under ${HIGH_TOKEN_THRESHOLD} tokens.`,
      });
    }
  }

  return issues;
}

function lintEmptyRules(rules: RuleFile[]): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const rule of rules) {
    if (rule.body.trim().length < MIN_BODY_LENGTH) {
      issues.push({
        rule: "empty-rule",
        path: rule.path,
        severity: "warning",
        message: "Rule body is empty or too short to be useful.",
      });
    }
  }

  return issues;
}

function lintDuplicateContent(rules: RuleFile[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const seen = new Map<string, string>();

  for (const rule of rules) {
    const lines = rule.body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 30);

    for (const line of lines) {
      const existing = seen.get(line);
      if (existing && existing !== rule.path) {
        issues.push({
          rule: "duplicate-content",
          path: rule.path,
          severity: "warning",
          message: `Duplicated line also found in ${existing}. Duplicates waste tokens.`,
        });
        break;
      }
      seen.set(line, rule.path);
    }
  }

  return issues;
}

function lintConflicts(rules: RuleFile[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const contradictions = [
    { positive: /always use (\w+)/gi, negative: /never use (\w+)/gi },
    { positive: /prefer (\w+)/gi, negative: /avoid (\w+)/gi },
    { positive: /use (\w+) over/gi, negative: /use \w+ over (\w+)/gi },
  ];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const ruleA = rules[i];
      const ruleB = rules[j];
      if (!ruleA || !ruleB) continue;

      for (const { positive, negative } of contradictions) {
        const posMatches = [...ruleA.body.matchAll(new RegExp(positive))];
        const negMatches = [...ruleB.body.matchAll(new RegExp(negative))];

        for (const pos of posMatches) {
          for (const neg of negMatches) {
            const posCapture = pos[1];
            const negCapture = neg[1];
            if (
              posCapture &&
              negCapture &&
              posCapture.toLowerCase() === negCapture.toLowerCase()
            ) {
              issues.push({
                rule: "conflict",
                path: ruleA.path,
                severity: "error",
                message: `Conflicts with ${ruleB.path}: "${pos[0]}" vs "${neg[0]}"`,
              });
            }
          }
        }
      }
    }
  }

  return issues;
}

function lintDirectoryListing(rules: RuleFile[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const dirTreePattern = /^[\s│├└─]+[\w./-]+\s*$/gm;

  for (const rule of rules) {
    const matches = rule.body.match(dirTreePattern);
    if (matches && matches.length > 10) {
      issues.push({
        rule: "directory-listing",
        path: rule.path,
        severity: "warning",
        message: `Contains a ${matches.length}-line directory tree. Agents already know how to read directory structures. This wastes tokens without improving accuracy.`,
      });
    }
  }

  return issues;
}

function lintVagueInstructions(rules: RuleFile[]): LintIssue[] {
  const issues: LintIssue[] = [];
  const vaguePatterns = [
    /follow best practices/i,
    /write clean code/i,
    /use modern patterns/i,
    /be consistent/i,
    /keep it simple/i,
    /write good tests/i,
  ];

  for (const rule of rules) {
    for (const pattern of vaguePatterns) {
      if (pattern.test(rule.body)) {
        issues.push({
          rule: "vague-instruction",
          path: rule.path,
          severity: "info",
          message: `Contains vague instruction matching "${pattern.source}". Specific instructions produce better results than general advice.`,
        });
        break;
      }
    }
  }

  return issues;
}

function computeScore(issues: LintIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "error") score -= 15;
    else if (issue.severity === "warning") score -= 5;
    else score -= 1;
  }
  return Math.max(0, score);
}

export function lint(rules: RuleFile[]): LintReport {
  const issues = [
    ...lintTokenBudget(rules),
    ...lintEmptyRules(rules),
    ...lintDuplicateContent(rules),
    ...lintConflicts(rules),
    ...lintDirectoryListing(rules),
    ...lintVagueInstructions(rules),
  ];

  const score = computeScore(issues);

  return {
    issues,
    score,
    passed: issues.every((i) => i.severity !== "error"),
  };
}
