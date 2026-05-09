import prisma from "../db.server";
import type { DashboardData, RiskSettings } from "./return-risk";
import { getRiskSettings } from "./return-risk.server";
import { buildRiskOrders, summarizeOrders } from "./risk-engine.server";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MIN = 5;
const PAGE_SIZE_MAX = 100;
const SEARCH_QUERY_MAX_LENGTH = 200;
const RECENT_ACTIONS_LIMIT = 12;

const ORDERS_PAGE_QUERY = `#graphql
  query ReturnGuardOrdersPage(
    $first: Int
    $last: Int
    $after: String
    $before: String
    $query: String
  ) {
    orders(
      first: $first
      last: $last
      after: $after
      before: $before
      query: $query
      sortKey: CREATED_AT
      reverse: true
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
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

const ORDERS_PAGE_FALLBACK_QUERY = `#graphql
  query ReturnGuardOrdersPageFallback(
    $first: Int
    $last: Int
    $after: String
    $before: String
    $query: String
  ) {
    orders(
      first: $first
      last: $last
      after: $after
      before: $before
      query: $query
      sortKey: CREATED_AT
      reverse: true
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
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

type Money = { amount: string; currencyCode: string };

type ShopifyOrderNode = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  currentTotalPriceSet: { shopMoney: Money };
  customer: {
    displayName: string;
    numberOfOrders: string;
    createdAt?: string | null;
  } | null;
};

type ShopifyAdmin = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

type OrdersPageResponse = {
  data?: {
    orders?: {
      pageInfo?: {
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
        startCursor?: string | null;
        endCursor?: string | null;
      };
      nodes?: ShopifyOrderNode[];
    };
  };
  errors?: Array<{
    message: string;
    extensions?: { code?: string };
  }>;
};

export type ReturnsQueueParams = {
  cursor?: string | null;
  direction?: "next" | "prev" | null;
  query?: string | null;
  pageSize?: number | null;
};

export type ReturnsQueuePage = {
  orders: DashboardData["orders"];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  settings: RiskSettings;
  summary: DashboardData["summary"];
  recentActions: DashboardData["recentActions"];
  error: string | null;
  needsProtectedDataAccess: boolean;
  searchQuery: string;
  pageSize: number;
};

export async function loadReturnsQueuePage(
  admin: ShopifyAdmin,
  shop: string,
  params: ReturnsQueueParams,
): Promise<ReturnsQueuePage> {
  const settings = await getRiskSettings(shop);
  const pageSize = clampPageSize(params.pageSize);
  const searchQuery = sanitizeSearchQuery(params.query);
  const queryString = buildShopifyQuery(searchQuery);
  const variables = buildVariables(params, pageSize, queryString);

  try {
    const payload = await loadOrdersPageWithFallback(admin, variables);

    if (payload.errors?.length) {
      const firstError = payload.errors[0];
      const isProtectedDataDenied =
        firstError?.extensions?.code === "ACCESS_DENIED";

      return buildEmptyPage(settings, {
        error:
          firstError?.message || "Unable to load Shopify orders for this page.",
        needsProtectedDataAccess: isProtectedDataDenied,
        searchQuery,
        pageSize,
      });
    }

    const rawOrders = payload.data?.orders?.nodes || [];
    const pageInfoRaw = payload.data?.orders?.pageInfo;
    const orderIds = rawOrders.map((order) => order.id);

    const [decisions, playbooks, recentActions] = await Promise.all([
      orderIds.length
        ? prisma.returnDecision.findMany({
            where: { shop, orderId: { in: orderIds } },
            // Only the fields used by the risk engine — keeps row size small
            // and avoids leaking timestamps into client bundles.
            select: { orderId: true, decision: true },
          })
        : Promise.resolve([]),
      prisma.playbook.findMany({
        where: { shop, isActive: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.returnDecisionEvent.findMany({
        where: { shop },
        orderBy: { createdAt: "desc" },
        take: RECENT_ACTIONS_LIMIT,
        select: {
          id: true,
          orderId: true,
          orderName: true,
          decision: true,
          previousDecision: true,
          risk: true,
          createdAt: true,
        },
      }),
    ]);

    const orders = buildRiskOrders(rawOrders, settings, playbooks, decisions);
    const summary = summarizeOrders(orders, settings);

    return {
      orders,
      pageInfo: {
        hasNextPage: Boolean(pageInfoRaw?.hasNextPage),
        hasPreviousPage: Boolean(pageInfoRaw?.hasPreviousPage),
        startCursor: pageInfoRaw?.startCursor || null,
        endCursor: pageInfoRaw?.endCursor || null,
      },
      settings,
      summary,
      recentActions: recentActions.map((event) => ({
        id: event.id,
        orderName: event.orderName || event.orderId,
        decision: event.decision,
        risk: event.risk,
        createdAt: event.createdAt.toISOString(),
        previousDecision: event.previousDecision || null,
      })),
      error: null,
      needsProtectedDataAccess: false,
      searchQuery,
      pageSize,
    };
  } catch (error) {
    return buildEmptyPage(settings, {
      error:
        error instanceof Error
          ? error.message
          : "Unable to load Shopify orders.",
      needsProtectedDataAccess: false,
      searchQuery,
      pageSize,
    });
  }
}

function clampPageSize(size: number | null | undefined): number {
  if (!size || !Number.isFinite(size)) return PAGE_SIZE_DEFAULT;
  return Math.max(PAGE_SIZE_MIN, Math.min(PAGE_SIZE_MAX, Math.round(size)));
}

function sanitizeSearchQuery(value: string | null | undefined): string {
  if (!value) return "";
  // Strip control chars that would corrupt Shopify search.
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, "")
    .trim();
  return cleaned.slice(0, SEARCH_QUERY_MAX_LENGTH);
}

function buildShopifyQuery(searchQuery: string): string {
  const baseFilter = "status:any";
  if (!searchQuery) return baseFilter;
  return `${baseFilter} ${searchQuery}`;
}

function buildVariables(
  params: ReturnsQueueParams,
  pageSize: number,
  queryString: string,
): Record<string, unknown> {
  if (params.direction === "prev" && params.cursor) {
    return { last: pageSize, before: params.cursor, query: queryString };
  }
  if (params.direction === "next" && params.cursor) {
    return { first: pageSize, after: params.cursor, query: queryString };
  }
  return { first: pageSize, query: queryString };
}

async function loadOrdersPageWithFallback(
  admin: ShopifyAdmin,
  variables: Record<string, unknown>,
): Promise<OrdersPageResponse> {
  const primaryResponse = await admin.graphql(ORDERS_PAGE_QUERY, { variables });
  const primary = (await primaryResponse.json()) as OrdersPageResponse;

  if (!primary.errors?.length) {
    return primary;
  }

  console.log("[ReturnGuard] queue primary errors", primary.errors);

  const fallbackResponse = await admin.graphql(ORDERS_PAGE_FALLBACK_QUERY, {
    variables,
  });
  const fallback = (await fallbackResponse.json()) as OrdersPageResponse;

  if (!fallback.errors?.length) {
    return fallback;
  }

  return primary;
}

function buildEmptyPage(
  settings: RiskSettings,
  options: {
    error: string;
    needsProtectedDataAccess: boolean;
    searchQuery: string;
    pageSize: number;
  },
): ReturnsQueuePage {
  return {
    orders: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    settings,
    summary: summarizeOrders([], settings),
    recentActions: [],
    error: options.error,
    needsProtectedDataAccess: options.needsProtectedDataAccess,
    searchQuery: options.searchQuery,
    pageSize: options.pageSize,
  };
}
