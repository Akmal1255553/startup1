/**
 * Normalize merchant input into a *.myshopify.com hostname (no protocol/path).
 */
export function normalizeShopDomain(raw: string): string {
  let shop = raw.trim().toLowerCase();
  shop = shop.replace(/^https?:\/\//, "");
  shop = shop.replace(/\/.*$/, "");
  shop = shop.replace(/\s+/g, "");
  if (!shop) return "";
  if (!shop.includes(".")) {
    shop = `${shop}.myshopify.com`;
  }
  return shop;
}
