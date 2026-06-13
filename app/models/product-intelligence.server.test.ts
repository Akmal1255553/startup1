import { describe, expect, it } from "vitest";

import { categorizeReturnReason } from "./product-return-reasons";
import { buildProductRecommendations } from "./product-recommendations.server";
import {
  calculateProductRiskScore,
  finalizeProductRow,
  returnRateRiskLevel,
} from "./product-risk-score.server";
import type { ProductReturnRow } from "./product-intelligence.types";

const copy = {
  sizingTitle: "Add sizing guidance",
  sizingMessage: "Add a size guide and sizing recommendations.",
  notAsDescribedTitle: "Improve product accuracy",
  notAsDescribedMessage: "Improve product images and product description.",
  damagedTitle: "Review fulfillment quality",
  damagedMessage: "Review packaging process and shipping carrier quality.",
  underperformingTitle: "Review underperforming product",
  underperformingMessage: (title: string, delta: number) =>
    `${title} is ${delta}% above store average.`,
};

function makeProduct(
  overrides: Partial<ProductReturnRow> = {},
): ProductReturnRow {
  return finalizeProductRow(
    {
      productId: "gid://shopify/Product/1",
      productTitle: "Hoodie XL",
      sku: "HD-XL",
      ordersCount: 120,
      returnsCount: 35,
      returnRate: 29,
      revenueLost: 1250,
      customerComplaints: 2,
      reasonBreakdown: {
        sizing: 20,
        damaged: 5,
        notAsDescribed: 4,
        changedMind: 3,
        lateDelivery: 2,
        other: 1,
      },
      returnTrend: [],
      currencyCode: "USD",
      ...overrides,
    },
    2000,
  );
}

describe("categorizeReturnReason", () => {
  it("maps sizing reasons", () => {
    expect(
      categorizeReturnReason({ returnReason: "SIZE_TOO_SMALL" }),
    ).toBe("sizing");
    expect(
      categorizeReturnReason({ reasonHandle: "too-large" }),
    ).toBe("sizing");
  });

  it("maps damaged reasons", () => {
    expect(
      categorizeReturnReason({ reasonHandle: "defective" }),
    ).toBe("damaged");
  });
});

describe("returnRateRiskLevel", () => {
  it("uses low, medium, and high thresholds", () => {
    expect(returnRateRiskLevel(5)).toBe("low");
    expect(returnRateRiskLevel(15)).toBe("medium");
    expect(returnRateRiskLevel(25)).toBe("high");
  });
});

describe("calculateProductRiskScore", () => {
  it("returns a bounded score", () => {
    const score = calculateProductRiskScore({
      returnRate: 30,
      returnsCount: 35,
      ordersCount: 120,
      revenueLost: 1250,
      maxRevenueLost: 2000,
      customerComplaints: 3,
    });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("buildProductRecommendations", () => {
  it("creates sizing recommendation when sizing dominates", () => {
    const product = makeProduct();
    const recommendations = buildProductRecommendations([product], 10, copy);
    expect(
      recommendations.some((item) => item.id.endsWith("-sizing")),
    ).toBe(true);
  });

  it("flags underperforming products above store average", () => {
    const product = makeProduct({ returnRate: 30 });
    const recommendations = buildProductRecommendations([product], 10, copy);
    expect(
      recommendations.some((item) => item.id.endsWith("-underperforming")),
    ).toBe(true);
  });
});
