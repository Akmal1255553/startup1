import prisma from "../db.server";
import { getProductIntelligenceCopy } from "../i18n/messages/app/product-intelligence";
import type { Locale } from "../i18n/types";
import { buildProductInsights } from "./product-insights";
import { buildReasonAnalysis } from "./product-reason-analysis";
import { buildProductRecommendations } from "./product-recommendations.server";
import type {
  ProductIntelligencePage,
  ProductIntelligenceQuery,
  ProductIntelligenceSummary,
  ProductReturnRow,
  ProductSortField,
  ProductTrendPoint,
  ReasonBreakdown,
} from "./product-intelligence.types";
import {
  categorizeReturnReason,
  emptyReasonBreakdown,
} from "./product-return-reasons";
import {
  finalizeProductRow,
} from "./product-risk-score.server";

const DAY_MS = 24 * 60 * 60 * 1000;
const ANALYSIS_DAYS = 90;
const ORDERS_PAGE_SIZE = 50;
const MAX_ORDER_PAGES = 2;
const MAX_RETURN_ORDER_PAGES = 3;
const METRICS_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 25;

type ShopifyAdmin = {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>;
};

type Money = { amount: string; currencyCode: string };

type GraphqlReturnLineItem = {
  quantity: number;
  returnReason?: string | null;
  returnReasonNote?: string | null;
  returnReasonDefinition?: { handle?: string | null; name?: string | null } | null;
  fulfillmentLineItem?: {
    lineItem?: {
      id: string;
      sku?: string | null;
      title?: string | null;
      product?: { id: string; title: string } | null;
      variant?: { sku?: string | null } | null;
      originalUnitPriceSet?: { shopMoney: Money } | null;
    } | null;
  } | null;
};

type GraphqlReturnNode = {
  id: string;
  createdAt: string;
  totalQuantity?: number;
  returnLineItems?: {
    nodes: GraphqlReturnLineItem[];
  };
};

type GraphqlOrderNode = {
  id: string;
  createdAt: string;
  lineItems: {
    nodes: Array<{
      id: string;
      quantity: number;
      sku?: string | null;
      product?: { id: string; title: string } | null;
    }>;
  };
  returns?: {
    nodes: GraphqlReturnNode[];
  };
};

const RETURN_LINE_ITEM_PRIMARY = `
  ... on ReturnLineItem {
    quantity
    returnReason
    returnReasonNote
    returnReasonDefinition {
      handle
      name
    }
    fulfillmentLineItem {
      lineItem {
        id
        sku
        title
        product {
          id
          title
        }
        variant {
          sku
        }
        originalUnitPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const RETURN_LINE_ITEM_FALLBACK = `
  ... on ReturnLineItem {
    quantity
    returnReasonDefinition {
      handle
      name
    }
    fulfillmentLineItem {
      lineItem {
        id
        sku
        title
        product {
          id
          title
        }
        variant {
          sku
        }
      }
    }
  }
`;

const RETURN_LINE_ITEM_MINIMAL = `
  ... on ReturnLineItem {
    quantity
    fulfillmentLineItem {
      lineItem {
        id
        sku
        title
        product {
          id
          title
        }
        variant {
          sku
        }
      }
    }
  }
`;

const ORDERS_FOR_COUNTS_QUERY = `#graphql
  query ReturnGuardProductIntelligenceOrderCounts(
    $first: Int!
    $after: String
    $query: String
  ) {
    orders(
      first: $first
      after: $after
      query: $query
      sortKey: CREATED_AT
      reverse: true
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        lineItems(first: 50) {
          nodes {
            id
            quantity
            sku
            product {
              id
              title
            }
          }
        }
      }
    }
  }
