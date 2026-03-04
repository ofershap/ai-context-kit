import type { RuleFile, SelectOptions } from "./types.js";

function ruleMatchesTag(rule: RuleFile, tag: string): boolean {
  const lower = tag.toLowerCase();
  const pathLower = rule.path.toLowerCase();
  const bodyLower = rule.body.toLowerCase();

  return pathLower.includes(lower) || bodyLower.includes(lower);
}

function scoreRelevance(rule: RuleFile, options: SelectOptions): number {
  let score = 0;

  if (rule.frontmatter.alwaysApply) {
    score += 100;
  }

  if (options.task) {
    const taskWords = options.task.toLowerCase().split(/\s+/);
    const bodyLower = rule.body.toLowerCase();
    const pathLower = rule.path.toLowerCase();

    for (const word of taskWords) {
      if (word.length < 3) continue;
      if (bodyLower.includes(word)) score += 10;
      if (pathLower.includes(word)) score += 20;
    }
  }

  if (options.tags) {
    for (const tag of options.tags) {
      if (ruleMatchesTag(rule, tag)) score += 15;
    }
  }

  return score;
}

export function select(
  rules: RuleFile[],
  options: SelectOptions = {},
): RuleFile[] {
  let filtered = [...rules];

  const includeList = options.include;
  if (includeList?.length) {
    filtered = filtered.filter((r) =>
      includeList.some((inc) =>
        r.path.toLowerCase().includes(inc.toLowerCase()),
      ),
    );
  }

  const excludeList = options.exclude;
  if (excludeList?.length) {
    filtered = filtered.filter(
      (r) =>
        !excludeList.some((exc) =>
          r.path.toLowerCase().includes(exc.toLowerCase()),
        ),
    );
  }

  const scored = filtered
    .map((rule) => ({ rule, score: scoreRelevance(rule, options) }))
    .sort((a, b) => b.score - a.score);

  if (!options.budget) {
    return scored.map((s) => s.rule);
  }

  const selected: RuleFile[] = [];
  let usedTokens = 0;

  for (const { rule } of scored) {
    if (usedTokens + rule.tokens > options.budget) continue;
    selected.push(rule);
    usedTokens += rule.tokens;
  }

  return selected;
}
