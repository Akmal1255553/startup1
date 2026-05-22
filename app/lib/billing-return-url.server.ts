/**
 * URL Shopify opens after the merchant approves a subscription charge.
 *
 * Must stay on **admin.shopify.com** (embedded app entry). A return to the
 * app's Render origin breaks the iframe session and sends users to /auth/login.
 *
 * Matches the default embedded return URL from @shopify/shopify-api billing.request.
 */
export function buildBillingReturnUrl(shop: string, apiKey: string): string {
  const shopHandle = shop.replace(/\.myshopify\.com$/i, "");
  const key = apiKey.trim();
  if (!key) {
    throw new Error("SHOPIFY_API_KEY is required to build billing return URL");
  }
  return `https://admin.shopify.com/store/${shopHandle}/apps/${key}`;
}
