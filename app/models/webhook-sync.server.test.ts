import { beforeEach, describe, expect, it, vi } from "vitest";

type CapturedCreate = {
  shop: string;
  topic: string;
  shopifyId: string | null;
  payloadJson: string;
};

const recorded: CapturedCreate[] = [];
const decisionStore = {
  rows: [] as Array<{
    id: string;
    shop: string;
    orderId: string;
    returnId: string | null;
    orderName: string | null;
    decision: string;
  }>,
  events: [] as Array<{
    shop: string;
    orderId: string;
    returnId: string | null;
    orderName: string | null;
    decision: string;
    previousDecision?: string | null;
    reason?: string | null;
  }>,
};
const deletedShops: string[] = [];
const deletedCustomerOrderIds: string[][] = [];

vi.mock("../db.server", () => {
  const prisma = {
    webhookEvent: {
      create: vi.fn(async ({ data }: { data: CapturedCreate }) => {
        recorded.push(data);
        return data;
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    returnDecision: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { shop: string; returnId: string };
        }) => {
          const row = decisionStore.rows.find(
            (r) => r.shop === where.shop && r.returnId === where.returnId,
          );
          // Return a shallow copy so the caller's snapshot can't be mutated by
          // subsequent in-place updates (mirrors how Prisma actually behaves).
          return row ? { ...row } : null;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { decision: string };
        }) => {
          const row = decisionStore.rows.find((r) => r.id === where.id);
          if (row) row.decision = data.decision;
          return row;
        },
      ),
      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            shop: string;
            orderId: string;
            returnId: string | null;
            orderName: string | null;
            decision: string;
          };
        }) => {
          const row = { id: `row_${decisionStore.rows.length + 1}`, ...data };
          decisionStore.rows.push(row);
          return row;
        },
      ),
      deleteMany: vi.fn(
        async ({
          where,
        }: {
          where: {
            shop: string;
            orderId?: { in: string[] };
          };
        }) => {
          if (where.orderId?.in) {
            deletedCustomerOrderIds.push(where.orderId.in);
            decisionStore.rows = decisionStore.rows.filter(
              (row) =>
                !(
                  row.shop === where.shop &&
                  where.orderId!.in.includes(row.orderId)
                ),
            );
          } else {
            deletedShops.push(where.shop);
            decisionStore.rows = decisionStore.rows.filter(
              (row) => row.shop !== where.shop,
            );
          }
          return { count: 0 };
        },
      ),
    },
    returnDecisionEvent: {
      create: vi.fn(async ({ data }: { data: (typeof decisionStore.events)[number] }) => {
        decisionStore.events.push(data);
        return data;
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    playbook: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    returnRiskSetting: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return { default: prisma };
});

const {
  extractShopifyId,
  recordWebhookEvent,
  syncReturnDecisionFromWebhook,
  redactShop,
  redactCustomerData,
} = await import("./webhook-sync.server");

beforeEach(() => {
  recorded.length = 0;
  decisionStore.rows = [];
  decisionStore.events = [];
  deletedShops.length = 0;
  deletedCustomerOrderIds.length = 0;
});

describe("extractShopifyId", () => {
  it("returns null when source is null/undefined", () => {
    expect(extractShopifyId(null)).toBeNull();
    expect(extractShopifyId(undefined)).toBeNull();
  });

  it("prefers admin_graphql_api_id", () => {
    expect(
      extractShopifyId({
        admin_graphql_api_id: "gid://shopify/Order/9",
        id: 9,
      }),
    ).toBe("gid://shopify/Order/9");
  });

  it("falls back to numeric id", () => {
    expect(extractShopifyId({ id: 42 })).toBe("42");
  });

  it("falls back to string id", () => {
    expect(extractShopifyId({ id: "abc" })).toBe("abc");
  });

  it("returns null when nothing usable", () => {
    expect(extractShopifyId({})).toBeNull();
    expect(extractShopifyId({ id: null })).toBeNull();
  });
});

describe("recordWebhookEvent", () => {
  it("stores stringified payload with shop/topic", async () => {
    await recordWebhookEvent("s.myshopify.com", "orders/create", {
      hello: "world",
    });
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      shop: "s.myshopify.com",
      topic: "orders/create",
      shopifyId: null,
    });
    expect(JSON.parse(recorded[0].payloadJson)).toEqual({ hello: "world" });
  });

  it("truncates very large payloads", async () => {
    const big = { blob: "x".repeat(20_000) };
    await recordWebhookEvent("s.myshopify.com", "orders/updated", big);
    expect(recorded[0].payloadJson.endsWith("[truncated]")).toBe(true);
    expect(recorded[0].payloadJson.length).toBeLessThanOrEqual(16_000 + 32);
  });

  it("handles unserializable payloads gracefully", async () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    await recordWebhookEvent("s.myshopify.com", "orders/create", circular);
    expect(JSON.parse(recorded[0].payloadJson)).toEqual({
      _warning: "unserializable_payload",
    });
  });

  it("passes through shopifyId when provided", async () => {
    await recordWebhookEvent(
      "s.myshopify.com",
      "orders/create",
      { id: 1 },
      "gid://shopify/Order/1",
    );
    expect(recorded[0].shopifyId).toBe("gid://shopify/Order/1");
  });
});

