import type { Playbook, ReturnDecision } from "@prisma/client";
import type { DashboardData, RiskOrder, RiskSettings } from "./return-risk";

/**
 * Minimum projection of a saved decision needed by the risk engine.
 * Lets callers use a Prisma `select` to load only `{ orderId, decision }`
 * instead of full ReturnDecision rows.
 */
export type SavedDecisionProjection = Pick<
  ReturnDecision,
  "orderId" | "decision"
>;

type ShopifyOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  currentTotalPriceSet: {
    shopMoney: {
      amount: string;
      currencyCode: string;
    };
  };
  customer: {
    displayName: string;
    email?: string | null;
    numberOfOrders: string;
    createdAt?: string | null;
    tags?: string[];
  } | null;
};

export type RiskReason = {
  label: string;
  points: number;
  category: "value" | "payment" | "fulfillment" | "customer" | "playbook";
};

export function buildRiskOrders(
  orders: ShopifyOrderNode[],
  settings: RiskSettings,
  playbooks: Playbook[],
  decisions: SavedDecisionProjection[],
): RiskOrder[] {
  const decisionByOrderId = new Map(
    decisions.map((decision) => [decision.orderId, decision.decision]),
  );

  return orders.map((order) => {
    const computed = scoreOrder(order, settings, playbooks);
    return {
      ...computed,
      savedDecision: decisionByOrderId.get(computed.id) || computed.savedDecision,
    };
  });
}

function scoreOrder(
  order: ShopifyOrderNode,
  settings: RiskSettings,
  playbooks: Playbook[],
): RiskOrder {
  const money = order.currentTotalPriceSet.shopMoney;
  const value = Number(money.amount);
  const customerOrders = Number(order.customer?.numberOfOrders || 0);
  const financialStatus = order.displayFinancialStatus || "Unknown payment";
  const fulfillmentStatus = order.displayFulfillmentStatus || "Unfulfilled";
  const email = (order.customer?.email || "").toLowerCase();
  const accountAgeDays = getAccountAgeDays(order.customer?.createdAt || null);
  const reasons: RiskReason[] = [];
  let risk = 18;

  if (value >= settings.highValueThreshold) {
    risk += 34;
    reasons.push({ label: "High order value", points: 34, category: "value" });
  } else if (value >= settings.mediumValueThreshold) {
    risk += 18;
    reasons.push({ label: "Medium order value", points: 18, category: "value" });
  } else {
    reasons.push({ label: "Low order value", points: 0, category: "value" });
  }

  if (!financialStatus.toLowerCase().includes("paid")) {
    risk += settings.paymentReviewRiskDelta;
    reasons.push({
      label: "Payment requires review",
      points: settings.paymentReviewRiskDelta,
      category: "payment",
    });
  }

  if (!fulfillmentStatus.toLowerCase().includes("fulfilled")) {
    risk += settings.unfulfilledRiskDelta;
    reasons.push({
      label: "Order not fulfilled",
      points: settings.unfulfilledRiskDelta,
      category: "fulfillment",
    });
  }

  if (customerOrders >= 5) {
    risk += settings.repeatCustomerRiskDelta;
    reasons.push({
      label: "High return/order history",
      points: settings.repeatCustomerRiskDelta,
      category: "customer",
    });
  } else if (customerOrders <= 1) {
    risk += settings.newCustomerRiskDelta;
    reasons.push({
      label: "New customer",
      points: settings.newCustomerRiskDelta,
      category: "customer",
    });
  }

  const appliedPlaybooks: string[] = [];
  let forcedDecision: RiskOrder["savedDecision"] = null;
  for (const playbook of playbooks) {
    if (!playbook.isActive) continue;
    if (!playbookMatches(playbook, { value, email, customerOrders, accountAgeDays }))
      continue;
    appliedPlaybooks.push(playbook.name);
    reasons.push({
      label: `Playbook matched: ${playbook.name}`,
      points: 0,
      category: "playbook",
    });
    forcedDecision = playbook.action as RiskOrder["savedDecision"];
  }

  const normalizedRisk = Math.min(96, Math.max(8, risk));
  return {
    id: order.id,
    adminPath: `shopify:admin/orders/${getNumericId(order.id)}`,
    name: order.name,
    createdAt: order.createdAt,
    customer: order.customer?.displayName || "Guest checkout",
    customerOrders,
    email: email || null,
    accountAgeDays,
    value,
    currencyCode: money.currencyCode,
    financialStatus,
    fulfillmentStatus,
    risk: normalizedRisk,
    recommendation: getRecommendation(normalizedRisk, settings),
    factors: reasons.map((reason) => reason.label),
    riskReasons: reasons,
    appliedPlaybooks,
    savedDecision: forcedDecision,
  };
}

