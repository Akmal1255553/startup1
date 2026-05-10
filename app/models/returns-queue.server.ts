import prisma from "../db.server";
import type { DashboardData, RiskSettings } from "./return-risk";
import { getRiskSettings } from "./return-risk.server";
import {
  buildRiskOrders,
  mergeSavedDecisionsOntoRiskOrders,
  summarizeOrders,
} from "./risk-engine.server";

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MIN = 5;
const PAGE_SIZE_MAX = 100;
const SEARCH_QUERY_MAX_LENGTH = 200;
const RECENT_ACTIONS_LIMIT = 12;
const RETURNS_PER_ORDER = 25;

/** Orders that have at least one return in these aggregate states. */
const RETURN_STATUS_FILTER =
  "return_status:IN_PROGRESS OR return_status:RETURN_REQUESTED OR return_status:RETURN_FAILED OR return_status:RETURNED OR return_status:INSPECTION_COMPLETE";

const RETURNS_QUEUE_PAGE_QUERY = `#graphql
  query ReturnGuardReturnsQueuePage(
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
        returns(first: ${RETURNS_PER_ORDER}, reverse: true) {
          nodes {
            id
            name
            status
            createdAt
            totalQuantity
          }
        }
      }
    }
  }
`;

const RETURNS_QUEUE_PAGE_FALLBACK_QUERY = `#graphql
  query ReturnGuardReturnsQueuePageFallback(
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
        returns(first: ${RETURNS_PER_ORDER}, reverse: true) {
          nodes {
            id
            name
            status
            createdAt
            totalQuantity
          }
        }
      }
    }
  }
`;

type Money = { amount: string; currencyCode: string };

type ReturnNode = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  totalQuantity: number;
};

type ShopifyOrderWithReturns = {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  currentTotalPriceSet: { shopMoney: Money };
  customer?: {
    displayName: string;
    numberOfOrders: string;
    createdAt?: string | null;
  } | null;
  returns?: { nodes?: ReturnNode[] };
};

type ShopifyAdmin = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

type ReturnsPageResponse = {
  data?: {
    orders?: {
      pageInfo?: {
        hasNextPage?: boolean;
        hasPreviousPage?: boolean;
        startCursor?: string | null;
        endCursor?: string | null;
      };
      nodes?: ShopifyOrderWithReturns[];
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
  /** Distinct Shopify orders on this response page (before flattening into returns). */
  sourceOrderCount: number;
};

export async function loadReturnsQueuePage(
  admin: ShopifyAdmin,
  shop: string,
  params: ReturnsQueueParams,
): Promise<ReturnsQueuePage> {
  const settings = await getRiskSettings(shop);
  const pageSize = clampPageSize(params.pageSize);
  const searchQuery = sanitizeSearchQuery(params.query);
  const queryString = buildReturnsQueueShopifyQuery(searchQuery);
  const variables = buildVariables(params, pageSize, queryString);

  try {
    const payload = await loadReturnsQueuePageWithFallback(admin, variables);

    if (payload.errors?.length) {
      const firstError = payload.errors[0];
      const isProtectedDataDenied =
        firstError?.extensions?.code === "ACCESS_DENIED";

      return buildEmptyPage(settings, {
        error:
          firstError?.message ||
          "Unable to load Shopify returns for this page. Ensure the app has the read_returns scope and was reinstalled after scope changes.",
        needsProtectedDataAccess: isProtectedDataDenied,
        searchQuery,
        pageSize,
      });
    }

    const rawOrders = payload.data?.orders?.nodes || [];
    const pageInfoRaw = payload.data?.orders?.pageInfo;

    const flattened = flattenReturnsFromOrders(rawOrders);
    if (!flattened.length && rawOrders.length) {
      return buildEmptyPage(settings, {
        error:
          `${rawOrders.length} order(s) matched the return filter, but no Return records were returned. Grant the read_returns scope, reinstall / update the app scopes, then try again.`,
        needsProtectedDataAccess: false,
        searchQuery,
        pageSize,
      });
    }

    const returnIds = flattened.map((row) => row.ret.id);
    const orderIds = [...new Set(flattened.map((row) => row.order.id))];

    const decisionOr = [
      ...(returnIds.length ? [{ returnId: { in: returnIds } }] : []),
      ...(orderIds.length
        ? [{ orderId: { in: orderIds }, returnId: null }]
        : []),
    ];

    const [decisions, playbooks, recentActions] = await Promise.all([
      decisionOr.length
        ? prisma.returnDecision.findMany({
            where: { shop, OR: decisionOr },
            select: { orderId: true, returnId: true, decision: true },
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
          returnId: true,
          orderName: true,
          decision: true,
          previousDecision: true,
          risk: true,
          createdAt: true,
        },
      }),
    ]);

    const rows: DashboardData["orders"] = [];

    for (const { order, ret } of flattened) {
      const { returns: _returns, customer, ...rest } = order;
      const orderForScore = {
        ...rest,
        customer: customer ?? null,
      };
      const [scored] = buildRiskOrders(
        [orderForScore],
        settings,
        playbooks,
        [],
      );
      const factors = [
        ...scored.factors,
        `Shopify return ${ret.name} (${ret.status}) · ${ret.totalQuantity} unit(s)`,
      ];
      rows.push({
        ...scored,
        id: ret.id,
        orderId: order.id,
        returnId: ret.id,
        returnName: ret.name,
        returnStatus: ret.status,
        returnQuantity: ret.totalQuantity,
        createdAt: ret.createdAt,
        factors,
        savedDecision: scored.savedDecision,
      });
    }

    const orders = mergeSavedDecisionsOntoRiskOrders(rows, decisions);
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
        orderName: formatHistoryLabel(event),
        decision: event.decision,
        risk: event.risk,
        createdAt: event.createdAt.toISOString(),
        previousDecision: event.previousDecision || null,
      })),
      error: null,
      needsProtectedDataAccess: false,
      searchQuery,
      pageSize,
      sourceOrderCount: rawOrders.length,
    };
  } catch (error) {
    return buildEmptyPage(settings, {
      error:
        error instanceof Error
          ? error.message
          : "Unable to load Shopify returns.",
      needsProtectedDataAccess: false,
      searchQuery,
      pageSize,
    });
  }
}

