import type { RuleFile, MeasureReport, RuleMeasure } from "./types.js";

export function measure(rules: RuleFile[], budget?: number): MeasureReport {
  const totalTokens = rules.reduce((sum, r) => sum + r.tokens, 0);

  const sorted: RuleMeasure[] = rules
    .map((r) => ({
      path: r.path,
      tokens: r.tokens,
      percentage:
        totalTokens > 0 ? Math.round((r.tokens / totalTokens) * 100) : 0,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  return {
    totalTokens,
    rules: sorted,
    budget,
    overBudget: budget !== undefined && totalTokens > budget,
  };
}
