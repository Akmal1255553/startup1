import { describe, expect, it } from "vitest";

import { PLAN_GROWTH, PLAN_STARTER } from "../billing/plans";
import { summarizeActiveSubscription } from "./billing.server";

describe("summarizeActiveSubscription", () => {
  it("returns inactive summary when Shopify reports no active payment", () => {
    const summary = summarizeActiveSubscription({
      hasActivePayment: false,
      appSubscriptions: [],
    });
    expect(summary).toEqual({
      hasActivePayment: false,
      activePlan: null,
      subscriptionId: null,
      isTest: false,
    });
  });

  it("maps first appSubscription to known plan id", () => {
    const summary = summarizeActiveSubscription({
      hasActivePayment: true,
      appSubscriptions: [
        { id: "gid://shopify/AppSubscription/1", name: PLAN_GROWTH, test: true },
      ],
    });
    expect(summary).toEqual({
      hasActivePayment: true,
      activePlan: PLAN_GROWTH,
      subscriptionId: "gid://shopify/AppSubscription/1",
      isTest: true,
    });
  });

  it("ignores unknown plan names but keeps subscriptionId", () => {
    const summary = summarizeActiveSubscription({
      hasActivePayment: true,
      appSubscriptions: [
        { id: "gid://shopify/AppSubscription/2", name: "Mystery" },
      ],
    });
    expect(summary.activePlan).toBeNull();
    expect(summary.subscriptionId).toBe("gid://shopify/AppSubscription/2");
    expect(summary.isTest).toBe(false);
  });

  it("treats missing test flag as live", () => {
    const summary = summarizeActiveSubscription({
      hasActivePayment: true,
      appSubscriptions: [
        { id: "id", name: PLAN_STARTER },
      ],
    });
    expect(summary.isTest).toBe(false);
  });
});
