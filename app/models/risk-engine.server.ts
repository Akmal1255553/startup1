import type { Playbook, ReturnDecision } from "@prisma/client";
import type { DashboardData, RiskOrder, RiskSettings } from "./return-risk";

/**
 * Minimum projection of a saved decision needed by the risk engine.
 * Lets callers use a Prisma `select` to load only `{ orderId, decision }`
 * instead of full ReturnDecision rows.
 */
export type SavedDecisionProjection = Pick<
  ReturnDecision,
  "orderId" | "decision" | "returnId"
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
  category:
    | "value"
    | "payment"
    | "fulfillment"
    | "customer"
    | "account"
    | "playbook";
};

export function buildRiskOrders(
  orders: ShopifyOrderNode[],
  settings: RiskSettings,
  playbooks: Playbook[],
  decisions: SavedDecisionProjection[],
): RiskOrder[] {
  const decisionByOrderId = new Map(
    decisions
      .filter((row) => row.returnId === null || row.returnId === undefined)
      .map((row) => [row.orderId, row.decision]),
  );

  return orders.map((order) => {
    const computed = scoreOrder(order, settings, playbooks);
    return {
      ...computed,
      orderId: order.id,
      id: order.id,
      returnId: null,
      returnName: null,
      returnStatus: null,
      returnQuantity: null,
      savedDecision:
        decisionByOrderId.get(order.id) ?? computed.savedDecision,
    };
  });
}

/**
 * Apply DB decisions to risk rows. Return-specific decisions override
 * order-only decisions; both override playbook suggestions when present.
 */
export function mergeSavedDecisionsOntoRiskOrders(
  rows: RiskOrder[],
  decisions: SavedDecisionProjection[],
): RiskOrder[] {
  const byReturn = new Map(
    decisions
      .filter((row) => Boolean(row.returnId))
      .map((row) => [row.returnId as string, row.decision]),
  );
  const byOrderOnly = new Map(
    decisions
      .filter((row) => !row.returnId)
      .map((row) => [row.orderId, row.decision]),
  );

  return rows.map((row) => {
    const fromDb =
      (row.returnId ? byReturn.get(row.returnId) : undefined) ??
      byOrderOnly.get(row.orderId);

    return {
      ...row,
      savedDecision: fromDb ?? row.savedDecision,
    };
  });
}

/**
 * V2 scoring model — finer granularity, exact-token matching, deterministic
 * narrative generation. Earlier the substring check `includes("fulfilled")`
 * silently disabled the fulfillment delta on "Unfulfilled" (because the
 * word "unfulfilled" contains "fulfilled") which made most orders collapse
 * to the same score. V2 uses normalized status tokens with explicit lookup
 * tables and 6 value buckets relative to the merchant's high-value
 * threshold, so two distinct orders rarely come out at identical scores.
 */
