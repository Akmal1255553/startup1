import { decisionLabel, getAppCommonCopy } from "../i18n/messages/app/common";
import type { Locale } from "../i18n/types";

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
    category:
      | "value"
      | "payment"
      | "fulfillment"
      | "customer"
      | "account"
      | "playbook";
  }>;
  appliedPlaybooks: string[];
  savedDecision: string | null;
  /** 1–2 sentence plain-English explanation generated from the signals. */
  narrative: string;
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
    /** Standard deviation of risk across orders — surfaces ambiguity. */
    riskSpread: number;
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

export function getDecisionLabel(decision: string, locale: Locale = "en") {
  return decisionLabel(getAppCommonCopy(locale), decision);
}

export function getDecisionTone(decision: string) {
  if (decision === "approved") return "success";
  if (decision === "hold") return "critical";
  return "attention";
}

export function getMoneyFormatter(
  currencyCode: string,
  locale: string = "en-US",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  });
}
