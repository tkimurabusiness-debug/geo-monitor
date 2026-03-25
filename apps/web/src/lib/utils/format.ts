/** Format a number with commas (Japanese locale) */
export function formatNumber(n: number): string {
  return n.toLocaleString("ja-JP");
}

/** Format a percentage with 1 decimal */
export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** Format a score like 78.5 */
export function formatScore(n: number): string {
  return n.toFixed(1);
}

/** Format a date string to Japanese locale */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format relative time (e.g., "3日前") */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHr < 24) return `${diffHr}時間前`;
  if (diffDay < 30) return `${diffDay}日前`;
  return formatDate(dateStr);
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "…";
}
