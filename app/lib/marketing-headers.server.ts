import type { HeadersFunction } from "@remix-run/node";

/** Prevent CDN from serving one locale HTML to all visitors (cookie must vary). */
export const marketingHeaders: HeadersFunction = () => ({
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  Vary: "Cookie",
});
