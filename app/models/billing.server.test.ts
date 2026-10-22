import { describe, expect, it, vi } from "vitest";

import { PLAN_GROWTH, PLAN_STARTER } from "../billing/plans";
import {
  isDevelopmentShopPlan,
  summarizeActiveSubscription,
  checkActiveSubscription,
  invalidateSubscriptionCache,
  resolveBillingIsTestForShop,
  resolveBillingTestMode,
} from "./billing.server";

it("uses live billing in production even with a legacy test setting", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("BILLING_TEST", "true");
  try {
    expect(resolveBillingTestMode()).toBe(false);
  } finally {
    vi.unstubAllEnvs();
  }
});

describe("billing refresh and authentication", () => {
  it("refreshes a changed plan instead of returning the cached subscription", async () => {
    const billing = {
      check: vi
        .fn()
        .mockResolvedValueOnce({
          hasActivePayment: true,
          appSubscriptions: [{ id: "old", name: PLAN_STARTER }],
        })
        .mockResolvedValue({
          hasActivePayment: true,
          appSubscriptions: [{ id: "new", name: PLAN_GROWTH }],
        }),
    };
    const options = { shop: "refresh.myshopify.com", isTest: true };
    expect((await checkActiveSubscription(billing, options)).activePlan).toBe(
      PLAN_STARTER,
    );
    expect(
      (await checkActiveSubscription(billing, { ...options, fresh: true }))
        .activePlan,
    ).toBe(PLAN_GROWTH);
    expect((await checkActiveSubscription(billing, options)).activePlan).toBe(
      PLAN_GROWTH,
    );
    expect(billing.check).toHaveBeenCalledTimes(2);
    invalidateSubscriptionCache(options.shop);
    await checkActiveSubscription(billing, options);
    expect(billing.check).toHaveBeenCalledTimes(3);
  });

  it("preserves authentication handoffs and does not cache lookup failures", async () => {
    const handoff = new Response(null, { status: 401 });
    const admin = {
      graphql: vi
        .fn()
        .mockRejectedValueOnce(handoff)
        .mockResolvedValueOnce(
          Response.json({
            data: { shop: { plan: { partnerDevelopment: true } } },
          }),
        ),
    };
    await expect(
      resolveBillingIsTestForShop(admin, "auth.myshopify.com"),
    ).rejects.toBe(handoff);
    await expect(
      resolveBillingIsTestForShop(admin, "auth.myshopify.com"),
    ).resolves.toBe(true);
    expect(admin.graphql).toHaveBeenCalledTimes(2);
  });

  it("does not guess a charge mode when Shopify returns GraphQL errors", async () => {
    const admin = {
      graphql: vi
        .fn()
        .mockResolvedValue(
          Response.json({ errors: [{ message: "Unavailable" }] }),
        ),
    };
    await expect(
      resolveBillingIsTestForShop(admin, "error.myshopify.com"),
    ).rejects.toThrow("Unable to verify");
  });
});

describe("isDevelopmentShopPlan", () => {
  it("returns true for partnerDevelopment shops", () => {
    expect(
      isDevelopmentShopPlan({ partnerDevelopment: true, displayName: "Basic" }),
    ).toBe(true);
  });

  it("returns true for Developer Preview display name", () => {
    expect(
      isDevelopmentShopPlan({
        partnerDevelopment: false,
        displayName: "Developer Preview",
      }),
    ).toBe(true);
  });

  it("returns false for a typical live shop plan", () => {
    expect(
      isDevelopmentShopPlan({
        partnerDevelopment: false,
        displayName: "Basic",
      }),
    ).toBe(false);
  });
});

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
        {
          id: "gid://shopify/AppSubscription/1",
          name: PLAN_GROWTH,
          test: true,
        },
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
      appSubscriptions: [{ id: "id", name: PLAN_STARTER }],
    });
    expect(summary.isTest).toBe(false);
  });
});
