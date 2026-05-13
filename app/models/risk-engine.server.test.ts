import type { Playbook } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { RiskSettings } from "./return-risk";
import {
  buildRiskOrders,
  mergeSavedDecisionsOntoRiskOrders,
  summarizeOrders,
  type SavedDecisionProjection,
} from "./risk-engine.server";

const SETTINGS: RiskSettings = {
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

type ShopifyOrderNode = Parameters<typeof buildRiskOrders>[0][number];

function makeOrder(overrides: Partial<ShopifyOrderNode> = {}): ShopifyOrderNode {
  return {
    id: overrides.id ?? "gid://shopify/Order/1",
    name: overrides.name ?? "#1001",
    createdAt: overrides.createdAt ?? "2026-05-01T00:00:00Z",
    displayFinancialStatus: overrides.displayFinancialStatus ?? "Paid",
    displayFulfillmentStatus: overrides.displayFulfillmentStatus ?? "Fulfilled",
    currentTotalPriceSet: overrides.currentTotalPriceSet ?? {
      shopMoney: { amount: "50", currencyCode: "USD" },
    },
    customer:
      overrides.customer === undefined
        ? {
            displayName: "Alice",
            email: "alice@example.com",
            numberOfOrders: "3",
            // Far enough back to land in the ">365 days" bucket given the
            // frozen system time below, so age contributes a stable -8.
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          }
        : overrides.customer,
  };
}

function makePlaybook(overrides: Partial<Playbook> = {}): Playbook {
  const now = new Date("2026-01-01T00:00:00Z");
  return {
    id: "pb_1",
    shop: "shop.myshopify.com",
    name: "Test",
    notes: null,
    isActive: true,
    action: "hold",
    minOrderValue: null,
    suspiciousDomainsCsv: null,
    repeatReturnsThreshold: null,
    minAccountAgeDays: null,
    vipBypassEnabled: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// Freeze "now" so account-age deltas don't drift as time passes.
beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("buildRiskOrders / scoreOrder (V2)", () => {
  it("low-value paid+fulfilled trusted customer ⇒ clamped to floor (8)", () => {
    // base 10 + value 0 + payment -2 + fulfillment -2 + customer +4 + age -8 = 2
    // clamps to floor of 8.
    const [row] = buildRiskOrders([makeOrder()], SETTINGS, [], []);
    expect(row.risk).toBe(8);
    expect(row.recommendation).toBe("Approve automatically");
    expect(row.factors).toContain("Low order value");
    expect(row.factors).toContain("Payment cleared");
    expect(row.factors).toContain("Order fulfilled");
    expect(row.appliedPlaybooks).toEqual([]);
    expect(row.savedDecision).toBeNull();
    expect(row.currencyCode).toBe("USD");
    expect(row.narrative).toMatch(/ReturnGuard recommends/i);
  });

  it("medium-value adds +12", () => {
    // base 10 + value 12 + payment -2 + fulfillment -2 + customer +4 + age -8 = 14
    const [row] = buildRiskOrders(
      [
        makeOrder({
          currentTotalPriceSet: {
            shopMoney: { amount: "150", currencyCode: "USD" },
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(14);
    expect(row.factors).toContain("Medium order value");
  });

  it("high-value adds +20", () => {
    // base 10 + value 20 + payment -2 + fulfillment -2 + customer +4 + age -8 = 22
    const [row] = buildRiskOrders(
      [
        makeOrder({
          currentTotalPriceSet: {
            shopMoney: { amount: "300", currencyCode: "USD" },
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(22);
    expect(row.factors).toContain("High order value");
  });

  it("very-high-value (2× threshold) adds +28", () => {
    // base 10 + 28 - 2 - 2 + 4 - 8 = 30
    const [row] = buildRiskOrders(
      [
        makeOrder({
          currentTotalPriceSet: {
            shopMoney: { amount: "800", currencyCode: "USD" },
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(30);
    expect(row.factors).toContain("Very high order value");
  });

  it("extreme-value (≥8× threshold) adds +38", () => {
    // base 10 + 38 - 2 - 2 + 4 - 8 = 40
    const [row] = buildRiskOrders(
      [
        makeOrder({
          currentTotalPriceSet: {
            shopMoney: { amount: "5000", currencyCode: "USD" },
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(40);
    expect(row.factors).toContain("Extreme order value");
  });

  it("Unfulfilled now correctly trips the fulfillment delta (V1 substring bug fixed)", () => {
    // base 10 + value 0 + payment -2 + fulfillment +12 + customer +4 + age -8 = 16
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFulfillmentStatus: "Unfulfilled",
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(16);
    expect(row.factors).toContain("Order not fulfilled");
  });

  it("partially_paid normalizes and adds +10 (not treated as paid)", () => {
    // base 10 + 0 + 10 - 2 + 4 - 8 = 14
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "PARTIALLY_PAID",
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(14);
    expect(row.factors).toContain("Payment only partially settled");
  });

  it("Pending payment adds paymentReviewRiskDelta", () => {
    // base 10 + 0 + 14 - 2 + 4 - 8 = 18
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(18);
    expect(row.factors).toContain("Payment still pending");
  });

  it("first-time customer (1 prior order) adds newCustomerRiskDelta - 2", () => {
    // base 10 + 0 - 2 - 2 + 14 + (-8 with 2024-01-01 acct) = 12
    const [row] = buildRiskOrders(
      [
        makeOrder({
          customer: {
            displayName: "Bob",
            email: "bob@example.com",
            numberOfOrders: "1",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(12);
    expect(row.factors).toContain("First-time customer");
  });

  it("trusted customer (10–19 orders) gets -6", () => {
    // base 10 + 0 - 2 - 2 - 6 - 8 = -8 → clamped to 8
    const [row] = buildRiskOrders(
      [
        makeOrder({
          customer: {
            displayName: "Carol",
            email: "carol@example.com",
            numberOfOrders: "12",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(8);
    expect(row.factors).toContain("Trusted customer (10–19 prior orders)");
  });

  it("VIP customer (20+) gets -10", () => {
    // base 10 + 0 - 2 - 2 - 10 - 8 = -12 → clamped to 8
    const [row] = buildRiskOrders(
      [
        makeOrder({
          customer: {
            displayName: "VIP",
            email: "vip@example.com",
            numberOfOrders: "30",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(8);
    expect(row.factors).toContain("VIP customer (20+ prior orders)");
  });

  it("guest checkout treated as +newCustomerRiskDelta and unknown account age", () => {
    // base 10 + 0 - 2 - 2 + 16 + 6 = 28
    const [row] = buildRiskOrders(
      [
        makeOrder({
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.customer).toBe("Guest checkout");
    expect(row.risk).toBe(28);
    expect(row.factors).toContain("Guest checkout — no account history");
    expect(row.factors).toContain("Account age unknown");
  });

  it("stacks worst-case factors and clamps at 96", () => {
    // base 10 + 38 + 14 + 12 + 16 + 6 = 96
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "10000", currencyCode: "USD" },
          },
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBeLessThanOrEqual(96);
    expect(row.risk).toBeGreaterThanOrEqual(8);
    expect(row.risk).toBe(96);
  });

  it("recommendation flips at thresholds", () => {
    const [auto] = buildRiskOrders([makeOrder()], SETTINGS, [], []);
    expect(auto.recommendation).toBe("Approve automatically");

    // base 10 + 34 (premium 4–8× = $1500) + 0 (paid) + 12 (unfulfilled)
    // + 16 (guest) + 6 (no age) = 78 → review band
    const [review] = buildRiskOrders(
      [
        makeOrder({
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "1500", currencyCode: "USD" },
          },
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(review.risk).toBeGreaterThanOrEqual(60);
    expect(review.risk).toBeLessThan(80);
    expect(review.recommendation).toBe("Manual review");

    // Extreme value + pending + unfulfilled + guest + null age → 96 clamped
    const [hold] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "10000", currencyCode: "USD" },
          },
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(hold.risk).toBeGreaterThanOrEqual(80);
    expect(hold.recommendation).toBe("Hold refund");
  });

  it("two different orders with shared 'Unfulfilled / high-value / new customer' shape now score differently", () => {
    // Regression for the original bug surfaced by the user: two orders
    // showing identical risk on the dashboard. We use distinct value bucket
    // membership (premium vs extreme) AND distinct customer cohort
    // (first-time vs guest) to assert clear differentiation.
    const [a, b] = buildRiskOrders(
      [
        makeOrder({
          id: "gid://shopify/Order/A",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "1500", currencyCode: "USD" },
          },
          customer: {
            displayName: "First-timer",
            email: "ft@example.com",
            numberOfOrders: "1",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
        makeOrder({
          id: "gid://shopify/Order/B",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "3000", currencyCode: "USD" },
          },
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(a.risk).not.toBe(b.risk);
  });

  it("applies decision from order-level saved decision (returnId null)", () => {
    const decisions: SavedDecisionProjection[] = [
      {
        orderId: "gid://shopify/Order/1",
        returnId: null,
        decision: "approved",
      },
    ];
    const [row] = buildRiskOrders([makeOrder()], SETTINGS, [], decisions);
    expect(row.savedDecision).toBe("approved");
  });

  it("ignores return-specific decisions when building from orders", () => {
    const decisions: SavedDecisionProjection[] = [
      {
        orderId: "gid://shopify/Order/1",
        returnId: "gid://shopify/Return/123",
        decision: "hold",
      },
    ];
    const [row] = buildRiskOrders([makeOrder()], SETTINGS, [], decisions);
    expect(row.savedDecision).toBeNull();
  });
});

describe("narrative generation", () => {
  it("describes the recommendation in plain English", () => {
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "10000", currencyCode: "USD" },
          },
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.narrative).toMatch(/extreme/i);
    expect(row.narrative).toMatch(/guest/i);
    expect(row.narrative).toMatch(/not fulfilled/i);
    expect(row.narrative).toMatch(/hold refund/i);
  });

  it("mentions matched playbooks", () => {
    const [row] = buildRiskOrders(
      [makeOrder()],
      SETTINGS,
      [makePlaybook({ name: "VIP fast-track", action: "approve" })],
      [],
    );
    expect(row.narrative).toMatch(/VIP fast-track/);
  });
});

describe("playbook matching (via buildRiskOrders)", () => {
  it("inactive playbooks are skipped", () => {
    const [row] = buildRiskOrders(
      [makeOrder()],
      SETTINGS,
      [makePlaybook({ isActive: false, action: "hold" })],
      [],
    );
    expect(row.appliedPlaybooks).toEqual([]);
    expect(row.savedDecision).toBeNull();
  });

  it("minOrderValue gates by order value", () => {
    const [low] = buildRiskOrders(
      [makeOrder()],
      SETTINGS,
      [makePlaybook({ minOrderValue: 200, action: "hold" })],
      [],
    );
    expect(low.appliedPlaybooks).toEqual([]);

    const [high] = buildRiskOrders(
      [
        makeOrder({
          currentTotalPriceSet: {
            shopMoney: { amount: "300", currencyCode: "USD" },
          },
        }),
      ],
      SETTINGS,
      [makePlaybook({ minOrderValue: 200, action: "hold" })],
      [],
    );
    expect(high.appliedPlaybooks).toEqual(["Test"]);
    expect(high.savedDecision).toBe("hold");
  });

  it("repeatReturnsThreshold gates by customer order count", () => {
    const [row] = buildRiskOrders(
      [makeOrder()],
      SETTINGS,
      [makePlaybook({ repeatReturnsThreshold: 10, action: "hold" })],
      [],
    );
    expect(row.appliedPlaybooks).toEqual([]);
  });

  it("suspiciousDomainsCsv matches on email domain", () => {
    const [bad] = buildRiskOrders(
      [
        makeOrder({
          customer: {
            displayName: "Mallory",
            email: "mallory@badmail.test",
            numberOfOrders: "3",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [makePlaybook({ suspiciousDomainsCsv: "badmail.test", action: "hold" })],
      [],
    );
    expect(bad.appliedPlaybooks).toEqual(["Test"]);

    const [good] = buildRiskOrders(
      [makeOrder()],
      SETTINGS,
      [makePlaybook({ suspiciousDomainsCsv: "badmail.test", action: "hold" })],
      [],
    );
    expect(good.appliedPlaybooks).toEqual([]);
  });

  it("vipBypassEnabled disables playbook for customers with ≥20 orders", () => {
    const [vip] = buildRiskOrders(
      [
        makeOrder({
          customer: {
            displayName: "VIP",
            email: "vip@example.com",
            numberOfOrders: "25",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [makePlaybook({ vipBypassEnabled: true, action: "hold" })],
      [],
    );
    expect(vip.appliedPlaybooks).toEqual([]);
  });
});

describe("mergeSavedDecisionsOntoRiskOrders", () => {
  it("return-specific decision wins over order-only", () => {
    const [base] = buildRiskOrders([makeOrder()], SETTINGS, [], []);
    const row = {
      ...base,
      returnId: "gid://shopify/Return/9",
      id: "gid://shopify/Return/9",
    };
    const merged = mergeSavedDecisionsOntoRiskOrders(
      [row],
      [
        {
          orderId: row.orderId,
          returnId: null,
          decision: "approved",
        },
        {
          orderId: row.orderId,
          returnId: "gid://shopify/Return/9",
          decision: "hold",
        },
      ],
    );
    expect(merged[0].savedDecision).toBe("hold");
  });

  it("falls back to order-only decision when no return match", () => {
    const [base] = buildRiskOrders([makeOrder()], SETTINGS, [], []);
    const merged = mergeSavedDecisionsOntoRiskOrders(
      [{ ...base, returnId: null }],
      [
        {
          orderId: base.orderId,
          returnId: null,
          decision: "approved",
        },
      ],
    );
    expect(merged[0].savedDecision).toBe("approved");
  });

  it("leaves savedDecision untouched when no DB match", () => {
    const [base] = buildRiskOrders([makeOrder()], SETTINGS, [], []);
    const merged = mergeSavedDecisionsOntoRiskOrders([base], []);
    expect(merged[0].savedDecision).toBeNull();
  });
});

describe("summarizeOrders", () => {
  it("empty list returns zeroed summary with USD default", () => {
    const summary = summarizeOrders([], SETTINGS);
    expect(summary).toMatchObject({
      protectedMargin: 0,
      flaggedGmvTotal: 0,
      reviewCount: 0,
      holdCount: 0,
      autoApprovedCount: 0,
      currencyCode: "USD",
      analyzedOrders: 0,
      confidence: 0,
      detectedOrders: 0,
      totalReturns: 0,
      flaggedReturns: 0,
      approvalRatio: 0,
      averageRiskScore: 0,
      riskSpread: 0,
    });
  });

  it("uses detectedOrders override when provided", () => {
    const summary = summarizeOrders([], SETTINGS, { detectedOrders: 12 });
    expect(summary.detectedOrders).toBe(12);
  });

  it("buckets review and hold counts at thresholds", () => {
    const orders = buildRiskOrders(
      [
        // auto-approve: default low-value order, risk 8
        makeOrder({ id: "gid://shopify/Order/A" }),
        // review band: 1500 USD + Unfulfilled + guest + null age = 78
        makeOrder({
          id: "gid://shopify/Order/B",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "1500", currencyCode: "USD" },
          },
          customer: null,
        }),
        // hold band: extreme + pending + unfulfilled + guest + null age = 96
        makeOrder({
          id: "gid://shopify/Order/C",
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unfulfilled",
          currentTotalPriceSet: {
            shopMoney: { amount: "10000", currencyCode: "USD" },
          },
          customer: null,
        }),
      ],
      SETTINGS,
      [],
      [],
    );

    const summary = summarizeOrders(orders, SETTINGS);
    expect(summary.autoApprovedCount).toBe(1);
    expect(summary.reviewCount).toBe(1);
    expect(summary.holdCount).toBe(1);
    expect(summary.flaggedReturns).toBe(2);
    expect(summary.flaggedGmvTotal).toBeCloseTo(11500, 6);
    expect(summary.protectedMargin).toBeCloseTo(11500 * 0.25, 6);
    expect(summary.analyzedOrders).toBe(3);
    expect(summary.confidence).toBeGreaterThan(0);
    expect(summary.riskSpread).toBeGreaterThan(0);
  });

  it("confidence reflects risk spread — homogeneous scores → higher confidence", () => {
    const homogeneous = summarizeOrders(
      buildRiskOrders(
        [
          makeOrder({ id: "gid://shopify/Order/A" }),
          makeOrder({ id: "gid://shopify/Order/B" }),
          makeOrder({ id: "gid://shopify/Order/C" }),
        ],
        SETTINGS,
        [],
        [],
      ),
      SETTINGS,
    );

    const mixed = summarizeOrders(
      buildRiskOrders(
        [
          makeOrder({ id: "gid://shopify/Order/A" }),
          makeOrder({
            id: "gid://shopify/Order/B",
            displayFinancialStatus: "Pending",
            displayFulfillmentStatus: "Unfulfilled",
            currentTotalPriceSet: {
              shopMoney: { amount: "10000", currencyCode: "USD" },
            },
            customer: null,
          }),
          makeOrder({
            id: "gid://shopify/Order/C",
            currentTotalPriceSet: {
              shopMoney: { amount: "800", currencyCode: "USD" },
            },
          }),
        ],
        SETTINGS,
        [],
        [],
      ),
      SETTINGS,
    );

    expect(homogeneous.confidence).toBeGreaterThan(mixed.confidence);
    expect(mixed.riskSpread).toBeGreaterThan(homogeneous.riskSpread);
  });

  it("approvalRatio reflects savedDecision==='approved' fraction", () => {
    const orders = buildRiskOrders(
      [
        makeOrder({ id: "gid://shopify/Order/A" }),
        makeOrder({ id: "gid://shopify/Order/B" }),
      ],
      SETTINGS,
      [],
      [
        {
          orderId: "gid://shopify/Order/A",
          returnId: null,
          decision: "approved",
        },
      ],
    );
    const summary = summarizeOrders(orders, SETTINGS);
    expect(summary.approvalRatio).toBe(50);
  });
});
