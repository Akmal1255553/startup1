import prisma from "../db.server";
import { getProductIntelligenceCopy } from "../i18n/messages/app/product-intelligence";
import type { Locale } from "../i18n/types";
import { buildProductInsights } from "./product-insights.server";
import { buildProductRecommendations } from "./product-recommendations.server";
import type {
  ProductIntelligencePage,
  ProductIntelligenceQuery,
  ProductIntelligenceSummary,
  ProductReturnRow,
  ProductSortField,
  ProductTrendPoint,
  ReasonBreakdown,
  ReturnReasonAnalysis,
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
const MAX_ORDER_PAGES = 6;
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
  returns: {
    nodes: Array<{
      id: string;
      createdAt: string;
      returnLineItems: {
        nodes: GraphqlReturnLineItem[];
      };
    }>;
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

const PRODUCT_INTELLIGENCE_QUERY = `#graphql
  query ReturnGuardProductIntelligence(
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
            returnLineItems(first: 25) {
              nodes {
                ${RETURN_LINE_ITEM_PRIMARY}
              }
            }
          }
        }
      }
    }
  }
`;

/** Fallback when price sets or legacy return reason fields are unavailable. */
const PRODUCT_INTELLIGENCE_FALLBACK_QUERY = `#graphql
  query ReturnGuardProductIntelligenceFallback(
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
            returnLineItems(first: 25) {
              nodes {
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
              }
            }
          }
        }
      }
    }
  }
`;

/** Last resort: product mapping only, no return reasons or prices. */
const PRODUCT_INTELLIGENCE_MINIMAL_QUERY = `#graphql
  query ReturnGuardProductIntelligenceMinimal(
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
            returnLineItems(first: 25) {
              nodes {
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
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_INTELLIGENCE_QUERIES = [
  { name: "primary", query: PRODUCT_INTELLIGENCE_QUERY },
  { name: "fallback", query: PRODUCT_INTELLIGENCE_FALLBACK_QUERY },
  { name: "minimal", query: PRODUCT_INTELLIGENCE_MINIMAL_QUERY },
] as const;

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
  const page = Math.max(1, query.page ?? 1);
  const pageSize = clamp(
    query.pageSize ?? DEFAULT_PAGE_SIZE,
    5,
    100,
  );
  const sort = query.sort ?? "returnRate";
  const sortDirection = query.sortDirection ?? "desc";
  const search = (query.query ?? "").trim().toLowerCase();

  try {
    const { orders, totalProducts, currencyCode } =
      await fetchRecentReturnOrders(admin);
    const complaintCounts = await loadComplaintCountsByOrder(shop).catch(
      (error) => {
        console.error("[ReturnGuard] product complaint counts failed", error);
        return new Map<string, number>();
      },
    );
    const aggregates = aggregateProductMetrics(
      orders,
      complaintCounts,
      currencyCode,
    );
    const products = finalizeProducts(aggregates);
    const summary = buildSummary(products, totalProducts, currencyCode);
    const recommendations = buildProductRecommendations(
      products,
      summary.averageReturnRate,
      {
        sizingTitle: copy.recSizingTitle,
        sizingMessage: copy.recSizingMessage,
        notAsDescribedTitle: copy.recNotAsDescribedTitle,
        notAsDescribedMessage: copy.recNotAsDescribedMessage,
        damagedTitle: copy.recDamagedTitle,
        damagedMessage: copy.recDamagedMessage,
        underperformingTitle: copy.recUnderperformingTitle,
        underperformingMessage: copy.recUnderperformingMessage,
      },
    );
    const insights = buildProductInsights(
      products,
      summary.reasonAnalysis,
      locale,
    );

    await persistProductMetrics(shop, products).catch((error) => {
      console.error("[ReturnGuard] product metric sync failed", error);
    });

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[ReturnGuard] product intelligence failed", message, error);
    const cached = await loadCachedProductMetrics(shop).catch(() => []);
    if (cached.length) {
      const summary = buildSummary(cached, cached.length, cached[0]?.currencyCode ?? "USD");
      const filtered = filterProducts(cached, search);
      const sorted = sortProducts(filtered, sort, sortDirection);
      const total = sorted.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * pageSize;
      return {
        summary,
        products: sorted.slice(start, start + pageSize),
        allProducts: cached,
        recommendations: [],
        insights: buildProductInsights(cached, summary.reasonAnalysis, locale),
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

    return {
      ...emptyProductIntelligencePage(query),
      error: copy.errorLoad,
    };
  }
}

export async function loadTopReturnProducts(
  admin: ShopifyAdmin,
  shop: string,
  limit = 5,
): Promise<ProductReturnRow[]> {
  try {
    const { orders, currencyCode } = await fetchRecentReturnOrders(admin);
    const complaintCounts = await loadComplaintCountsByOrder(shop);
    const products = finalizeProducts(
      aggregateProductMetrics(orders, complaintCounts, currencyCode),
    );
    return [...products]
      .filter((product) => product.returnsCount > 0)
      .sort((a, b) => b.returnsCount - a.returnsCount)
      .slice(0, limit);
  } catch (error) {
    console.error("[ReturnGuard] top return products failed", error);
    const cached = await loadCachedProductMetrics(shop).catch(() => []);
    return cached
      .filter((product) => product.returnsCount > 0)
      .sort((a, b) => b.returnsCount - a.returnsCount)
      .slice(0, limit);
  }
}

async function fetchRecentReturnOrders(admin: ShopifyAdmin): Promise<{
  orders: GraphqlOrderNode[];
  totalProducts: number;
  currencyCode: string;
}> {
  const startDate = new Date(Date.now() - (ANALYSIS_DAYS - 1) * DAY_MS);
  const dateFilter = startDate.toISOString().slice(0, 10);
  const searchQuery = `created_at:>=${dateFilter}`;

  const orders: GraphqlOrderNode[] = [];
  let cursor: string | null = null;
  let currencyCode = "USD";
  let resolvedQuery: string | null = null;

  for (let page = 0; page < MAX_ORDER_PAGES; page++) {
    const variables = {
      first: ORDERS_PAGE_SIZE,
      after: cursor,
      query: searchQuery,
    };

    let payload: ProductIntelligenceGraphqlResponse;
    if (page === 0) {
      const resolved = await resolveProductIntelligenceQuery(admin, variables);
      resolvedQuery = resolved.query;
      payload = resolved.firstPayload;
    } else {
      payload = await fetchProductIntelligencePayload(
        admin,
        variables,
        resolvedQuery!,
      );
      if (payload.errors?.length) {
        throw new Error(payload.errors[0]?.message ?? "GraphQL error");
      }
    }

    const connection = payload.data?.orders;
    const nodes: GraphqlOrderNode[] = connection?.nodes ?? [];
    orders.push(...nodes);

    for (const order of nodes) {
      for (const ret of order.returns?.nodes ?? []) {
        for (const line of ret.returnLineItems?.nodes ?? []) {
          const money =
            line.fulfillmentLineItem?.lineItem?.originalUnitPriceSet
              ?.shopMoney;
          if (money?.currencyCode) {
            currencyCode = money.currencyCode;
          }
        }
      }
    }

    if (!connection?.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor ?? null;
  }

  return {
    orders,
    totalProducts: countUniqueProducts(orders),
    currencyCode,
  };
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

async function fetchProductIntelligencePayload(
  admin: ShopifyAdmin,
  variables: Record<string, unknown>,
  query: string,
): Promise<ProductIntelligenceGraphqlResponse> {
  const response = await admin.graphql(query, { variables });
  return (await response.json()) as ProductIntelligenceGraphqlResponse;
}

async function resolveProductIntelligenceQuery(
  admin: ShopifyAdmin,
  variables: Record<string, unknown>,
): Promise<{ query: string; firstPayload: ProductIntelligenceGraphqlResponse }> {
  let lastErrors: Array<{ message?: string }> = [];

  for (const tier of PRODUCT_INTELLIGENCE_QUERIES) {
    const payload = await fetchProductIntelligencePayload(
      admin,
      variables,
      tier.query,
    );
    if (!payload.errors?.length) {
      if (tier.name !== "primary") {
        console.log(
          `[ReturnGuard] product intelligence using ${tier.name} GraphQL query`,
        );
      }
      return { query: tier.query, firstPayload: payload };
    }

    lastErrors = payload.errors ?? [];
    console.error(
      `[ReturnGuard] product intelligence ${tier.name} GraphQL errors`,
      payload.errors,
    );
  }

  throw new Error(
    lastErrors[0]?.message ?? "Unable to load Shopify return data",
  );
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
  orders: GraphqlOrderNode[],
  complaintCounts: Map<string, number>,
  currencyCode: string,
): ProductAggregate[] {
  const byProduct = new Map<string, ProductAggregate>();
  const orderProducts = new Map<string, Set<string>>();

  for (const order of orders) {
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
    orderProducts.set(order.id, productIdsInOrder);

    for (const productId of productIdsInOrder) {
      const aggregate = byProduct.get(productId);
      if (aggregate) aggregate.ordersCount += 1;
    }

    const complaints = complaintCounts.get(order.id) ?? 0;
    for (const ret of order.returns?.nodes ?? []) {
      const returnDate = formatDate(new Date(ret.createdAt));
      for (const line of ret.returnLineItems?.nodes ?? []) {
        const lineItem = line.fulfillmentLineItem?.lineItem;
        const productId = lineItem?.product?.id;
        if (!productId) continue;

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
    }
  }

  return Array.from(byProduct.values());
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

function buildReasonAnalysis(products: ProductReturnRow[]): ReturnReasonAnalysis {
  const totals = emptyReasonBreakdown();
  for (const product of products) {
    for (const key of Object.keys(totals) as Array<keyof ReasonBreakdown>) {
      totals[key] += product.reasonBreakdown[key];
    }
  }

  const total = Object.values(totals).reduce((sum, count) => sum + count, 0);
  const toStat = (count: number) => ({
    count,
    percentage: total ? Math.round((count / total) * 100) : 0,
  });

  return {
    sizing: toStat(totals.sizing),
    damaged: toStat(totals.damaged),
    notAsDescribed: toStat(totals.notAsDescribed),
    changedMind: toStat(totals.changedMind),
    lateDelivery: toStat(totals.lateDelivery),
    other: toStat(totals.other),
    total,
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
  for (const product of products) {
    if (product.returnsCount === 0 && product.ordersCount === 0) continue;

    await prisma.productReturnMetric.upsert({
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
    });

    for (const point of product.returnTrend) {
      await prisma.productReturnTrendDay.upsert({
        where: {
          shop_productId_date: {
            shop,
            productId: product.productId,
            date: point.date,
          },
        },
        create: {
          shop,
          productId: product.productId,
          date: point.date,
          count: point.count,
        },
        update: { count: point.count },
      });
    }
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
  if (!query) {
    return products.filter((product) => product.returnsCount > 0 || product.ordersCount > 0);
  }
  return products.filter((product) => {
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
