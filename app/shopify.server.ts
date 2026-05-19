import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { billingConfig } from "./models/billing.server";

const isProduction = process.env.NODE_ENV === "production";
const appUrl =
  process.env.SHOPIFY_APP_URL || (isProduction ? "" : "http://localhost:3000");
const apiKey = process.env.SHOPIFY_API_KEY || (isProduction ? "" : "dev-api-key");
const apiSecretKey =
  process.env.SHOPIFY_API_SECRET || (isProduction ? "" : "dev-api-secret");

const shopify = shopifyApp({
  apiKey,
  apiSecretKey,
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: billingConfig,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    expiringOfflineAccessTokens: true,
  },
  // Only for real custom domains (e.g. brand.com), never a full *.myshopify.com URL.
  ...(process.env.SHOP_CUSTOM_DOMAIN &&
  !process.env.SHOP_CUSTOM_DOMAIN.includes("myshopify.com")
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
