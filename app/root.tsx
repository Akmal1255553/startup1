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
import { resolveLocale } from "./i18n/resolver.server";
import { authenticate } from "./shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Webhooks: skip session/DB locale work so HMAC failures return 401 quickly.
  if (url.pathname.startsWith("/webhooks")) {
    return json({ locale: "en" as const });
  }

  let authenticatedShop: string | undefined;
  let sessionLocale: string | null | undefined;

  if (url.pathname.startsWith("/app")) {
    try {
      const { session } = await authenticate.admin(request);
      authenticatedShop = session.shop;
      sessionLocale = session.locale ?? null;
    } catch {
      // Public / unauthenticated app edge cases fall through.
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
        <I18nProvider locale={locale}>
          <Outlet />
        </I18nProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
