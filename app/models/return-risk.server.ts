import prisma from "../db.server";
import type { DashboardData, RiskOrder, RiskSettings } from "./return-risk";
import { buildRiskOrders, summarizeOrders } from "./risk-engine.server";
import {
  ValidationError,
  readEnum,
  readString,
  readStringArray,
} from "../lib/validation.server";
import { actionSuccess, type ActionResult } from "../lib/action-result";

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
    email?: string | null;
    numberOfOrders: string;
    createdAt?: string | null;
  } | null;
};

type ShopifyAdmin = {
  graphql: (query: string) => Promise<Response>;
};

const ORDERS_QUERY = `#graphql
  query ReturnGuardRecentOrders {
    orders(first: 50, query: "status:any", sortKey: CREATED_AT, reverse: true) {
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
          createdAt
        }
      }
    }
  }
`;

const ORDERS_FALLBACK_QUERY = `#graphql
  query ReturnGuardRecentOrdersFallback {
    orders(first: 50, query: "status:any", sortKey: CREATED_AT, reverse: true) {
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

const DECISION_VALUES = ["approved", "review", "hold"] as const;
type DecisionValue = (typeof DECISION_VALUES)[number];

export async function saveReturnDecision(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ decision: DecisionValue }>> {
  const orderId = readString(formData, "orderId", { required: true, max: 256 });
  const orderName = readString(formData, "orderName", { max: 120 });
  const decision = readEnum<DecisionValue>(formData, "decision", DECISION_VALUES, {
    required: true,
  });
  if (!decision) {
    throw new ValidationError("Invalid decision.", { decision: "Required" });
  }
  const risk = normalizeRisk(formData.get("risk"));

  const existingDecision = await prisma.returnDecision.findUnique({
    where: { shop_orderId: { shop, orderId } },
  });

  await prisma.returnDecision.upsert({
    where: { shop_orderId: { shop, orderId } },
    update: { decision, orderName, risk },
    create: { shop, orderId, orderName, decision, risk },
  });

  await prisma.returnDecisionEvent.create({
    data: {
      shop,
      orderId,
      orderName,
      decision,
      previousDecision: existingDecision?.decision || null,
      risk,
    },
  });

  return actionSuccess({ decision }, { toast: "Decision saved" });
}

export async function deleteDecisionEvent(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ removed: number }>> {
  const eventId = readString(formData, "eventId", { required: true, max: 128 });

  const result = await prisma.returnDecisionEvent.deleteMany({
    where: { id: eventId, shop },
  });

  if (result.count === 0) {
    throw new ValidationError("History entry not found.");
  }

  return actionSuccess(
    { removed: result.count },
    { toast: "History entry removed" },
  );
}

export async function saveBulkReturnDecisions(
  shop: string,
  formData: FormData,
): Promise<ActionResult<{ count: number }>> {
  const decision = readEnum<DecisionValue>(formData, "decision", DECISION_VALUES, {
    required: true,
  });
  if (!decision) {
    throw new ValidationError("Invalid bulk decision.", {
      decision: "Required",
    });
  }
  const orderIds = readStringArray(formData, "orderIds", {
    max: 100,
    itemMax: 128,
  });
  if (!orderIds.length) {
    throw new ValidationError("No orders selected.");
  }

  const existing = await prisma.returnDecision.findMany({
    where: { shop, orderId: { in: orderIds } },
  });
  const existingMap = new Map(existing.map((item) => [item.orderId, item]));

  await prisma.$transaction([
    ...orderIds.map((orderId) =>
      prisma.returnDecision.upsert({
        where: { shop_orderId: { shop, orderId } },
        update: { decision },
        create: { shop, orderId, decision },
      }),
    ),
    ...orderIds.map((orderId) =>
      prisma.returnDecisionEvent.create({
        data: {
          shop,
          orderId,
          orderName: existingMap.get(orderId)?.orderName || orderId,
          decision,
          previousDecision: existingMap.get(orderId)?.decision || null,
        },
      }),
    ),
  ]);

  return actionSuccess(
    { count: orderIds.length },
    { toast: `Updated ${orderIds.length} orders` },
  );
}

export async function loadReturnRiskData(
  admin: ShopifyAdmin,
  shop: string,
): Promise<DashboardData> {
  const settings = await getRiskSettings(shop);

  try {
    const payload = await loadOrdersWithFallback(admin);

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

      return buildDashboardData(
        [],
        settings,
        firstError?.message || "Unable to load Shopify orders",
      );
    }

    const rawOrders = payload.data?.orders?.nodes || [];
    const [decisions, playbooks, recentActions] = await Promise.all([
      prisma.returnDecision.findMany({
        where: {
          shop,
          orderId: {
            in: rawOrders.map((order) => order.id),
          },
        },
      }),
      prisma.playbook.findMany({
        where: { shop, isActive: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.returnDecisionEvent.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

    const orders = buildRiskOrders(rawOrders, settings, playbooks, decisions);
    const detectedOrders = orders.length ? orders.length : await loadOrderCount(admin);

    return buildDashboardData(orders, settings, null, {
      detectedOrders,
      recentActions: recentActions.map((action) => ({
        id: action.id,
        orderName: action.orderName || action.orderId,
        decision: action.decision,
        risk: action.risk,
        createdAt: action.createdAt.toISOString(),
        previousDecision: action.previousDecision || null,
      })),
    });
  } catch (error) {
    return buildDashboardData(
      [],
      settings,
      error instanceof Error ? error.message : "Unable to load Shopify orders",
    );
  }
}

async function loadOrdersWithFallback(admin: ShopifyAdmin) {
  const response = await admin.graphql(ORDERS_QUERY);
  const payload = (await response.json()) as {
    data?: { orders?: { nodes?: ShopifyOrderNode[] } };
    errors?: Array<{
      message: string;
      extensions?: { code?: string };
    }>;
  };

  if (!payload.errors?.length) {
    console.log(
      "[ReturnGuard] orders primary ok",
      payload.data?.orders?.nodes?.length || 0,
    );
    return payload;
  }

  console.log("[ReturnGuard] orders primary errors", payload.errors);

  // If protected customer fields are blocked, retry with a minimal orders query.
  const fallbackResponse = await admin.graphql(ORDERS_FALLBACK_QUERY);
  const fallbackPayload = (await fallbackResponse.json()) as {
    data?: { orders?: { nodes?: ShopifyOrderNode[] } };
    errors?: Array<{
      message: string;
      extensions?: { code?: string };
    }>;
  };

  if (!fallbackPayload.errors?.length) {
    console.log(
      "[ReturnGuard] orders fallback ok",
      fallbackPayload.data?.orders?.nodes?.length || 0,
    );
    return {
      data: fallbackPayload.data,
      errors: undefined,
    };
  }

  console.log(
    "[ReturnGuard] orders fallback result",
    fallbackPayload.errors,
    fallbackPayload.data?.orders?.nodes?.length || 0,
  );

  return payload;
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
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.round(value));
}

function readNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, value);
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
    recentActions?: DashboardData["recentActions"];
  } = {},
): DashboardData {
  return {
    orders,
    settings,
    summary: summarizeOrders(orders, settings, {
      detectedOrders: options.detectedOrders,
    }),
    recentActions: options.recentActions || [],
    error,
    needsProtectedDataAccess: options.needsProtectedDataAccess || false,
  };
}

function normalizeRisk(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}