`;

/** Phase 1: same shape as Returns Queue — orders with return headers only. */
const ORDERS_WITH_RETURNS_QUERY = `#graphql
  query ReturnGuardProductIntelligenceOrders(
    $first: Int!
    $after: String
    $query: String
  ) {
    orders(
      first: $first
      after: $after
      query: $query
      sortKey: CREATED_AT
      reverse: true
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        createdAt
        lineItems(first: 50) {
          nodes {
            id
            quantity
            sku
            product {
              id
              title
            }
          }
        }
        returns(first: 25, reverse: true) {
          nodes {
            id
            createdAt
            totalQuantity
          }
        }
      }
    }
  }
`;

/** Phase 2: fetch return line items in a separate batch query. */
const RETURN_LINE_ITEMS_BATCH_QUERY = `#graphql
  query ReturnGuardReturnLineItemsBatch($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Return {
        id
        returnLineItems(first: 25) {
          nodes {
            ${RETURN_LINE_ITEM_PRIMARY}
          }
        }
      }
    }
  }
`;

const RETURN_LINE_ITEMS_BATCH_FALLBACK_QUERY = `#graphql
  query ReturnGuardReturnLineItemsBatchFallback($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Return {
        id
        returnLineItems(first: 25) {
          nodes {
            ${RETURN_LINE_ITEM_FALLBACK}
          }
        }
      }
    }
  }
`;

const RETURN_LINE_ITEMS_BATCH_MINIMAL_QUERY = `#graphql
  query ReturnGuardReturnLineItemsBatchMinimal($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Return {
        id
        returnLineItems(first: 25) {
          nodes {
            ${RETURN_LINE_ITEM_MINIMAL}
          }
        }
      }
    }
  }
