const AVG_CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}
