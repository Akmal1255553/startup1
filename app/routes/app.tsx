import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Box, InlineStack } from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { LanguageSwitcherApp } from "../components/language-switcher-app";
import { useI18n } from "../i18n/i18n-context";
import { getPolarisI18n } from "../i18n/polaris-locale";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  const { locale, app } = useI18n();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={getPolarisI18n(locale)}>
      <Box paddingInline="400" paddingBlockStart="300" paddingBlockEnd="200">
        <InlineStack align="end">
          <LanguageSwitcherApp />
        </InlineStack>
      </Box>
      <NavMenu>
        <Link to="/app" rel="home" prefetch="intent">
          {app.navDashboard}
        </Link>
        <Link to="/app/onboarding" prefetch="intent">
          {app.navGetStarted}
        </Link>
        <Link to="/app/returns" prefetch="intent">
          {app.navReturns}
        </Link>
        <Link to="/app/analytics" prefetch="intent">
          {app.navAnalytics}
        </Link>
        <Link to="/app/audit-log" prefetch="intent">
          {app.navAudit}
        </Link>
        <Link to="/app/playbooks" prefetch="intent">
          {app.navPlaybooks}
        </Link>
        <Link to="/app/settings" prefetch="intent">
          {app.navSettings}
        </Link>
        <Link to="/app/billing" prefetch="intent">
          {app.navBilling}
        </Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
