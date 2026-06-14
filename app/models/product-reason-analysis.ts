import { emptyReasonBreakdown } from "./product-return-reasons";
import type {
  ProductReturnRow,
  ReasonBreakdown,
  ReturnReasonAnalysis,
} from "./product-intelligence.types";

export function buildReasonAnalysis(
  products: ProductReturnRow[],
): ReturnReasonAnalysis {
  const totals = emptyReasonBreakdown();
  for (const product of products) {
    for (const key of Object.keys(totals) as Array<keyof ReasonBreakdown>) {
      totals[key] += product.reasonBreakdown[key];
    }
  }

  const total = Object.values(totals).reduce((sum, count) => sum + count, 0);
  const toStat = (count: number) => ({
    count,
    percentage: total ? Math.round((count / total) * 100) : 0,
  });

  return {
    sizing: toStat(totals.sizing),
    damaged: toStat(totals.damaged),
    notAsDescribed: toStat(totals.notAsDescribed),
    changedMind: toStat(totals.changedMind),
    lateDelivery: toStat(totals.lateDelivery),
    other: toStat(totals.other),
    total,
  };
}