describe("syncReturnDecisionFromWebhook", () => {
  it("ignores informational topics", async () => {
    await syncReturnDecisionFromWebhook("s.myshopify.com", "returns/request", {
      id: 1,
      order_id: 2,
    });
    expect(decisionStore.rows).toHaveLength(0);
    expect(decisionStore.events).toHaveLength(0);
  });

  it("creates a new ReturnDecision + event when none exists", async () => {
    await syncReturnDecisionFromWebhook("s.myshopify.com", "returns/approve", {
      id: 9,
      order_id: 100,
      name: "#1009",
    });

    expect(decisionStore.rows).toHaveLength(1);
    expect(decisionStore.rows[0]).toMatchObject({
      shop: "s.myshopify.com",
      orderId: "gid://shopify/Order/100",
      returnId: "gid://shopify/Return/9",
      orderName: "#1009",
      decision: "approved",
    });
    expect(decisionStore.events).toHaveLength(1);
    expect(decisionStore.events[0].decision).toBe("approved");
    expect(decisionStore.events[0].reason).toContain(
      "Mirrored from Shopify webhook returns/approve",
    );
  });

  it("uses admin_graphql_api_id when present", async () => {
    await syncReturnDecisionFromWebhook("s.myshopify.com", "returns/approve", {
      id: 9,
      admin_graphql_api_id: "gid://shopify/Return/CUSTOM",
      order_id: 100,
    });
    expect(decisionStore.rows[0].returnId).toBe("gid://shopify/Return/CUSTOM");
  });

  it("updates and logs previousDecision when state changes", async () => {
    decisionStore.rows.push({
      id: "preexisting",
      shop: "s.myshopify.com",
      orderId: "gid://shopify/Order/100",
      returnId: "gid://shopify/Return/9",
      orderName: "#1009",
      decision: "approved",
    });

    await syncReturnDecisionFromWebhook("s.myshopify.com", "returns/decline", {
      id: 9,
      order_id: 100,
    });

    expect(decisionStore.rows[0].decision).toBe("hold");
    expect(decisionStore.events).toHaveLength(1);
    expect(decisionStore.events[0].previousDecision).toBe("approved");
    expect(decisionStore.events[0].decision).toBe("hold");
  });

  it("is idempotent — no event when decision already matches", async () => {
    decisionStore.rows.push({
      id: "preexisting",
      shop: "s.myshopify.com",
      orderId: "gid://shopify/Order/100",
      returnId: "gid://shopify/Return/9",
      orderName: null,
      decision: "approved",
    });

    await syncReturnDecisionFromWebhook("s.myshopify.com", "returns/approve", {
      id: 9,
      order_id: 100,
    });

    expect(decisionStore.events).toHaveLength(0);
  });

  it("skips when order_id is missing", async () => {
    await syncReturnDecisionFromWebhook("s.myshopify.com", "returns/approve", {
      id: 9,
    });
    expect(decisionStore.rows).toHaveLength(0);
  });
});

describe("redactShop", () => {
  it("calls deleteMany for all shop-scoped models", async () => {
    decisionStore.rows.push({
      id: "x",
      shop: "victim.myshopify.com",
      orderId: "gid://shopify/Order/1",
      returnId: null,
      orderName: null,
      decision: "approved",
    });

    await redactShop("victim.myshopify.com");

    expect(deletedShops).toContain("victim.myshopify.com");
    expect(decisionStore.rows).toHaveLength(0);
  });
});

describe("redactCustomerData", () => {
  it("no-op when payload has no orders_to_redact", async () => {
    await redactCustomerData("s.myshopify.com", {});
    expect(deletedCustomerOrderIds).toHaveLength(0);
  });

  it("maps numeric ids to Order GIDs and deletes scoped rows", async () => {
    decisionStore.rows.push(
      {
        id: "a",
        shop: "s.myshopify.com",
        orderId: "gid://shopify/Order/100",
        returnId: null,
        orderName: null,
        decision: "approved",
      },
      {
        id: "b",
        shop: "s.myshopify.com",
        orderId: "gid://shopify/Order/200",
        returnId: null,
        orderName: null,
        decision: "approved",
      },
    );

    await redactCustomerData("s.myshopify.com", {
      orders_to_redact: [100],
    });

    expect(deletedCustomerOrderIds[0]).toEqual(["gid://shopify/Order/100"]);
    expect(decisionStore.rows.map((row) => row.orderId)).toEqual([
      "gid://shopify/Order/200",
    ]);
  });
});