`;

const RETURN_LINE_ITEMS_BATCH_QUERIES = [
  { name: "primary", query: RETURN_LINE_ITEMS_BATCH_QUERY },
  { name: "fallback", query: RETURN_LINE_ITEMS_BATCH_FALLBACK_QUERY },
  { name: "minimal", query: RETURN_LINE_ITEMS_BATCH_MINIMAL_QUERY },
] as const;

const RETURN_LINE_ITEMS_BATCH_SIZE = 50;

export function emptyProductIntelligencePage(
  query: ProductIntelligenceQuery = {},
): ProductIntelligencePage {
  return {
    summary: emptySummary(),
    products: [],
    allProducts: [],
    recommendations: [],
    insights: [],
    page: query.page ?? 1,
    pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    sort: query.sort ?? "returnRate",
    sortDirection: query.sortDirection ?? "desc",
    query: query.query ?? "",
    error: null,
  };
}

export async function loadProductIntelligence(
  admin: ShopifyAdmin,
  shop: string,
  locale: Locale,
  query: ProductIntelligenceQuery = {},
): Promise<ProductIntelligencePage> {
  const copy = getProductIntelligenceCopy(locale);
  const cached = await loadCachedProductMetrics(shop).catch(() => []);
  const lastSync = await getLastMetricsSync(shop).catch(() => null);
  const cacheFresh =
    Boolean(lastSync) &&
    Date.now() - lastSync!.getTime() < METRICS_CACHE_TTL_MS;

  if (cached.length) {
    if (!cacheFresh) {
      void syncProductMetricsFromShopify(admin, shop).catch((error) => {
        console.error("[ReturnGuard] background product sync failed", error);
      });
    }
    return buildPageFromProducts(cached, query, locale, cached.length, copy);
  }

  try {
    const products = await syncProductMetricsFromShopify(admin, shop);
    return buildPageFromProducts(
      products,
      query,
      locale,
      countUniqueProductsFromRows(products),
      copy,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ReturnGuard] product intelligence failed", message, error);

    return {
      ...emptyProductIntelligencePage(query),
      insights: buildProductInsights([], buildReasonAnalysis([]), locale),
      error: null,
    };
  }
}

export async function loadTopReturnProducts(
  _admin: ShopifyAdmin,
  shop: string,
  limit = 5,
): Promise<ProductReturnRow[]> {
  const cached = await loadCachedProductMetrics(shop).catch(() => []);
  return cached.slice(0, limit);
}

async function syncProductMetricsFromShopify(
  admin: ShopifyAdmin,
  shop: string,
): Promise<ProductReturnRow[]> {
  const { countOrders, returnOrders, currencyCode, analysisStartMs } =
    await fetchRecentReturnData(admin);
  const complaintCounts = await loadComplaintCountsByOrder(shop).catch(
    () => new Map<string, number>(),
  );
  const products = finalizeProducts(
    aggregateProductMetrics(
      countOrders,
      returnOrders,
      complaintCounts,
      currencyCode,
      analysisStartMs,
    ),
  );

  void persistProductMetrics(shop, products).catch((error) => {
    console.error("[ReturnGuard] product metric sync failed", error);
  });

  return products;
}

function countUniqueProductsFromRows(products: ProductReturnRow[]): number {
  return new Set(products.map((product) => product.productId)).size;
}

async function fetchRecentReturnData(admin: ShopifyAdmin): Promise<{
  countOrders: GraphqlOrderNode[];
  returnOrders: GraphqlOrderNode[];
  totalProducts: number;
  currencyCode: string;
  analysisStartMs: number;
}> {
  const analysisStartMs = Date.now() - ANALYSIS_DAYS * DAY_MS;
  const dateFilter = new Date(analysisStartMs).toISOString().slice(0, 10);
  const countQuery = `status:any created_at:>=${dateFilter}`;

  const [countOrders, recentOrders] = await Promise.all([
    paginateOrders(admin, countQuery, ORDERS_FOR_COUNTS_QUERY, MAX_ORDER_PAGES),
    paginateOrders(
      admin,
      "status:any",
      ORDERS_WITH_RETURNS_QUERY,
      MAX_RETURN_ORDER_PAGES,
    ),
  ]);

  const returnOrders = recentOrders.filter(
    (order) => (order.returns?.nodes?.length ?? 0) > 0,
  );

  const returnIds: string[] = [];
  for (const order of returnOrders) {
    for (const ret of order.returns?.nodes ?? []) {
      if (new Date(ret.createdAt).getTime() < analysisStartMs) continue;
      returnIds.push(ret.id);
    }
  }

  const lineItemsByReturnId = await fetchReturnLineItemsMap(admin, returnIds);

  let currencyCode = "USD";
  for (const order of returnOrders) {
    for (const ret of order.returns?.nodes ?? []) {
      if (new Date(ret.createdAt).getTime() < analysisStartMs) continue;

      const lineItems = lineItemsByReturnId.get(ret.id) ?? [];
      ret.returnLineItems = { nodes: lineItems };
      for (const line of lineItems) {
        const money =
          line.fulfillmentLineItem?.lineItem?.originalUnitPriceSet?.shopMoney;
        if (money?.currencyCode) {
          currencyCode = money.currencyCode;
        }
      }
    }
  }

  return {
    countOrders,
    returnOrders,
    totalProducts: countUniqueProducts(countOrders),
    currencyCode,
    analysisStartMs,
  };
}

async function getLastMetricsSync(shop: string): Promise<Date | null> {
  const row = await prisma.productReturnMetric.findFirst({
    where: { shop },
    orderBy: { lastSyncedAt: "desc" },
    select: { lastSyncedAt: true },
  });
  return row?.lastSyncedAt ?? null;
}

type ProductIntelligenceCopy = ReturnType<typeof getProductIntelligenceCopy>;

function recommendationCopy(copy: ProductIntelligenceCopy) {
  return {
    sizingTitle: copy.recSizingTitle,
    sizingMessage: copy.recSizingMessage,
    notAsDescribedTitle: copy.recNotAsDescribedTitle,
    notAsDescribedMessage: copy.recNotAsDescribedMessage,
    damagedTitle: copy.recDamagedTitle,
    damagedMessage: copy.recDamagedMessage,
    underperformingTitle: copy.recUnderperformingTitle,
    underperformingMessage: copy.recUnderperformingMessage,
  };
}

function buildPageFromProducts(
  products: ProductReturnRow[],
  query: ProductIntelligenceQuery,
  locale: Locale,
  totalProducts: number,
  copy: ProductIntelligenceCopy,
): ProductIntelligencePage {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = clamp(query.pageSize ?? DEFAULT_PAGE_SIZE, 5, 100);
  const sort = query.sort ?? "returnRate";
  const sortDirection = query.sortDirection ?? "desc";
  const search = (query.query ?? "").trim().toLowerCase();
  const currencyCode = products[0]?.currencyCode ?? "USD";

  const summary = buildSummary(products, totalProducts, currencyCode);
  const recommendations = buildProductRecommendations(
    products,
    summary.averageReturnRate,
    recommendationCopy(copy),
  );
  const insights = buildProductInsights(
    products,
    summary.reasonAnalysis,
    locale,
  );
  const filtered = filterProducts(products, search);
  const sorted = sortProducts(filtered, sort, sortDirection);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    summary,
    products: sorted.slice(start, start + pageSize),
    allProducts: products,
    recommendations,
    insights,
    page: safePage,
    pageSize,
    total,
    totalPages,
    sort,
    sortDirection,
    query: query.query ?? "",
    error: null,
  };
}

async function paginateOrders(
  admin: ShopifyAdmin,
  searchQuery: string,
  query: string,
  maxPages = MAX_ORDER_PAGES,
): Promise<GraphqlOrderNode[]> {
  const orders: GraphqlOrderNode[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < maxPages; page++) {
    const variables = {
      first: ORDERS_PAGE_SIZE,
      after: cursor,
      query: searchQuery,
    };
    const payload = await fetchOrdersPage(admin, variables, query);
    if (payload.errors?.length) {
      throw new Error(payload.errors[0]?.message ?? "GraphQL error");
    }

    const connection = payload.data?.orders;
    const nodes: GraphqlOrderNode[] = connection?.nodes ?? [];
    orders.push(...nodes);

    if (!connection?.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor ?? null;
  }

  return orders;
}

type ProductIntelligenceGraphqlResponse = {
  data?: {
    orders?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      nodes?: GraphqlOrderNode[];
    } | null;
  } | null;
  errors?: Array<{ message?: string; extensions?: { code?: string } }>;
};

type ReturnLineItemsBatchResponse = {
  data?: {
    nodes?: Array<{
      id?: string;
      returnLineItems?: { nodes?: GraphqlReturnLineItem[] };
    } | null>;
  } | null;
  errors?: Array<{ message?: string }>;
};

async function fetchOrdersPage(
  admin: ShopifyAdmin,
  variables: Record<string, unknown>,
  query: string,
): Promise<ProductIntelligenceGraphqlResponse> {
  const response = await admin.graphql(query, { variables });
  return (await response.json()) as ProductIntelligenceGraphqlResponse;
}

async function fetchReturnLineItemsMap(
  admin: ShopifyAdmin,
  returnIds: string[],
): Promise<Map<string, GraphqlReturnLineItem[]>> {
  const result = new Map<string, GraphqlReturnLineItem[]>();
  const uniqueIds = [...new Set(returnIds)];
  if (!uniqueIds.length) return result;

  for (let index = 0; index < uniqueIds.length; index += RETURN_LINE_ITEMS_BATCH_SIZE) {
    const chunk = uniqueIds.slice(index, index + RETURN_LINE_ITEMS_BATCH_SIZE);
    const chunkResult = await fetchReturnLineItemsBatch(admin, chunk);
    for (const [returnId, lineItems] of chunkResult) {
      result.set(returnId, lineItems);
    }
  }

  return result;
}

async function fetchReturnLineItemsBatch(
  admin: ShopifyAdmin,
  returnIds: string[],
): Promise<Map<string, GraphqlReturnLineItem[]>> {
  const result = new Map<string, GraphqlReturnLineItem[]>();
  let lastErrors: Array<{ message?: string }> = [];

  for (const tier of RETURN_LINE_ITEMS_BATCH_QUERIES) {
    const response = await admin.graphql(tier.query, {
      variables: { ids: returnIds },
    });
    const payload = (await response.json()) as ReturnLineItemsBatchResponse;
    if (payload.errors?.length) {
      lastErrors = payload.errors;
      console.error(
        `[ReturnGuard] return line items ${tier.name} GraphQL errors`,
        payload.errors,
      );
      continue;
    }

    if (tier.name !== "primary") {
      console.log(
        `[ReturnGuard] return line items using ${tier.name} GraphQL query`,
      );
    }

    for (const node of payload.data?.nodes ?? []) {
      if (!node?.id) continue;
      result.set(node.id, node.returnLineItems?.nodes ?? []);
    }
    return result;
  }

  if (lastErrors.length) {
    console.error(
      "[ReturnGuard] return line items batch failed; using totalQuantity estimates",
      lastErrors,
    );
  }

  return result;
}

function countUniqueProducts(orders: GraphqlOrderNode[]): number {
  const ids = new Set<string>();
  for (const order of orders) {
    for (const line of order.lineItems?.nodes ?? []) {
      if (line.product?.id) ids.add(line.product.id);
    }
  }
  return ids.size;
}

type ProductAggregate = {
  productId: string;
  productTitle: string;
  sku: string | null;
  ordersCount: number;
  returnsCount: number;
  revenueLost: number;
  customerComplaints: number;
  reasonBreakdown: ReasonBreakdown;
  trendMap: Map<string, number>;
  currencyCode: string;
};

function aggregateProductMetrics(
  countOrders: GraphqlOrderNode[],
  returnOrders: GraphqlOrderNode[],
  complaintCounts: Map<string, number>,
  currencyCode: string,
  analysisStartMs: number,
): ProductAggregate[] {
  const byProduct = new Map<string, ProductAggregate>();

  for (const order of countOrders) {
    const productIdsInOrder = new Set<string>();
    for (const line of order.lineItems?.nodes ?? []) {
      const productId = line.product?.id;
      if (!productId) continue;
      productIdsInOrder.add(productId);
      ensureAggregate(byProduct, productId, {
        productTitle: line.product?.title ?? "Unknown product",
        sku: line.sku ?? null,
        currencyCode,
      });
    }

    for (const productId of productIdsInOrder) {
      const aggregate = byProduct.get(productId);
      if (aggregate) aggregate.ordersCount += 1;
    }
  }

  for (const order of returnOrders) {
    const complaints = complaintCounts.get(order.id) ?? 0;
    for (const ret of order.returns?.nodes ?? []) {
      if (new Date(ret.createdAt).getTime() < analysisStartMs) continue;

      const returnDate = formatDate(new Date(ret.createdAt));
      const lineItems = ret.returnLineItems?.nodes ?? [];
      if (lineItems.length) {
        for (const line of lineItems) {
          applyReturnLineItem(
            byProduct,
            line,
            returnDate,
            complaints,
            currencyCode,
          );
        }
        continue;
      }

      if ((ret.totalQuantity ?? 0) > 0) {
        applyEstimatedReturnQuantities(
          byProduct,
          order,
          ret.totalQuantity ?? 0,
          returnDate,
          complaints,
          currencyCode,
        );
      }
    }
  }

  return Array.from(byProduct.values());
}

function applyReturnLineItem(
  byProduct: Map<string, ProductAggregate>,
  line: GraphqlReturnLineItem,
  returnDate: string,
  complaints: number,
  currencyCode: string,
) {
  const lineItem = line.fulfillmentLineItem?.lineItem;
  const productId = lineItem?.product?.id;
  if (!productId) return;

  const aggregate = ensureAggregate(byProduct, productId, {
    productTitle: lineItem.product?.title ?? lineItem.title ?? "Unknown product",
    sku: lineItem.sku ?? lineItem.variant?.sku ?? null,
    currencyCode,
  });

  const quantity = line.quantity ?? 1;
  const unitPrice = Number(
    lineItem.originalUnitPriceSet?.shopMoney.amount ?? "0",
  );
  aggregate.returnsCount += quantity;
  aggregate.revenueLost += unitPrice * quantity;
  aggregate.customerComplaints += complaints;

  const category = categorizeReturnReason({
    returnReason: line.returnReason,
    reasonHandle: line.returnReasonDefinition?.handle,
    reasonName: line.returnReasonDefinition?.name,
    note: line.returnReasonNote,
  });
  aggregate.reasonBreakdown[category] += quantity;
  aggregate.trendMap.set(
    returnDate,
    (aggregate.trendMap.get(returnDate) ?? 0) + quantity,
  );
}

function applyEstimatedReturnQuantities(
  byProduct: Map<string, ProductAggregate>,
  order: GraphqlOrderNode,
  totalQuantity: number,
  returnDate: string,
  complaints: number,
  currencyCode: string,
) {
  const lineItems = (order.lineItems?.nodes ?? []).filter(
    (line) => line.product?.id,
  );
  if (!lineItems.length) return;

  const totalLineQty = lineItems.reduce(
    (sum, line) => sum + Math.max(1, line.quantity),
    0,
  );
  let remaining = totalQuantity;

  lineItems.forEach((line, index) => {
    const productId = line.product!.id;
    const isLast = index === lineItems.length - 1;
    const quantity = isLast
      ? remaining
      : Math.max(
          0,
          Math.round((totalQuantity * Math.max(1, line.quantity)) / totalLineQty),
        );
    remaining -= quantity;
    if (quantity <= 0) return;

    const aggregate = ensureAggregate(byProduct, productId, {
      productTitle: line.product?.title ?? "Unknown product",
      sku: line.sku ?? null,
      currencyCode,
    });
    aggregate.returnsCount += quantity;
    aggregate.customerComplaints += complaints;
    aggregate.reasonBreakdown.other += quantity;
    aggregate.trendMap.set(
      returnDate,
      (aggregate.trendMap.get(returnDate) ?? 0) + quantity,
    );
  });
}

function finalizeProducts(aggregates: ProductAggregate[]): ProductReturnRow[] {
  const maxRevenueLost = Math.max(
    1,
    ...aggregates.map((item) => item.revenueLost),
  );

  return aggregates.map((item) => {
    const returnRate =
      item.ordersCount > 0
        ? Math.round((item.returnsCount / item.ordersCount) * 1000) / 10
        : 0;
    const returnTrend = buildTrendSeries(item.trendMap);

    return finalizeProductRow(
      {
        productId: item.productId,
        productTitle: item.productTitle,
        sku: item.sku,
        ordersCount: item.ordersCount,
        returnsCount: item.returnsCount,
        returnRate,
        revenueLost: roundMoney(item.revenueLost),
        customerComplaints: item.customerComplaints,
        reasonBreakdown: item.reasonBreakdown,
        returnTrend,
        currencyCode: item.currencyCode,
      },
      maxRevenueLost,
    );
  });
}

function buildSummary(
  products: ProductReturnRow[],
  totalProducts: number,
  currencyCode: string,
): ProductIntelligenceSummary {
  const withReturns = products.filter((product) => product.returnsCount > 0);
  const totalReturns = withReturns.reduce(
    (sum, product) => sum + product.returnsCount,
    0,
  );
  const totalOrders = products.reduce(
    (sum, product) => sum + product.ordersCount,
    0,
  );
  const averageReturnRate =
    totalOrders > 0
      ? Math.round((totalReturns / totalOrders) * 1000) / 10
      : 0;

  const estimatedRevenueLost = roundMoney(
    withReturns.reduce((sum, product) => sum + product.revenueLost, 0),
  );
  const revenueAtRisk = roundMoney(
    withReturns.reduce((sum, product) => sum + product.revenueAtRisk, 0),
  );
  const revenueRecoverable = roundMoney(
    withReturns.reduce((sum, product) => sum + product.revenueRecoverable, 0),
  );

  return {
    totalProducts,
    productsWithReturns: withReturns.length,
    averageReturnRate,
    estimatedRevenueLost,
    estimatedRevenueSaved: revenueRecoverable,
    revenueAtRisk,
    revenueRecoverable,
    currencyCode,
    reasonAnalysis: buildReasonAnalysis(withReturns),
  };
}

async function loadComplaintCountsByOrder(
  shop: string,
): Promise<Map<string, number>> {
  const start = new Date(Date.now() - ANALYSIS_DAYS * DAY_MS);
  const events = await prisma.returnDecisionEvent.findMany({
    where: {
      shop,
      createdAt: { gte: start },
      decision: { in: ["review", "hold"] },
    },
    select: { orderId: true },
  });

  const counts = new Map<string, number>();
  for (const event of events) {
    counts.set(event.orderId, (counts.get(event.orderId) ?? 0) + 1);
  }
  return counts;
}

async function persistProductMetrics(
  shop: string,
  products: ProductReturnRow[],
): Promise<void> {
  const now = new Date();
  const rows = products.filter(
    (product) => product.returnsCount > 0 || product.ordersCount > 0,
  );
  if (!rows.length) return;

  await prisma.$transaction(
    rows.map((product) =>
      prisma.productReturnMetric.upsert({
        where: {
          shop_productId: { shop, productId: product.productId },
        },
        create: {
          shop,
          productId: product.productId,
          productTitle: product.productTitle,
          sku: product.sku,
          ordersCount: product.ordersCount,
          returnsCount: product.returnsCount,
          returnRate: product.returnRate,
          revenueLost: product.revenueLost,
          revenueAtRisk: product.revenueAtRisk,
          revenueRecoverable: product.revenueRecoverable,
          riskScore: product.riskScore,
          riskLevel: product.riskLevel,
          reasonSizing: product.reasonBreakdown.sizing,
          reasonDamaged: product.reasonBreakdown.damaged,
          reasonNotAsDescribed: product.reasonBreakdown.notAsDescribed,
          reasonChangedMind: product.reasonBreakdown.changedMind,
          reasonLateDelivery: product.reasonBreakdown.lateDelivery,
          reasonOther: product.reasonBreakdown.other,
          customerComplaints: product.customerComplaints,
          currencyCode: product.currencyCode,
          lastSyncedAt: now,
        },
        update: {
          productTitle: product.productTitle,
          sku: product.sku,
          ordersCount: product.ordersCount,
          returnsCount: product.returnsCount,
          returnRate: product.returnRate,
          revenueLost: product.revenueLost,
          revenueAtRisk: product.revenueAtRisk,
          revenueRecoverable: product.revenueRecoverable,
          riskScore: product.riskScore,
          riskLevel: product.riskLevel,
          reasonSizing: product.reasonBreakdown.sizing,
          reasonDamaged: product.reasonBreakdown.damaged,
          reasonNotAsDescribed: product.reasonBreakdown.notAsDescribed,
          reasonChangedMind: product.reasonBreakdown.changedMind,
          reasonLateDelivery: product.reasonBreakdown.lateDelivery,
          reasonOther: product.reasonBreakdown.other,
          customerComplaints: product.customerComplaints,
          currencyCode: product.currencyCode,
          lastSyncedAt: now,
        },
      }),
    ),
  );

  const productIds = rows.map((product) => product.productId);
  await prisma.productReturnTrendDay.deleteMany({
    where: { shop, productId: { in: productIds } },
  });

  const trendRows = rows.flatMap((product) =>
    product.returnTrend.map((point) => ({
      shop,
      productId: product.productId,
      date: point.date,
      count: point.count,
    })),
  );

  if (trendRows.length) {
    await prisma.productReturnTrendDay.createMany({ data: trendRows });
  }
}

async function loadCachedProductMetrics(shop: string): Promise<ProductReturnRow[]> {
  const rows = await prisma.productReturnMetric.findMany({
    where: { shop, returnsCount: { gt: 0 } },
    include: { trendDays: { orderBy: { date: "asc" } } },
    orderBy: { returnRate: "desc" },
  });

  return rows.map((row) => ({
    productId: row.productId,
    productTitle: row.productTitle,
    sku: row.sku,
    ordersCount: row.ordersCount,
    returnsCount: row.returnsCount,
    returnRate: Number(row.returnRate),
    revenueLost: Number(row.revenueLost),
    revenueAtRisk: Number(row.revenueAtRisk),
    revenueRecoverable: Number(row.revenueRecoverable),
    riskScore: row.riskScore,
    riskLevel: row.riskLevel as ProductReturnRow["riskLevel"],
    customerComplaints: row.customerComplaints,
    reasonBreakdown: {
      sizing: row.reasonSizing,
      damaged: row.reasonDamaged,
      notAsDescribed: row.reasonNotAsDescribed,
      changedMind: row.reasonChangedMind,
      lateDelivery: row.reasonLateDelivery,
      other: row.reasonOther,
    },
    returnTrend: row.trendDays.map((day) => ({
      date: day.date,
      count: day.count,
    })),
    currencyCode: row.currencyCode,
  }));
}

function filterProducts(products: ProductReturnRow[], query: string) {
  const withReturns = products.filter((product) => product.returnsCount > 0);
  if (!query) return withReturns;
  return withReturns.filter((product) => {
    const haystack = `${product.productTitle} ${product.sku ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

function sortProducts(
  products: ProductReturnRow[],
  sort: ProductSortField,
  direction: "asc" | "desc",
): ProductReturnRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    const left =
      sort === "productTitle" ? a.productTitle.toLowerCase() : a[sort];
    const right =
      sort === "productTitle" ? b.productTitle.toLowerCase() : b[sort];
    if (left < right) return -1 * factor;
    if (left > right) return 1 * factor;
    return 0;
  });
}

