import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { I18nProvider } from "./i18n/i18n-context";
import { readLocaleCookie } from "./i18n/locale-cookie.server";
import { resolveLocale } from "./i18n/resolver.server";
import { readShopLocale, shopFromRequestUrl } from "./i18n/shop-locale.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Webhooks: skip session/DB locale work so HMAC failures return 401 quickly.
  if (url.pathname.startsWith("/webhooks")) {
    return json({ locale: "en" as const });
  }

  let authenticatedShop: string | undefined;
  let sessionLocale: string | null | undefined;

  // Avoid authenticate.admin here — app routes already auth once; a second
  // round-trip per page load slowed the embedded UI and was unnecessary for locale.
  if (url.pathname.startsWith("/app")) {
    const cookieLocale = await readLocaleCookie(request.headers.get("Cookie"));
    if (!cookieLocale) {
      authenticatedShop = shopFromRequestUrl(url) ?? undefined;
      if (authenticatedShop) {
        try {
          sessionLocale = await readShopLocale(authenticatedShop);
        } catch (error) {
          console.error("[ReturnGuard] readShopLocale failed", error);
        }
      }
    }
  }

  const locale = await resolveLocale(request, {
    authenticatedShop,
    sessionLocale,
  });
  return json({ locale });
};

export default function App() {
  const { locale } = useLoaderData<typeof loader>();

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          <Outlet />
        </I18nProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
