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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Webhooks: skip session/DB locale work so HMAC failures return 401 quickly.
  if (url.pathname.startsWith("/webhooks")) {
    return json({ locale: "en" as const });
  }

  const locale = await resolveLocale(request);
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

// Keep recovery independent of providers and loader data: either can have failed.
export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>ReturnGuard AI — Unable to load</title>
        <Links />
      </head>
      <body>
        <main style={{ maxWidth: 560, margin: "64px auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
          <h1>ReturnGuard AI couldn't load this page</h1>
          <p>Please wait a moment and try again. If you just submitted a change, check its status before submitting it again.</p>
          <button type="button" onClick={() => window.location.replace(window.location.href)}>Try again</button>
          <p>If the problem continues, reopen ReturnGuard AI from Shopify Admin.</p>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
