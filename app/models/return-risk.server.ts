import prisma from "../db.server";
import type { DashboardData, RiskOrder, RiskSettings } from "./return-risk";

type Money = {
  amount: string;
  currencyCode: string;
};

type ShopifyOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  currentTotalPriceSet: {
    shopMoney: Money;
  };
  customer: {
    displayName: string;
    numberOfOrders: string;
  } | null;
};

type ShopifyAdmin = {
  graphql: (query: string) => Promise<Response>;
};

const ORDERS_QUERY = `#graphql
  query ReturnGuardRecentOrders {
    orders(first: 25, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        name
        createdAt
        displayFinancialStatus
        displayFulfillmentStatus
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        customer {
          displayName
          numberOfOrders
        }
      }
    }
  }
`;

const ORDER_COUNT_QUERY = `#graphql
  query ReturnGuardOrderCount {
    ordersCount {
      count
    }
  }
`;

const defaultSettings: RiskSettings = {
  mediumValueThreshold: 100,
  highValueThreshold: 250,
  reviewRiskThreshold: 60,
  holdRiskThreshold: 80,
  newCustomerRiskDelta: 16,
  repeatCustomerRiskDelta: 12,
  unfulfilledRiskDelta: 12,
  paymentReviewRiskDelta: 14,
  protectedMarginMultiplier: 0.25,
};

export async function getRiskSettings(shop: string): Promise<RiskSettings> {
  const settings = await prisma.returnRiskSetting.upsert({
    where: { shop },
    update: {},
    create: { shop },
  });

  return {
    mediumValueThreshold: settings.mediumValueThreshold,
    highValueThreshold: settings.highValueThreshold,
    reviewRiskThreshold: settings.reviewRiskThreshold,
    holdRiskThreshold: settings.holdRiskThreshold,
    newCustomerRiskDelta: settings.newCustomerRiskDelta,
    repeatCustomerRiskDelta: settings.repeatCustomerRiskDelta,
    unfulfilledRiskDelta: settings.unfulfilledRiskDelta,
    paymentReviewRiskDelta: settings.paymentReviewRiskDelta,
    protectedMarginMultiplier: Number(settings.protectedMarginMultiplier),
  };
}

export async function updateRiskSettings(shop: string, formData: FormData) {
  const settings = parseSettings(formData);

  await prisma.returnRiskSetting.upsert({
    where: { shop },
    update: settings,
    create: {
      shop,
      ...settings,
    },
  });

  return settings;
}

export async function saveReturnDecision(shop: string, formData: FormData) {
  const orderId = String(formData.get("orderId") || "");
  const orderName = String(formData.get("orderName") || "");
  const decision = String(formData.get("decision") || "");
  const risk = Number(formData.get("risk") || 0);
  const allowedDecisions = ["approved", "review", "hold"];

  if (!orderId || !allowedDecisions.includes(decision)) {
    return { ok: false, error: "Invalid return decision" };
  }

  await prisma.returnDecision.upsert({
    where: {
      shop_orderId: {
        shop,
        orderId,
      },
    },
    update: {
      decision,
      orderName,
      risk,
    },
    create: {
      shop,
      orderId,
      orderName,
      decision,
      risk,
    },
  });

  return { ok: true, decision };
}

export async function loadReturnRiskData(
  admin: ShopifyAdmin,
  shop: string,
): Promise<DashboardData> {
  const settings = await getRiskSettings(shop);

  try {
    const response = await admin.graphql(ORDERS_QUERY);
    const payload = (await response.json()) as {
      data?: { orders?: { nodes?: ShopifyOrderNode[] } };
      errors?: Array<{
        message: string;
        extensions?: {
          code?: string;
        };
      }>;
    };

    if (payload.errors?.length) {
      const firstError = payload.errors[0];

      if (firstError?.extensions?.code === "ACCESS_DENIED") {
        const detectedOrders = await loadOrderCount(admin);

        return buildDashboardData(
          [],
          settings,
          "Shopify can see your test order, but order details are locked until Protected Customer Data access is enabled for this app.",
          {
            detectedOrders,
            needsProtectedDataAccess: true,
          },
        );
      }

      return buildDashboardData([], settings, firstError?.message);
    }

    const orders = (payload.data?.orders?.nodes || []).map((order) =>
      mapOrderToRisk(order, settings),
    );
    const decisions = await prisma.returnDecision.findMany({
      where: {
        shop,
        orderId: {
          in: orders.map((order) => order.id),
        },
      },
    });
    const decisionByOrderId = new Map(
      decisions.map((decision) => [decision.orderId, decision.decision]),
    );
    const ordersWithDecisions = orders.map((order) => ({
      ...order,
      savedDecision: decisionByOrderId.get(order.id) || null,
    }));

    return buildDashboardData(ordersWithDecisions, settings, null);
  } catch (error) {
    return buildDashboardData(
      [],
      settings,
      error instanceof Error ? error.message : "Unable to load Shopify orders",
    );
  }
}