function playbookMatches(
  playbook: Playbook,
  context: {
    value: number;
    email: string;
    customerOrders: number;
    accountAgeDays: number | null;
  },
) {
  if (
    Number.isFinite(playbook.minOrderValue) &&
    playbook.minOrderValue !== null &&
    context.value < playbook.minOrderValue
  ) {
    return false;
  }

  if (
    Number.isFinite(playbook.repeatReturnsThreshold) &&
    playbook.repeatReturnsThreshold !== null &&
    context.customerOrders < playbook.repeatReturnsThreshold
  ) {
    return false;
  }

  if (
    Number.isFinite(playbook.minAccountAgeDays) &&
    playbook.minAccountAgeDays !== null
  ) {
    if (context.accountAgeDays === null) return false;
    if (context.accountAgeDays < playbook.minAccountAgeDays) return false;
  }

  if (playbook.suspiciousDomainsCsv) {
    const domain = context.email.split("@")[1] || "";
    const suspiciousDomains = playbook.suspiciousDomainsCsv
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (!suspiciousDomains.includes(domain)) {
      return false;
    }
  }

  if (playbook.vipBypassEnabled && context.customerOrders >= 20) {
    return false;
  }

  return true;
}

function getRecommendation(risk: number, settings: RiskSettings) {
  if (risk >= settings.holdRiskThreshold) return "Hold refund";
  if (risk >= settings.reviewRiskThreshold) return "Manual review";
  return "Approve automatically";
}

function getNumericId(gid: string) {
  return gid.split("/").pop() || gid;
}

function getAccountAgeDays(createdAt: string | null) {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return null;
  const diffMs = Date.now() - created;
  return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
}

export function summarizeOrders(
  orders: RiskOrder[],
  settings: RiskSettings,
  options: { detectedOrders?: number } = {},
): DashboardData["summary"] {
  const protectedMargin = orders
    .filter((order) => order.risk >= settings.reviewRiskThreshold)
    .reduce(
      (sum, order) => sum + order.value * settings.protectedMarginMultiplier,
      0,
    );
  const reviewCount = orders.filter(
    (order) =>
      order.risk >= settings.reviewRiskThreshold &&
      order.risk < settings.holdRiskThreshold,
  ).length;
  const holdCount = orders.filter(
    (order) => order.risk >= settings.holdRiskThreshold,
  ).length;
  const autoApprovedCount = orders.filter(
    (order) => order.risk < settings.reviewRiskThreshold,
  ).length;
  const averageRisk = orders.length
    ? orders.reduce((sum, order) => sum + order.risk, 0) / orders.length
    : 0;
  const approvedCount = orders.filter(
    (order) => order.savedDecision === "approved",
  ).length;
  const flaggedReturns = reviewCount + holdCount;

  return {
    protectedMargin,
    reviewCount,
    holdCount,
    autoApprovedCount,
    currencyCode: orders[0]?.currencyCode || "USD",
    analyzedOrders: orders.length,
    confidence: orders.length
      ? Math.max(68, Math.round(100 - averageRisk / 3))
      : 0,
    detectedOrders: options.detectedOrders ?? orders.length,
    totalReturns: orders.length,
    flaggedReturns,
    approvalRatio: orders.length
      ? Math.round((approvedCount / orders.length) * 100)
      : 0,
    averageRiskScore: Math.round(averageRisk),
  };
}
