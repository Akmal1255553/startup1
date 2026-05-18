import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import {
  localeCookie,
  sanitizeInternalRedirect,
} from "../i18n/locale-cookie.server";
import {
  persistShopLocale,
  shopFromInternalPath,
  shopFromRequestUrl,
} from "../i18n/shop-locale.server";
import { isLocale } from "../i18n/types";
import { authenticate } from "../shopify.server";

/**
 * Sets `rg_locale` cookie and redirects back (same-origin path only).
 * For embedded /app routes also persists locale on the shop session in DB
 * (cookies are unreliable inside the Shopify admin iframe).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const target = sanitizeInternalRedirect(url.searchParams.get("redirect"));
  const lng = url.searchParams.get("lng") ?? "en";

  if (!isLocale(lng)) {
    return redirect(target);
  }

  let shop = shopFromRequestUrl(url) ?? shopFromInternalPath(target);

  if (!shop && target.startsWith("/app")) {
    try {
      const { session } = await authenticate.admin(request);
      shop = session.shop;
    } catch {
      // Not in an authenticated embedded context.
    }
  }

  if (shop) {
    await persistShopLocale(shop, lng);
  }

  return redirect(target, {
    headers: {
      "Set-Cookie": await localeCookie.serialize(lng),
    },
  });
};
