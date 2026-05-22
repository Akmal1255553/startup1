import { describe, expect, it } from "vitest";

import { buildBillingReturnUrl } from "./billing-return-url.server";

describe("buildBillingReturnUrl", () => {
  it("returns Shopify Admin embedded app URL (not the app origin)", () => {
    const url = buildBillingReturnUrl(
      "store-fbugaeho.myshopify.com",
      "0b558248ba23abd6861a0a76702f8325",
    );
    expect(url).toBe(
      "https://admin.shopify.com/store/store-fbugaeho/apps/0b558248ba23abd6861a0a76702f8325",
    );
  });

  it("strips .myshopify.com for the store handle", () => {
    const url = buildBillingReturnUrl("test.myshopify.com", "abc");
    expect(url).toBe("https://admin.shopify.com/store/test/apps/abc");
  });
});