function formatHistoryLabel(event: {
  orderName: string | null;
  orderId: string;
  returnId: string | null;
}) {
  if (event.returnId && event.orderName) {
    return `${event.orderName}`;
  }
  return event.orderName || event.orderId;
}

function flattenReturnsFromOrders(
  nodes: ShopifyOrderWithReturns[],
): Array<{ order: ShopifyOrderWithReturns; ret: ReturnNode }> {
  const out: Array<{ order: ShopifyOrderWithReturns; ret: ReturnNode }> = [];
  for (const order of nodes) {
    const list = order.returns?.nodes || [];
    for (const ret of list) {
      out.push({ order, ret });
    }
  }
  return out;
}

function clampPageSize(size: number | null | undefined): number {
  if (!size || !Number.isFinite(size)) return PAGE_SIZE_DEFAULT;
  return Math.max(PAGE_SIZE_MIN, Math.min(PAGE_SIZE_MAX, Math.round(size)));
}

function sanitizeSearchQuery(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, "")
    .trim();
  return cleaned.slice(0, SEARCH_QUERY_MAX_LENGTH);
}

function buildReturnsQueueShopifyQuery(searchQuery: string): string {
  const base = `status:any (${RETURN_STATUS_FILTER})`;
  if (!searchQuery) return base;
  return `${base} ${searchQuery}`;
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

async function loadReturnsQueuePageWithFallback(
  admin: ShopifyAdmin,
  variables: Record<string, unknown>,
): Promise<ReturnsPageResponse> {
  const primaryResponse = await admin.graphql(RETURNS_QUEUE_PAGE_QUERY, {
    variables,
  });
  const primary = (await primaryResponse.json()) as ReturnsPageResponse;

  if (!primary.errors?.length) {
    return primary;
  }

  console.log("[ReturnGuard] returns queue primary errors", primary.errors);

  const fallbackResponse = await admin.graphql(RETURNS_QUEUE_PAGE_FALLBACK_QUERY, {
    variables,
  });
  const fallback = (await fallbackResponse.json()) as ReturnsPageResponse;

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
    sourceOrderCount: 0,
  };
}
