import { beforeEach, expect, it, vi } from "vitest";
import { action, headers, loader } from "../routes/app.billing";
import { authenticate } from "../shopify.server";
import {
  resolveBillingIsTestForShop,
  checkActiveSubscription,
  invalidateSubscriptionCache,
} from "../models/billing.server";
import { PLAN_GROWTH } from "../billing/plans";

vi.mock("../shopify.server", () => ({ authenticate: { admin: vi.fn() } }));
vi.mock("../models/billing.server", () => ({
  resolveBillingIsTestForShop: vi.fn(),
  checkActiveSubscription: vi.fn(),
  invalidateSubscriptionCache: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveBillingIsTestForShop).mockResolvedValue(true);
});

it("passes the billing confirmation 401 and its redirect headers through", async () => {
  const handoff = new Response(null, {
    status: 401,
    headers: {
      "X-Shopify-API-Request-Failure-Reauthorize-Url":
        "https://admin.shopify.com/confirmation",
    },
  });
  vi.mocked(authenticate.admin).mockResolvedValue({
    billing: { request: vi.fn().mockRejectedValue(handoff) },
    session: { shop: "test.myshopify.com" },
    admin: {},
  } as never);
  vi.stubEnv("SHOPIFY_API_KEY", "test-key");
  try {
    const request = new Request("https://app.test/app/billing", {
      method: "POST",
      body: new URLSearchParams({ intent: "subscribe", plan: PLAN_GROWTH }),
    });
    await expect(action({ request, params: {}, context: {} })).rejects.toBe(
      handoff,
    );
    const forwarded = headers({
      parentHeaders: new Headers(),
      loaderHeaders: new Headers(),
      actionHeaders: new Headers(),
      errorHeaders: handoff.headers,
    });
    expect(
      new Headers(forwarded).get(
        "X-Shopify-API-Request-Failure-Reauthorize-Url",
      ),
    ).toBe("https://admin.shopify.com/confirmation");
    expect(invalidateSubscriptionCache).toHaveBeenCalledWith(
      "test.myshopify.com",
    );
  } finally {
    vi.unstubAllEnvs();
  }
});

it("does not swallow an authentication response while checking the current plan", async () => {
  const handoff = new Response(null, { status: 401 });
  vi.mocked(authenticate.admin).mockResolvedValue({
    billing: {},
    session: { shop: "test.myshopify.com" },
    admin: {},
  } as never);
  vi.mocked(checkActiveSubscription).mockRejectedValue(handoff);
  await expect(
    loader({
      request: new Request("https://app.test/app/billing"),
      params: {},
      context: {},
    }),
  ).rejects.toBe(handoff);
});
