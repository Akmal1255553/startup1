import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: vi.fn(),
  },
}));

import { authenticate } from "../shopify.server";
import {
  authenticateWebhookOrResponse,
  isWebhookAuthResponse,
} from "./shopify-webhook.server";

describe("authenticateWebhookOrResponse", () => {
  beforeEach(() => {
    vi.mocked(authenticate.webhook).mockReset();
  });

  it("returns 405 for non-POST", async () => {
    const res = await authenticateWebhookOrResponse(
      new Request("https://example.com/webhooks/shop/redact", { method: "GET" }),
    );
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(405);
    expect(authenticate.webhook).not.toHaveBeenCalled();
  });

  it("returns thrown 401 Response from authenticate.webhook", async () => {
    vi.mocked(authenticate.webhook).mockRejectedValue(
      new Response("Unauthorized", { status: 401 }),
    );
    const res = await authenticateWebhookOrResponse(
      new Request("https://example.com/webhooks/shop/redact", { method: "POST" }),
    );
    expect(isWebhookAuthResponse(res)).toBe(true);
    expect((res as Response).status).toBe(401);
  });

  it("returns 401 when authenticate.webhook throws a generic Error", async () => {
    vi.mocked(authenticate.webhook).mockRejectedValue(new Error("bad hmac"));
    const res = await authenticateWebhookOrResponse(
      new Request("https://example.com/webhooks/shop/redact", { method: "POST" }),
    );
    expect((res as Response).status).toBe(401);
  });

  it("returns webhook context on success", async () => {
    const ctx = { shop: "test.myshopify.com", topic: "SHOP_REDACT", payload: {} };
    vi.mocked(authenticate.webhook).mockResolvedValue(ctx as never);
    const res = await authenticateWebhookOrResponse(
      new Request("https://example.com/webhooks/shop/redact", { method: "POST" }),
    );
    expect(isWebhookAuthResponse(res)).toBe(false);
    expect(res).toEqual(ctx);
  });
});
