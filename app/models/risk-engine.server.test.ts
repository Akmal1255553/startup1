import type { Playbook } from "@prisma/client";
import { describe, expect, it } from "vitest";

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
    customer: overrides.customer === undefined
      ? {
          displayName: "Alice",
          email: "alice@example.com",
          numberOfOrders: "3",
          createdAt: "2025-01-01T00:00:00Z",
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

describe("buildRiskOrders / scoreOrder", () => {
  it("low-value paid+fulfilled returning customer ⇒ baseline + Low value reason", () => {
    const [row] = buildRiskOrders(
      [makeOrder()],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(18);
    expect(row.recommendation).toBe("Approve automatically");
    expect(row.factors).toContain("Low order value");
    expect(row.appliedPlaybooks).toEqual([]);
    expect(row.savedDecision).toBeNull();
    expect(row.currencyCode).toBe("USD");
  });

  it("medium-value adds 18 points", () => {
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
    expect(row.risk).toBe(36);
    expect(row.factors).toContain("Medium order value");
  });

  it("high-value adds 34 points", () => {
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
    expect(row.risk).toBe(52);
    expect(row.factors).toContain("High order value");
  });

  it("non-paid + non-fulfilled stacks payment + fulfillment deltas", () => {
    // NB: implementation matches substring "fulfilled", so "Unfulfilled"
    // counterintuitively still contains "fulfilled" and does NOT add the
    // delta. We use "Unknown" here to actually trip the fulfillment branch.
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unknown",
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(18 + 14 + 12);
    expect(row.factors).toEqual(
      expect.arrayContaining([
        "Payment requires review",
        "Order not fulfilled",
      ]),
    );
  });

  it('"Unfulfilled" string keeps fulfillment delta off (current substring rule)', () => {
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unfulfilled",
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(18 + 14);
    expect(row.factors).not.toContain("Order not fulfilled");
  });

  it("new customer (≤1 order) adds newCustomerRiskDelta", () => {
    const [row] = buildRiskOrders(
      [
        makeOrder({
          customer: {
            displayName: "Bob",
            email: "bob@example.com",
            numberOfOrders: "1",
            createdAt: "2026-05-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBe(18 + 16);
    expect(row.factors).toContain("New customer");
  });

  it("repeat customer (≥5 orders) adds repeatCustomerRiskDelta", () => {
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
    expect(row.risk).toBe(18 + 12);
    expect(row.factors).toContain("High return/order history");
  });

  it("stacks all high-risk factors and stays within [8, 96]", () => {
    const [row] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unknown",
          currentTotalPriceSet: {
            shopMoney: { amount: "10000", currencyCode: "USD" },
          },
          customer: {
            displayName: "Repeat",
            email: "x@example.com",
            numberOfOrders: "9",
            createdAt: "2024-01-01T00:00:00Z",
            tags: [],
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(row.risk).toBeLessThanOrEqual(96);
    expect(row.risk).toBeGreaterThanOrEqual(8);
    expect(row.risk).toBe(18 + 34 + 14 + 12 + 12);
  });

  it("guest customer treated as 0 orders, no customer delta", () => {
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
    expect(row.risk).toBe(18 + 16);
  });

  it("getRecommendation flips at thresholds", () => {
    const [auto] = buildRiskOrders([makeOrder()], SETTINGS, [], []);
    expect(auto.recommendation).toBe("Approve automatically");

    const [review] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unknown",
          currentTotalPriceSet: {
            shopMoney: { amount: "150", currencyCode: "USD" },
          },
        }),
      ],
      SETTINGS,
      [],
      [],
    );
    expect(review.risk).toBeGreaterThanOrEqual(60);
    expect(review.risk).toBeLessThan(80);
    expect(review.recommendation).toBe("Manual review");

    const [hold] = buildRiskOrders(
      [
        makeOrder({
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unknown",
          currentTotalPriceSet: {
            shopMoney: { amount: "300", currencyCode: "USD" },
          },
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
    expect(hold.risk).toBeGreaterThanOrEqual(80);
    expect(hold.recommendation).toBe("Hold refund");
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
            createdAt: "2025-01-01T00:00:00Z",
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
    });
  });

  it("uses detectedOrders override when provided", () => {
    const summary = summarizeOrders([], SETTINGS, { detectedOrders: 12 });
    expect(summary.detectedOrders).toBe(12);
  });

  it("buckets review and hold counts at thresholds", () => {
    const orders = buildRiskOrders(
      [
        makeOrder({ id: "gid://shopify/Order/A" }),
        makeOrder({
          id: "gid://shopify/Order/B",
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unknown",
          currentTotalPriceSet: {
            shopMoney: { amount: "150", currencyCode: "USD" },
          },
        }),
        makeOrder({
          id: "gid://shopify/Order/C",
          displayFinancialStatus: "Pending",
          displayFulfillmentStatus: "Unknown",
          currentTotalPriceSet: {
            shopMoney: { amount: "300", currencyCode: "USD" },
          },
          customer: {
            displayName: "Repeat",
            email: "r@example.com",
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

    const summary = summarizeOrders(orders, SETTINGS);
    expect(summary.autoApprovedCount).toBe(1);
    expect(summary.reviewCount).toBe(1);
    expect(summary.holdCount).toBe(1);
    expect(summary.flaggedReturns).toBe(2);
    expect(summary.flaggedGmvTotal).toBeCloseTo(450, 6);
    expect(summary.protectedMargin).toBeCloseTo(450 * 0.25, 6);
    expect(summary.analyzedOrders).toBe(3);
    expect(summary.confidence).toBeGreaterThan(0);
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