function scoreOrder(
  order: ShopifyOrderNode,
  settings: RiskSettings,
  playbooks: Playbook[],
): RiskOrder {
  const money = order.currentTotalPriceSet.shopMoney;
  const value = Number(money.amount) || 0;
  const customerOrders = Number(order.customer?.numberOfOrders || 0);
  const isGuest = !order.customer;
  const financialStatusRaw =
    order.displayFinancialStatus || "Unknown payment";
  const fulfillmentStatusRaw =
    order.displayFulfillmentStatus || "Unknown";
  const email = (order.customer?.email || "").toLowerCase();
  const accountAgeDays = getAccountAgeDays(order.customer?.createdAt || null);
  const reasons: RiskReason[] = [];

  let risk = 10; // baseline “unknown” risk before any signals weigh in.

  // -------------------------- VALUE --------------------------------------
  const high = settings.highValueThreshold || 250;
  const med = settings.mediumValueThreshold || 100;
  const valueBucket = bucketByValue(value, med, high);
  if (valueBucket.delta !== 0) {
    risk += valueBucket.delta;
  }
  reasons.push({
    label: valueBucket.label,
    points: valueBucket.delta,
    category: "value",
  });

  // -------------------------- PAYMENT ------------------------------------
  const paymentBucket = bucketByPayment(financialStatusRaw, settings);
  if (paymentBucket.delta !== 0) {
    risk += paymentBucket.delta;
  }
  reasons.push({
    label: paymentBucket.label,
    points: paymentBucket.delta,
    category: "payment",
  });

  // -------------------------- FULFILLMENT --------------------------------
  const fulfillmentBucket = bucketByFulfillment(fulfillmentStatusRaw, settings);
  if (fulfillmentBucket.delta !== 0) {
    risk += fulfillmentBucket.delta;
  }
  reasons.push({
    label: fulfillmentBucket.label,
    points: fulfillmentBucket.delta,
    category: "fulfillment",
  });

  // -------------------------- CUSTOMER -----------------------------------
  const customerBucket = bucketByCustomer(customerOrders, isGuest, settings);
  if (customerBucket.delta !== 0) {
    risk += customerBucket.delta;
  }
  reasons.push({
    label: customerBucket.label,
    points: customerBucket.delta,
    category: "customer",
  });

  // -------------------------- ACCOUNT AGE --------------------------------
  const accountBucket = bucketByAccountAge(accountAgeDays);
  if (accountBucket.delta !== 0) {
    risk += accountBucket.delta;
  }
  reasons.push({
    label: accountBucket.label,
    points: accountBucket.delta,
    category: "account",
  });

  // -------------------------- PLAYBOOKS ----------------------------------
  const appliedPlaybooks: string[] = [];
  let forcedDecision: RiskOrder["savedDecision"] = null;
  for (const playbook of playbooks) {
    if (!playbook.isActive) continue;
    if (
      !playbookMatches(playbook, {
        value,
        email,
        customerOrders,
        accountAgeDays,
      })
    )
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
  const recommendation = getRecommendation(normalizedRisk, settings);
  const narrative = buildNarrative({
    valueBucket,
    paymentBucket,
    fulfillmentBucket,
    customerBucket,
    accountBucket,
    appliedPlaybooks,
    recommendation,
    risk: normalizedRisk,
  });

  return {
    id: order.id,
    orderId: order.id,
    returnId: null,
    returnName: null,
    returnStatus: null,
    returnQuantity: null,
    adminPath: `shopify:admin/orders/${getNumericId(order.id)}`,
    name: order.name,
    createdAt: order.createdAt,
    customer: order.customer?.displayName || "Guest checkout",
    customerOrders,
    email: email || null,
    accountAgeDays,
    value,
    currencyCode: money.currencyCode,
    financialStatus: financialStatusRaw,
    fulfillmentStatus: fulfillmentStatusRaw,
    risk: normalizedRisk,
    recommendation,
    factors: reasons.map((reason) => reason.label),
    riskReasons: reasons,
    appliedPlaybooks,
    savedDecision: forcedDecision,
    narrative,
  };
}

type Bucket = { label: string; delta: number; tone: string };

function bucketByValue(value: number, med: number, high: number): Bucket {
  if (value < med) return { label: "Low order value", delta: 0, tone: "low" };
  if (value < high)
    return { label: "Medium order value", delta: 12, tone: "medium" };
  if (value < high * 2)
    return { label: "High order value", delta: 20, tone: "high" };
  if (value < high * 4)
    return { label: "Very high order value", delta: 28, tone: "very-high" };
  if (value < high * 8)
    return { label: "Premium order value", delta: 34, tone: "premium" };
  return { label: "Extreme order value", delta: 38, tone: "extreme" };
}

function bucketByPayment(raw: string, settings: RiskSettings): Bucket {
  const token = normalizeStatus(raw);
  // Pinned strong-positive case: a clean "paid" should very slightly lower
  // risk because we're not waiting on money.
  if (token === "paid")
    return { label: "Payment cleared", delta: -2, tone: "ok" };
  if (token === "partially_paid")
    return {
      label: "Payment only partially settled",
      delta: 10,
      tone: "warn",
    };
  if (token === "pending" || token === "authorized")
    return {
      label: "Payment still pending",
      delta: settings.paymentReviewRiskDelta,
      tone: "warn",
    };
  if (token === "unpaid")
    return {
      label: "Order unpaid",
      delta: settings.paymentReviewRiskDelta + 4,
      tone: "high",
    };
  if (token === "refunded" || token === "partially_refunded")
    return {
      label: "Already refunded — risk of double-refund",
      delta: 8,
      tone: "warn",
    };
  if (token === "voided")
    return { label: "Payment voided", delta: 12, tone: "high" };
  return { label: "Payment status unclear", delta: 6, tone: "warn" };
}

function bucketByFulfillment(raw: string, settings: RiskSettings): Bucket {
  const token = normalizeStatus(raw);
  if (token === "fulfilled")
    return { label: "Order fulfilled", delta: -2, tone: "ok" };
  if (token === "partially_fulfilled" || token === "partial")
    return {
      label: "Order partially fulfilled",
      delta: 8,
      tone: "warn",
    };
  if (token === "unfulfilled")
    return {
      label: "Order not fulfilled",
      delta: settings.unfulfilledRiskDelta,
      tone: "high",
    };
  if (token === "on_hold" || token === "scheduled")
    return {
      label: "Fulfillment on hold or scheduled",
      delta: 10,
      tone: "warn",
    };
  if (token === "in_progress" || token === "open")
    return { label: "Fulfillment in progress", delta: 6, tone: "warn" };
  return { label: "Fulfillment status unclear", delta: 4, tone: "warn" };
}

function bucketByCustomer(
  customerOrders: number,
  isGuest: boolean,
  settings: RiskSettings,
): Bucket {
  if (isGuest)
    return {
      label: "Guest checkout — no account history",
      delta: settings.newCustomerRiskDelta,
      tone: "high",
    };
  if (customerOrders <= 1)
    return {
      label: "First-time customer",
      delta: settings.newCustomerRiskDelta - 2,
      tone: "warn",
    };
  if (customerOrders < 5)
    return {
      label: "Early-stage customer (2–4 prior orders)",
      delta: 4,
      tone: "warn",
    };
  if (customerOrders < 10)
    return {
      label: "Regular customer (5–9 prior orders)",
      delta: 0,
      tone: "neutral",
    };
  if (customerOrders < 20)
    return {
      label: "Trusted customer (10–19 prior orders)",
      delta: -6,
      tone: "ok",
    };
  return {
    label: "VIP customer (20+ prior orders)",
    delta: -10,
    tone: "ok",
  };
}

function bucketByAccountAge(days: number | null): Bucket {
  if (days === null)
    return {
      label: "Account age unknown",
      delta: 6,
      tone: "warn",
    };
  if (days < 7)
    return {
      label: "Brand-new account (under a week old)",
      delta: 12,
      tone: "high",
    };
  if (days < 30)
    return {
      label: "Young account (under a month)",
      delta: 6,
      tone: "warn",
    };
  if (days < 90)
    return {
      label: "Account 1–3 months old",
      delta: 0,
      tone: "neutral",
    };
  if (days < 365)
    return {
      label: "Account 3–12 months old",
      delta: -3,
      tone: "ok",
    };
  return {
    label: "Account over a year old",
    delta: -8,
    tone: "ok",
  };
}

/**
 * Map Shopify's many financial/fulfillment status surface forms into
 * canonical lowercase snake_case tokens so we can switch on them. Shopify
 * sometimes returns "PARTIALLY PAID", "Partially paid", or
 * "PARTIALLY_PAID" depending on the API surface — they all become
 * `partially_paid`.
 */
function normalizeStatus(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

function buildNarrative(input: {
  valueBucket: Bucket;
  paymentBucket: Bucket;
  fulfillmentBucket: Bucket;
  customerBucket: Bucket;
  accountBucket: Bucket;
  appliedPlaybooks: string[];
  recommendation: string;
  risk: number;
}): string {
  const {
    valueBucket,
    paymentBucket,
    fulfillmentBucket,
    customerBucket,
    accountBucket,
    appliedPlaybooks,
    recommendation,
  } = input;

  const valuePhrase = phraseFromBucket(valueBucket, {
    low: "low-value",
    medium: "mid-value",
    high: "high-value",
    "very-high": "very high-value",
    premium: "premium-tier",
    extreme: "extreme-value",
  });

  const customerPhrase = customerBucket.tone === "ok"
    ? "from a trusted repeat customer"
    : customerBucket.tone === "warn"
      ? "from a customer with limited order history"
      : customerBucket.tone === "high"
        ? "from a new or guest customer"
        : "from a regular customer";

  const paymentPhrase = paymentBucket.tone === "ok"
    ? "payment cleared"
    : paymentBucket.tone === "warn"
      ? "payment not fully settled"
      : "payment unresolved";

  const fulfillmentPhrase = fulfillmentBucket.tone === "ok"
    ? "order already fulfilled"
    : fulfillmentBucket.tone === "warn"
      ? "fulfillment still in motion"
      : "order not fulfilled";

  const accountPhrase = accountBucket.tone === "ok"
    ? "long-standing account"
    : accountBucket.tone === "warn"
      ? "newer account"
      : accountBucket.tone === "high"
        ? "very new account"
        : "neutral account age";

  const lead = `${capitalize(valuePhrase)} order ${customerPhrase}: ${paymentPhrase}, ${fulfillmentPhrase}.`;
  const accountDetail =
    accountBucket.tone === "neutral" ? "" : ` ${capitalize(accountPhrase)}.`;
  const playbookDetail = appliedPlaybooks.length
    ? ` Matched playbook${appliedPlaybooks.length > 1 ? "s" : ""}: ${appliedPlaybooks.join(", ")}.`
    : "";
  const verdict = ` ReturnGuard recommends: ${recommendation.toLowerCase()}.`;

  return `${lead}${accountDetail}${playbookDetail}${verdict}`;
}

function phraseFromBucket(
  bucket: Bucket,
  map: Record<string, string>,
): string {
  return map[bucket.tone] ?? bucket.label.toLowerCase();
}

function capitalize(text: string): string {
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
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
  const flaggedForMargin = orders.filter(
    (order) => order.risk >= settings.reviewRiskThreshold,
  );
  const flaggedGmvTotal = flaggedForMargin.reduce(
    (sum, order) => sum + order.value,
    0,
  );
  const protectedMargin = flaggedForMargin.reduce(
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
  const variance = orders.length
    ? orders.reduce(
        (sum, order) => sum + (order.risk - averageRisk) ** 2,
        0,
      ) / orders.length
    : 0;
  const riskSpread = Math.sqrt(variance);
  const approvedCount = orders.filter(
    (order) => order.savedDecision === "approved",
  ).length;
  const flaggedReturns = reviewCount + holdCount;

  return {
    protectedMargin,
    flaggedGmvTotal,
    reviewCount,
    holdCount,
    autoApprovedCount,
    currencyCode: orders[0]?.currencyCode || "USD",
    analyzedOrders: orders.length,
    // Confidence reflects how clean the signal is, not how low the risk is.
    // Penalize a high standard deviation (lots of mixed-risk orders) and
    // small samples; reward consistent reads.
    confidence: orders.length
      ? clamp(
          40,
          96,
          Math.round(
            88 - riskSpread * 0.9 + Math.min(8, orders.length - 1),
          ),
        )
      : 0,
    detectedOrders: options.detectedOrders ?? orders.length,
    totalReturns: orders.length,
    flaggedReturns,
    approvalRatio: orders.length
      ? Math.round((approvedCount / orders.length) * 100)
      : 0,
    averageRiskScore: Math.round(averageRisk),
    riskSpread: Math.round(riskSpread),
  };
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}