function buildTrendSeries(trendMap: Map<string, number>): ProductTrendPoint[] {
  const start = startOfDay(new Date(Date.now() - 29 * DAY_MS));
  const points: ProductTrendPoint[] = [];
  for (let offset = 0; offset < 30; offset++) {
    const date = formatDate(new Date(start.getTime() + offset * DAY_MS));
    points.push({ date, count: trendMap.get(date) ?? 0 });
  }
  return points;
}

function ensureAggregate(
  map: Map<string, ProductAggregate>,
  productId: string,
  seed: Pick<ProductAggregate, "productTitle" | "sku" | "currencyCode">,
): ProductAggregate {
  const existing = map.get(productId);
  if (existing) return existing;

  const created: ProductAggregate = {
    productId,
    productTitle: seed.productTitle,
    sku: seed.sku,
    ordersCount: 0,
    returnsCount: 0,
    revenueLost: 0,
    customerComplaints: 0,
    reasonBreakdown: emptyReasonBreakdown(),
    trendMap: new Map(),
    currencyCode: seed.currencyCode,
  };
  map.set(productId, created);
  return created;
}

function emptySummary(): ProductIntelligenceSummary {
  const emptyReason = { count: 0, percentage: 0 };
  return {
    totalProducts: 0,
    productsWithReturns: 0,
    averageReturnRate: 0,
    estimatedRevenueLost: 0,
    estimatedRevenueSaved: 0,
    revenueAtRisk: 0,
    revenueRecoverable: 0,
    currencyCode: "USD",
    reasonAnalysis: {
      sizing: emptyReason,
      damaged: emptyReason,
      notAsDescribed: emptyReason,
      changedMind: emptyReason,
      lateDelivery: emptyReason,
      other: emptyReason,
      total: 0,
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfDay(input: Date): Date {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(input: Date): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
