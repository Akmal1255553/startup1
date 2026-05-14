import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { localeCookie, sanitizeInternalRedirect } from "../i18n/locale-cookie.server";
import { isLocale } from "../i18n/types";

/**
 * Sets `rg_locale` cookie and redirects back (same-origin path only).
 * Used by embedded app and marketing site language pickers.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const target = sanitizeInternalRedirect(url.searchParams.get("redirect"));
  const lng = url.searchParams.get("lng") ?? "en";

  if (!isLocale(lng)) {
    return redirect(target);
  }

  return redirect(target, {
    headers: {
      "Set-Cookie": await localeCookie.serialize(lng),
    },
  });
};
