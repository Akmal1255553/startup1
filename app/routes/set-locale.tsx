import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import {
  localeCookie,
  sanitizeInternalRedirect,
} from "../i18n/locale-cookie.server";
import {
  persistShopLocale,
  shopFromInternalPath,
  shopFromRequestUrl,
} from "../i18n/shop-locale.server";
import { isLocale, type Locale } from "../i18n/types";
import { authenticate } from "../shopify.server";

async function applyLocale(
  request: Request,
  lng: Locale,
  target: string,
  shopOverride?: string | null,
): Promise<{ headers: Headers }> {
  let shop =
    shopOverride?.trim() ||
    shopFromRequestUrl(new URL(request.url)) ||
    shopFromInternalPath(target);

  if (!shop && target.startsWith("/app")) {
    try {
      const { session } = await authenticate.admin(request);
      shop = session.shop;
    } catch {
      // Embedded fetcher requests include shop in the form body.
    }
  }

  if (shop) {
    await persistShopLocale(shop, lng);
  }

  const headers = new Headers();
  headers.append("Set-Cookie", await localeCookie.serialize(lng));
  return { headers };
}

/**
 * Sets `rg_locale` cookie and redirects back (same-origin path only).
 * Marketing/legal pages use GET + redirect. Embedded app uses POST + JSON
 * so the iframe never navigates away (avoids Shopify re-login).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const target = sanitizeInternalRedirect(formData.get("redirect")?.toString() ?? "/");
  const rawLng = formData.get("lng")?.toString() ?? "en";
  const formShop = formData.get("shop")?.toString()?.trim();

  if (!isLocale(rawLng)) {
    return json({ ok: false as const }, { status: 400 });
  }

  const { headers } = await applyLocale(request, rawLng, target, formShop);
  return json({ ok: true as const, locale: rawLng }, { headers });
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const target = sanitizeInternalRedirect(url.searchParams.get("redirect"));
  const lng = url.searchParams.get("lng") ?? "en";

  if (!isLocale(lng)) {
    return redirect(target);
  }

  const { headers } = await applyLocale(request, lng, target);
  return redirect(target, { headers });
};
