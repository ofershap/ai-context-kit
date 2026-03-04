export type RuleFormat =
  | "cursor-rules"
  | "cursor-legacy"
  | "claude-md"
  | "agents-md"
  | "copilot-md"
  | "windsurf-rules"
  | "cline-rules"
  | "generic-md";

export interface RuleFrontmatter {
  description?: string;
  globs?: string;
  alwaysApply?: boolean;
  [key: string]: unknown;
}

export interface RuleFile {
  path: string;
  format: RuleFormat;
  content: string;
  frontmatter: RuleFrontmatter;
  body: string;
  tokens: number;
}

export interface MeasureReport {
  totalTokens: number;
  rules: RuleMeasure[];
  budget?: number | undefined;
  overBudget: boolean;
}

export interface RuleMeasure {
  path: string;
  tokens: number;
  percentage: number;
}

export type LintSeverity = "error" | "warning" | "info";

export interface LintIssue {
  rule: string;
  path: string;
  severity: LintSeverity;
  message: string;
  line?: number | undefined;
}

export interface LintReport {
  issues: LintIssue[];
  score: number;
  passed: boolean;
}

export interface SelectOptions {
  task?: string | undefined;
  budget?: number | undefined;
  tags?: string[] | undefined;
  include?: string[] | undefined;
  exclude?: string[] | undefined;
}

export interface SyncOptions {
  source: string;
  targets: string[];
  strategy?: "merge" | "overwrite" | undefined;
  dryRun?: boolean | undefined;
}

export interface SyncResult {
  target: string;
  written: boolean;
  content: string;
  changes: number;
}

export interface InitOptions {
  format?: RuleFormat | undefined;
  path?: string | undefined;
}
