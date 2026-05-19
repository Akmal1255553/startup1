import { describe, expect, it } from "vitest";

import { normalizeShopDomain } from "./shop-domain.server";

describe("normalizeShopDomain", () => {
  it("passes through a valid myshopify host", () => {
    expect(normalizeShopDomain("store-fbugaeho.myshopify.com")).toBe(
      "store-fbugaeho.myshopify.com",
    );
  });

  it("adds myshopify.com when only the store handle is given", () => {
    expect(normalizeShopDomain("store-fbugaeho")).toBe(
      "store-fbugaeho.myshopify.com",
    );
  });

  it("strips protocol and path", () => {
    expect(
      normalizeShopDomain("https://store-fbugaeho.myshopify.com/admin"),
    ).toBe("store-fbugaeho.myshopify.com");
  });

  it("lowercases and trims", () => {
    expect(normalizeShopDomain("  Store-Fbugaeho.myshopify.com  ")).toBe(
      "store-fbugaeho.myshopify.com",
    );
  });
});
