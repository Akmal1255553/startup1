import { describe, expect, it } from "vitest";

import { buildBillingReturnUrl } from "./billing-return-url.server";

describe("buildBillingReturnUrl", () => {
  it("includes shop, host, and embedded for embedded billing return", () => {
    const request = new Request(
      "https://startup1-bu7t.onrender.com/app/billing?shop=test.myshopify.com&host=abc123&embedded=1",
    );
    const url = new URL(buildBillingReturnUrl(request, "test.myshopify.com"));
    expect(url.pathname).toBe("/app/billing");
    expect(url.searchParams.get("shop")).toBe("test.myshopify.com");
    expect(url.searchParams.get("host")).toBe("abc123");
    expect(url.searchParams.get("embedded")).toBe("1");
  });

  it("includes shop only when host is absent", () => {
    const request = new Request(
      "https://startup1-bu7t.onrender.com/app/billing?shop=test.myshopify.com",
    );
    const url = new URL(buildBillingReturnUrl(request, "test.myshopify.com"));
    expect(url.searchParams.get("shop")).toBe("test.myshopify.com");
    expect(url.searchParams.has("host")).toBe(false);
  });
});
