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
  id: string;
  adminPath: string;
  name: string;
  createdAt: string;
  customer: string;
  customerOrders: number;
  value: number;
  currencyCode: string;
  financialStatus: string;
  fulfillmentStatus: string;
  risk: number;
  recommendation: string;
  factors: string[];
  savedDecision: string | null;
};

export type DashboardData = {
  orders: RiskOrder[];
  settings: RiskSettings;
  summary: {
    protectedMargin: number;
    reviewCount: number;
    holdCount: number;
    autoApprovedCount: number;
    currencyCode: string;
    analyzedOrders: number;
    confidence: number;
    detectedOrders: number;
  };
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