function parseSettings(formData: FormData): RiskSettings {
  return {
    mediumValueThreshold: readInt(
      formData,
      "mediumValueThreshold",
      defaultSettings.mediumValueThreshold,
    ),
    highValueThreshold: readInt(
      formData,
      "highValueThreshold",
      defaultSettings.highValueThreshold,
    ),
    reviewRiskThreshold: readInt(
      formData,
      "reviewRiskThreshold",
      defaultSettings.reviewRiskThreshold,
    ),
    holdRiskThreshold: readInt(
      formData,
      "holdRiskThreshold",
      defaultSettings.holdRiskThreshold,
    ),
    newCustomerRiskDelta: readInt(
      formData,
      "newCustomerRiskDelta",
      defaultSettings.newCustomerRiskDelta,
    ),
    repeatCustomerRiskDelta: readInt(
      formData,
      "repeatCustomerRiskDelta",
      defaultSettings.repeatCustomerRiskDelta,
    ),
    unfulfilledRiskDelta: readInt(
      formData,
      "unfulfilledRiskDelta",
      defaultSettings.unfulfilledRiskDelta,
    ),
    paymentReviewRiskDelta: readInt(
      formData,
      "paymentReviewRiskDelta",
      defaultSettings.paymentReviewRiskDelta,
    ),
    protectedMarginMultiplier: readNumber(
      formData,
      "protectedMarginMultiplier",
      defaultSettings.protectedMarginMultiplier,
    ),
  };
}

function readInt(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));

  return Number.isFinite(value) ? Math.round(value) : fallback;
}

function readNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));

  return Number.isFinite(value) ? value : fallback;
}

async function loadOrderCount(admin: ShopifyAdmin) {
  try {
    const response = await admin.graphql(ORDER_COUNT_QUERY);
    const payload = (await response.json()) as {
      data?: { ordersCount?: { count?: number } };
    };

    return payload.data?.ordersCount?.count || 0;
  } catch {
    return 0;
  }
}

function buildDashboardData(
  orders: RiskOrder[],
  settings: RiskSettings,
  error: string | null,
  options: {
    detectedOrders?: number;
    needsProtectedDataAccess?: boolean;
  } = {},
): DashboardData {
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

  return {
    orders,
    settings,
    summary: {
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
    },
    error,
    needsProtectedDataAccess: options.needsProtectedDataAccess || false,
  };
}

function mapOrderToRisk(
  order: ShopifyOrderNode,
  settings: RiskSettings,
): RiskOrder {
  const money = order.currentTotalPriceSet.shopMoney;
  const value = Number(money.amount);
  const customerOrders = Number(order.customer?.numberOfOrders || 0);
  const financialStatus = order.displayFinancialStatus || "Unknown payment";
  const fulfillmentStatus = order.displayFulfillmentStatus || "Unfulfilled";
  const factors: string[] = [];
  let risk = 18;

  if (value >= settings.highValueThreshold) {
    risk += 34;
    factors.push("high value");
  } else if (value >= settings.mediumValueThreshold) {
    risk += 18;
    factors.push("medium value");
  } else {
    factors.push("low value");
  }

  if (!financialStatus.toLowerCase().includes("paid")) {
    risk += settings.paymentReviewRiskDelta;
    factors.push("payment review");
  }

  if (!fulfillmentStatus.toLowerCase().includes("fulfilled")) {
    risk += settings.unfulfilledRiskDelta;
    factors.push("not fulfilled");
  }

  if (customerOrders >= 5) {
    risk += settings.repeatCustomerRiskDelta;
    factors.push("repeat customer");
  } else if (customerOrders <= 1) {
    risk += settings.newCustomerRiskDelta;
    factors.push("new customer");
  }

  const normalizedRisk = Math.min(96, Math.max(8, risk));

  return {
    id: order.id,
    adminPath: `shopify:admin/orders/${getNumericId(order.id)}`,
    name: order.name,
    createdAt: order.createdAt,
    customer: order.customer?.displayName || "Guest checkout",
    customerOrders,
    value,
    currencyCode: money.currencyCode,
    financialStatus,
    fulfillmentStatus,
    risk: normalizedRisk,
    recommendation: getRecommendation(normalizedRisk, settings),
    factors,
    savedDecision: null,
  };
}

function getRecommendation(risk: number, settings: RiskSettings) {
  if (risk >= settings.holdRiskThreshold) return "Hold refund";
  if (risk >= settings.reviewRiskThreshold) return "Manual review";
  return "Approve automatically";
}

function getNumericId(gid: string) {
  return gid.split("/").pop() || gid;
}
