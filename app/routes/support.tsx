import type { LinksFunction, MetaFunction } from "@remix-run/node";

import { LegalLayout } from "../legal/legal-layout";

export const meta: MetaFunction = () => [
  { title: "Support · ReturnGuard AI" },
  {
    name: "description",
    content:
      "Contact, install help, and troubleshooting guides for ReturnGuard AI on Shopify.",
  },
];

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

export default function SupportPage() {
  return (
    <LegalLayout
      title="Support"
      updated="May 13, 2026"
      intro="ReturnGuard AI is maintained by a small team. We answer support requests on every business day."
    >
      <h2 style={h2}>Contact</h2>
      <p>
        The fastest way to get help is email. Include your{" "}
        <code>store.myshopify.com</code> domain so we can locate your install.
      </p>
      <ul style={ul}>
        <li>
          Email:{" "}
          <a href="mailto:support@returnguard.ai">support@returnguard.ai</a>
        </li>
        <li>Response time: within 1 business day (Mon–Fri).</li>
        <li>Available languages: English, Russian.</li>
      </ul>

      <h2 style={h2}>Common questions</h2>

      <h3 style={h3}>Why does my Returns queue look empty?</h3>
      <p>
        ReturnGuard scores existing Shopify Returns. If your store hasn&apos;t
        had any return requests yet, create a test order, then create a return
        from the order detail page in Shopify Admin. Refresh the queue and the
        return should appear with a risk score. We also pull recent orders for
        scoring even if no return has been opened yet.
      </p>

      <h3 style={h3}>Why are some order details &ldquo;hidden&rdquo;?</h3>
      <p>
        Shopify gates customer and order detail behind{" "}
        <a
          href="https://shopify.dev/docs/apps/launch/protected-customer-data"
          target="_blank"
          rel="noreferrer"
        >
          Protected Customer Data access
        </a>
        . Open Partner Dashboard → your app → Protected Customer Data and
        request the access levels you need. The app will start showing
        customer email, name, and account age once Shopify approves the
        request and you reinstall the app on your store.
      </p>

      <h3 style={h3}>How do plan limits work?</h3>
      <p>
        ReturnGuard includes a <strong>Free</strong> tier: risk scoring, the
        returns queue, saving moderation decisions, CSV export, and risk
        settings. Paid plans add larger queue pages, automation playbooks, bulk
        actions, the audit log, and longer analytics windows. The in-app Billing
        page lists exact limits; you can switch plans any time and Shopify
        prorates the change.
      </p>

      <h3 style={h3}>How do I cancel?</h3>
      <p>
        Open the Billing page in the app and use{" "}
        <em>Cancel subscription</em>. The plan is cancelled in Shopify with
        proration; if you uninstall the app, your subscription is also
        cancelled automatically and we delete your store data within 48 hours
        per Shopify&apos;s GDPR requirements.
      </p>

      <h3 style={h3}>The Billing button shows &ldquo;Apps without a public distribution cannot use the Billing API&rdquo;.</h3>
      <p>
        This is a Shopify-side restriction. The app needs to be set to
        Public Distribution in Partner Dashboard before Shopify will let it
        charge merchants — even on development stores. The app then keeps
        working on Custom-installed stores too.
      </p>

      <h2 style={h2}>Status</h2>
      <p>
        ReturnGuard AI runs on Render with a managed Postgres database. If
        you&apos;re seeing a 5xx error or hung loads, please email us with the
        timestamp and your store domain so we can correlate logs.
      </p>

      <h2 style={h2}>Data and privacy</h2>
      <p>
        See our <a href="/privacy">Privacy Policy</a> for what we collect,
        where it&apos;s stored, and how to request deletion. Uninstalling the
        app from your store automatically triggers Shopify&apos;s{" "}
        <code>shop/redact</code> webhook, which removes all of your store data
        from our database within 48 hours.
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

const h3: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 600,
  marginTop: 20,
  marginBottom: 8,
};

const ul: React.CSSProperties = {
  paddingLeft: 22,
  margin: "0 0 12px",
};
