import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { LanguageSwitcherLegal } from "../components/language-switcher-legal";
import { LegalLayout } from "../legal/legal-layout";
import { getLandingCopy } from "../i18n/messages/landing";
import { resolveLocale } from "../i18n/resolver.server";
import { toMarketingLocale } from "../i18n/types";

export const meta: MetaFunction = () => [
  { title: "Privacy Policy · ReturnGuard AI" },
  {
    name: "description",
    content:
      "How ReturnGuard AI collects, uses, and protects Shopify store data and customer information.",
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = await resolveLocale(request);
  return json({ locale });
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
  },
];

export default function PrivacyPage() {
  const { locale } = useLoaderData<typeof loader>();
  const L = getLandingCopy(toMarketingLocale(locale));

  return (
    <LegalLayout
      title="Privacy Policy"
      updated="May 13, 2026"
      intro="ReturnGuard AI is a Shopify app that helps merchants score, review, and decide on customer return requests. This policy explains what data we receive from Shopify on a merchant's behalf, how we use it, and how we delete it."
      privacyLabel={L.navPrivacy}
      supportLabel={L.navSupport}
      headerExtra={
        <LanguageSwitcherLegal
          locale={locale}
          langLabel={L.langLabel}
          redirectPath="/privacy"
        />
      }
    >
      <h2 style={h2}>1. Who this policy applies to</h2>
      <p>
        This policy applies to Shopify merchants (the &quot;Merchant&quot;) who install
        ReturnGuard AI on their store, and to the end customers of those
        Merchants whose order and return information is processed by
        ReturnGuard AI as part of operating the merchant&apos;s returns workflow.
      </p>

      <h2 style={h2}>2. What we collect from Shopify</h2>
      <p>
        When a Merchant installs ReturnGuard AI, they grant the following
        Shopify access scopes: <code>read_orders</code>,{" "}
        <code>read_returns</code>, <code>read_products</code>, and{" "}
        <code>read_customers</code>. Through Shopify&apos;s Admin GraphQL API we
        receive:
      </p>
      <ul style={ul}>
        <li>Orders (id, name, status, totals, currency, created_at).</li>
        <li>Return requests and their state changes.</li>
        <li>Product titles and identifiers referenced by orders/returns.</li>
        <li>
          Customer aggregate information (display name, order count, account
          age, optional email) — only as needed to compute return risk.
        </li>
        <li>Shop identifier (e.g. <code>store.myshopify.com</code>).</li>
      </ul>
      <p>
        We do <strong>not</strong> ask for, collect, or store payment card
        data, social security or government-issued IDs, biometrics, or
        passwords.
      </p>

      <h2 style={h2}>3. What we collect from merchants directly</h2>
      <ul style={ul}>
        <li>
          Decisions you make in the app (approve / review / hold), tied to
          orders and returns.
        </li>
        <li>
          Playbook rules, risk thresholds, and other configuration you set up
          inside the app.
        </li>
        <li>
          Subscription status and billing identifiers returned by Shopify
          Billing API.
        </li>
        <li>
          Webhook payloads sent by Shopify (orders, refunds, returns, GDPR
          compliance events) for audit purposes.
        </li>
      </ul>

      <h2 style={h2}>4. How we use this data</h2>
      <ul style={ul}>
        <li>To compute a risk score and recommended action for each return.</li>
        <li>To present a returns queue, audit log, and dashboards.</li>
        <li>
          To execute the automation rules (&quot;playbooks&quot;) you
          configure.
        </li>
        <li>
          To enforce subscription plan limits returned by Shopify Billing.
        </li>
        <li>
          To respond to support requests you initiate. We never sell or rent
          merchant or customer data, and we don&apos;t use it to train any
          third-party AI model.
        </li>
      </ul>

      <h2 style={h2}>5. Data storage and security</h2>
      <p>
        Data is stored in a managed PostgreSQL database hosted in the European
        Union and accessed over TLS. Access to production data is limited to
        the maintainers of ReturnGuard AI. Webhook payloads are stored
        truncated (max ~16 KB per event) and only for audit/debug purposes.
      </p>

      <h2 style={h2}>6. Data retention and deletion</h2>
      <p>
        ReturnGuard AI honors Shopify&apos;s mandatory GDPR webhooks:
      </p>
      <ul style={ul}>
        <li>
          <strong>shop/redact</strong> — when a Merchant uninstalls the app,
          we delete all return decisions, playbooks, risk settings, webhook
          logs, and onboarding state associated with that shop within 48
          hours, as required by Shopify.
        </li>
        <li>
          <strong>customers/redact</strong> — we delete return decisions and
          decision events scoped to the customer&apos;s orders listed in the
          payload.
        </li>
        <li>
          <strong>customers/data_request</strong> — we forward the request to
          the merchant so they can fulfill the customer&apos;s data export. We
          do not store customer profile rows independently of orders.
        </li>
      </ul>
      <p>
        Merchants can additionally request manual deletion of their data at
        any time by emailing{" "}
        <a href="mailto:supportreturnguard.ai@gmail.com">
          supportreturnguard.ai@gmail.com
        </a>
        .
      </p>

      <h2 style={h2}>7. Sub-processors</h2>
      <p>
        We rely on the following sub-processors to operate the service:
      </p>
      <ul style={ul}>
        <li>Shopify Inc. — auth, billing, and source of merchant data.</li>
        <li>Render (Render Services Inc.) — application hosting.</li>
        <li>Supabase (Supabase Inc.) — managed PostgreSQL database.</li>
      </ul>

      <h2 style={h2}>8. Children</h2>
      <p>
        ReturnGuard AI is a B2B tool for Shopify merchants and is not directed
        to children under 16.
      </p>

      <h2 style={h2}>9. Changes</h2>
      <p>
        We may update this policy. Material changes will be highlighted on
        this page and on the merchant&apos;s dashboard inside the app.
      </p>

      <h2 style={h2}>10. Contact</h2>
      <p>
        Questions or requests can be sent to{" "}
        <a href="mailto:supportreturnguard.ai@gmail.com">
          supportreturnguard.ai@gmail.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}

const h2: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontWeight: 600,
  fontSize: 22,
  marginTop: 32,
  marginBottom: 12,
  color: "#0d1117",
};

const ul: React.CSSProperties = {
  paddingLeft: 22,
  margin: "0 0 12px",
};
