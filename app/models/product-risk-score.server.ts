import type {
  ProductReturnRow,
  ProductRiskLevel,
  ReasonBreakdown,
} from "./product-intelligence.types";

const RECOVERABLE_RATE = 0.35;
const AT_RISK_RATE = 0.5;

export function returnRateRiskLevel(returnRate: number): ProductRiskLevel {
  if (returnRate >= 20) return "high";
  if (returnRate >= 10) return "medium";
  return "low";
}

/**
 * Composite product risk score (0–100) from return rate, frequency,
 * revenue impact, and complaint signals.
 */
export function calculateProductRiskScore(input: {
  returnRate: number;
  returnsCount: number;
  ordersCount: number;
  revenueLost: number;
  maxRevenueLost: number;
  customerComplaints: number;
}): number {
  const rateComponent = Math.min(100, input.returnRate * 2.5) * 0.35;
  const frequencyRatio =
    input.ordersCount > 0 ? input.returnsCount / input.ordersCount : 0;
  const frequencyComponent = Math.min(100, frequencyRatio * 100) * 0.25;
  const revenueRatio =
    input.maxRevenueLost > 0 ? input.revenueLost / input.maxRevenueLost : 0;
  const revenueComponent = Math.min(100, revenueRatio * 100) * 0.25;
  const complaintComponent = Math.min(100, input.customerComplaints * 12) * 0.15;

  return Math.round(
    Math.min(
      100,
      Math.max(
        0,
        rateComponent +
          frequencyComponent +
          revenueComponent +
          complaintComponent,
      ),
    ),
  );
}

export function scoreToRiskLevel(score: number): ProductRiskLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function calculateRevenueImpact(revenueLost: number): {
  revenueAtRisk: number;
  revenueRecoverable: number;
} {
  return {
    revenueAtRisk: roundMoney(revenueLost * AT_RISK_RATE),
    revenueRecoverable: roundMoney(revenueLost * RECOVERABLE_RATE),
  };
}

export function finalizeProductRow(
  row: Omit<
    ProductReturnRow,
    "riskScore" | "riskLevel" | "revenueAtRisk" | "revenueRecoverable"
  >,
  maxRevenueLost: number,
): ProductReturnRow {
  const revenueImpact = calculateRevenueImpact(row.revenueLost);
  const riskScore = calculateProductRiskScore({
    returnRate: row.returnRate,
    returnsCount: row.returnsCount,
    ordersCount: row.ordersCount,
    revenueLost: row.revenueLost,
    maxRevenueLost,
    customerComplaints: row.customerComplaints,
  });

  return {
    ...row,
    ...revenueImpact,
    riskScore,
    riskLevel: returnRateRiskLevel(row.returnRate),
  };
}

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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
