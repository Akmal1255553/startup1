export type RiskSettings = {
  mediumValueThreshold: number;
  highValueThreshold: number;
  reviewRiskThreshold: number;
  holdRiskThreshold: number;
  newCustomerRiskDelta: number;
  repeatCustomerRiskDelta: number;
  unfulfilledRiskDelta: number;
  paymentReviewRiskDelta: number;
  protectedMarginMultiplier: number;
};

export type RiskOrder = {
  /** Row id: Shopify Return GID in the returns queue, Order GID on the dashboard. */
  id: string;
  /** Parent order GID — always set. */
  orderId: string;
  /** Set when this row is backed by a Shopify Return (queue). */
  returnId: string | null;
  returnName: string | null;
  returnStatus: string | null;
  returnQuantity: number | null;
  adminPath: string;
  name: string;
  createdAt: string;
  customer: string;
  customerOrders: number;
  email: string | null;
  accountAgeDays: number | null;
  value: number;
  currencyCode: string;
  financialStatus: string;
  fulfillmentStatus: string;
  risk: number;
  recommendation: string;
  factors: string[];
  riskReasons: Array<{
    label: string;
    points: number;
    category: "value" | "payment" | "fulfillment" | "customer" | "playbook";
  }>;
  appliedPlaybooks: string[];
  savedDecision: string | null;
};

export type DashboardData = {
  orders: RiskOrder[];
  settings: RiskSettings;
  summary: {
    protectedMargin: number;
    /** Sum of order totals for rows at or above manual review risk (same basis as protected margin). */
    flaggedGmvTotal: number;
    reviewCount: number;
    holdCount: number;
    autoApprovedCount: number;
    currencyCode: string;
    analyzedOrders: number;
    confidence: number;
    detectedOrders: number;
    totalReturns: number;
    flaggedReturns: number;
    approvalRatio: number;
    averageRiskScore: number;
  };
  recentActions: Array<{
    id: string;
    orderName: string;
    decision: string;
    risk: number | null;
    createdAt: string;
    previousDecision: string | null;
  }>;
  error: string | null;
  needsProtectedDataAccess: boolean;
};

export function getDecisionLabel(decision: string) {
  if (decision === "approved") return "Approved";
  if (decision === "hold") return "Refund held";
  return "Needs review";
}

export function getDecisionTone(decision: string) {
  if (decision === "approved") return "success";
  if (decision === "hold") return "critical";
  return "attention";
}

export function getMoneyFormatter(currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  });
}
