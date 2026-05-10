import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const meta: MetaFunction = () => [
  { title: "ReturnGuard AI | Returns intelligence for Shopify" },
  {
    name: "description",
    content:
      "ReturnGuard AI helps Shopify teams flag risky returns, protect margins, and keep refunds moving fast.",
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
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
  },
];

export const headers: HeadersFunction = () => ({
  "Cache-Control": "public, max-age=300, s-maxage=600",
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return {
    devStore: "store-fbugaeho.myshopify.com",
    showForm: Boolean(login),
  };
};

const metrics = [
  ["31%", "Fewer high-risk refunds settled without review"],
  ["4.8h", "Median time saved on triage per merchant / week"],
  ["92%", "Return cases auto-routed with a clear risk band"],
];

const features = [
  {
    title: "Real Shopify returns",
    description:
      "Each row ties to a live Return in Admin—status, line context, and parent order in one place.",
  },
  {
    title: "Explainable risk scoring",
    description:
      "Value, payment state, fulfillment, and customer signals surface as reasons, not a black box.",
  },
  {
    title: "Playbooks that match your policy",
    description:
      "No-code rules for thresholds, repeat patterns, and escalation—without leaving the embedded app.",
  },
  {
    title: "Decision trail & analytics",
    description:
      "Approvals, holds, and reviews are recorded for compliance, coaching, and trending dashboards.",
  },
  {
    title: "Billing-ready plans",
    description:
      "Starter to scale tiers so you can align packaging with how serious the merchant is about refunds.",
  },
  {
    title: "Built for embedded Admin",
    description:
      "Runs where your team already works—Polaris-aligned UI inside Shopify without context switching.",
  },
];

const steps = [
  {
    n: "01",
    title: "Connect & scope",
    text: "Install on your dev or production shop; approvals use standard Shopify OAuth and scopes.",
  },
  {
    n: "02",
    title: "Tune thresholds",
    text: "Adjust review and hold bands, playbook rules, and what “risky” means for your catalog.",
  },
  {
    n: "03",
    title: "Operate the queue",
    text: "Triage returns, log decisions in one click, export or analyze without spreadsheets.",
  },
];

export default function Index() {
  const { devStore, showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <a className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true" />
            <span className={styles.brandText}>ReturnGuard AI</span>
          </a>
          <div className={styles.navLinks}>
            <a className={styles.navItem} href="#product">
              Product
            </a>
            <a className={styles.navItem} href="#workflow">
              Workflow
            </a>
            <a className={styles.navItem} href="#install">
              Install
            </a>
            <a className={styles.navCta} href="#demo">
              View preview
            </a>
          </div>
        </nav>
      </header>

      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroBg} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Shopify · Returns operations</p>
              <h1 id="hero-heading" className={styles.heroTitle}>
                Control refund risk before it hits your margin.
              </h1>
              <p className={styles.lede}>
                ReturnGuard AI brings return requests into a single review
                surface—scored, explainable, and auditable—so finance and
                support stay aligned without leaving Shopify Admin.
              </p>

              {showForm ? (
                <div className={styles.ctaRow}>
                  <a
                    className={styles.btnPrimary}
                    href={`/auth/login?shop=${devStore}`}
                  >
                    Open dev store
                  </a>
                  <a className={styles.btnGhost} href="#demo">
                    See interface
                  </a>
                </div>
              ) : (
                <p className={styles.ledeMuted}>
                  Install flow is disabled in this environment.
                </p>
              )}

              {showForm ? (
                <Form
                  className={styles.inlineForm}
                  method="post"
                  action="/auth/login"
                >
                  <label className={styles.srOnly} htmlFor="shop-domain">
                    Store domain
                  </label>
                  <input
                    id="shop-domain"
                    className={styles.inlineInput}
                    type="text"
                    name="shop"
                    defaultValue={devStore}
                    placeholder="your-store.myshopify.com"
                    autoComplete="url"
                  />
                  <button className={styles.btnSecondary} type="submit">
                    Use another store
                  </button>
                </Form>
              ) : null}

              <ul className={styles.trustChips}>
                <li>Embedded app</li>
                <li>Return-level queue</li>
                <li>Audit-friendly history</li>
              </ul>
            </div>

            <div
              className={styles.mockFrame}
              id="demo"
              aria-label="Product interface preview"
            >
              <div className={styles.mockChrome}>
                <span className={styles.mockDot} />
                <span className={styles.mockDot} />
                <span className={styles.mockDot} />
                <span className={styles.mockUrl}>admin.shopify.com · Returns</span>
              </div>
              <div className={styles.mockBody}>
                <div className={styles.mockToolbar}>
                  <div>
                    <p className={styles.mockLabel}>Returns queue</p>
                    <p className={styles.mockTitle}>Today · 12 open</p>
                  </div>
                  <span className={styles.mockBadge}>Live sync</span>
                </div>
                <div className={styles.mockHeroStat}>
                  <div>
                    <p className={styles.mockLabel}>Portfolio risk index</p>
                    <p className={styles.mockScore}>87</p>
                    <p className={styles.mockSub}>Weighted by value &amp; velocity</p>
                  </div>
                  <div className={styles.mockRing} aria-hidden="true" />
                </div>
                <div className={styles.mockTable}>
                  <div className={styles.mockRow}>
                    <span className={styles.mockCellMain}>
                      <strong>#RMA-1048</strong>
                      <span className={styles.mockMuted}>Order #4812</span>
                    </span>
                    <span className={styles.mockTagHigh}>High risk</span>
                  </div>
                  <div className={styles.mockRow}>
                    <span className={styles.mockCellMain}>
                      <strong>#RMA-1031</strong>
                      <span className={styles.mockMuted}>Order #4798</span>
                    </span>
                    <span className={styles.mockTagMid}>Review</span>
                  </div>
                  <div className={styles.mockRow}>
                    <span className={styles.mockCellMain}>
                      <strong>#RMA-1026</strong>
                      <span className={styles.mockMuted}>Order #4791</span>
                    </span>
                    <span className={styles.mockTagOk}>Approved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.metricsBand} aria-label="Outcomes">
          <div className={styles.metricsInner}>
            {metrics.map(([value, label]) => (
              <div className={styles.metricCard} key={label}>
                <strong className={styles.metricValue}>{value}</strong>
                <span className={styles.metricLabel}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="product" aria-labelledby="feat-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Platform</p>
            <h2 id="feat-heading" className={styles.sectionTitle}>
              Everything your team needs to decide faster.
            </h2>
            <p className={styles.sectionLead}>
              Purpose-built for merchants who treat returns as a margin line
              item—not an afterthought.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <article className={styles.featureCard} key={f.title}>
                <span className={styles.featureAccent} aria-hidden="true" />
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureText}>{f.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className={styles.workflow}
          id="workflow"
          aria-labelledby="workflow-heading"
        >
          <div className={styles.workflowInner}>
            <div className={styles.workflowIntro}>
              <p className={styles.eyebrow}>How it works</p>
              <h2 id="workflow-heading" className={styles.sectionTitle}>
                From install to disciplined triage—in three moves.
              </h2>
            </div>
            <ol className={styles.steps}>
              {steps.map((s) => (
                <li className={styles.step} key={s.n}>
                  <span className={styles.stepNum}>{s.n}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.ctaBand} id="install" aria-labelledby="cta-heading">
          <div className={styles.ctaInner}>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              Ready to tighten your return posture?
            </h2>
            <p className={styles.ctaLead}>
              Start on a development store, validate your playbook, then roll out
              to production when your team is aligned.
            </p>
            {showForm ? (
              <div className={styles.ctaActions}>
                <a
                  className={styles.btnPrimaryInverse}
                  href={`/auth/login?shop=${devStore}`}
                >
                  Install on dev store
                </a>
                <a className={styles.btnLinkLight} href="#product">
                  Explore capabilities
                </a>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span className={styles.footerBrand}>ReturnGuard AI</span>
          <div className={styles.footerLinks}>
            <span className={styles.footerNote}>
              Not affiliated with Shopify Inc.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
