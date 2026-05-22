/**
 * Build the URL Shopify redirects to after a merchant approves a subscription.
 *
 * Embedded apps require `host` (and usually `embedded=1`) on return — otherwise
 * authenticate.admin() sends the user to /auth/login and billing review fails.
 */
export function buildBillingReturnUrl(request: Request, shop: string): string {
  const incoming = new URL(request.url);
  const returnTo = new URL(`${incoming.origin}/app/billing`);
  returnTo.searchParams.set("shop", shop);

  const host = incoming.searchParams.get("host");
  if (host) {
    returnTo.searchParams.set("host", host);
  }

  if (incoming.searchParams.get("embedded") === "1") {
    returnTo.searchParams.set("embedded", "1");
  }

  return returnTo.href;
}
