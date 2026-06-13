import type { ReasonBreakdown } from "./product-intelligence.types";

/** Pure helpers safe for client and server bundles. */
export function topReturnReasons(
  breakdown: ReasonBreakdown,
  limit = 5,
): Array<{ category: keyof ReasonBreakdown; count: number }> {
  return Object.entries(breakdown)
    .map(([category, count]) => ({
      category: category as keyof ReasonBreakdown,
      count,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
