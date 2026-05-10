import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const meta: MetaFunction = () => [
  { title: "ReturnGuard AI | Professional returns intelligence for Shopify" },
  {
    name: "description",
    content:
      "ReturnGuard AI gives Shopify teams a premium risk desk for return decisions, fraud signals, and margin protection.",
  },
];

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
  {
    value: "31%",
    label: "fewer risky refunds",
    detail: "Automated checks surface refund abuse before approval.",
  },
  {
    value: "4.8h",
    label: "saved per week",
    detail: "Support teams resolve repetitive reviews with guided context.",
  },
  {
    value: "92%",
    label: "auto-triaged cases",
    detail: "Clean returns keep moving while exceptions get escalated.",
  },
];

const signals = [
  {
    title: "Behavioral risk scoring",
    text: "Combines return velocity, refund value, SKU mix, and order history into a clear risk score.",
  },
  {
    title: "Decision-ready evidence",
    text: "Every case includes the signals, confidence level, and recommended next action for support teams.",
  },
  {
    title: "Shopify-native workflow",
    text: "Built for operators who need fast context without switching tabs or rebuilding policies.",
  },
];

const workflow = [
  ["01", "Intake", "New returns enter a monitored queue with order and customer history."],
  ["02", "Score", "The model classifies anomalies and explains the strongest risk drivers."],
  ["03", "Act", "Teams approve, review, or escalate with a consistent audit trail."],
];

const trustItems = [
  "Embedded Shopify app",
  "Policy-aware automation",
  "Ops-ready reporting",
];

export default function Index() {
  const { devStore, showForm } = useLoaderData<typeof loader>();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <nav className={styles.nav} aria-label="Main navigation">
          <a className={styles.brand} href="/">
            <span className={styles.brandMark}>RG</span>
            <span>ReturnGuard AI</span>
          </a>
          <div className={styles.navActions}>
            <a className={styles.navLink} href="#platform">
              Platform
            </a>
            <a className={styles.navButton} href="#demo">
              View risk desk
            </a>
          </div>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Shopify returns intelligence</p>
            <h1>Protect profit from returns without slowing support.</h1>
            <p className={styles.lede}>
              ReturnGuard AI gives ecommerce teams a polished risk desk for
              refund abuse, exception handling, and decision-ready evidence
              inside Shopify.
            </p>

            {showForm && (
              <div className={styles.formStack}>
                <div className={styles.ctaRow}>
                  <a
                    className={styles.buttonLink}
                    href={`/auth/login?shop=${devStore}`}
                  >
                    Launch dev store
                  </a>
                  <a className={styles.secondaryLink} href="#platform">
                    Explore platform
                  </a>
                </div>
                <Form
                  className={styles.form}
                  method="post"
                  action="/auth/login"
                >
                  <label className={styles.label}>
                    <span>Shopify development store</span>
                    <input
                      className={styles.input}
                      type="text"
                      name="shop"
                      defaultValue={devStore}
                      placeholder="your-store.myshopify.com"
                      autoComplete="url"
                    />
                  </label>
                  <button className={styles.button} type="submit">
                    Open another store
                  </button>
                </Form>
              </div>
            )}

            <ul className={styles.trustList}>
              {trustItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div
            className={styles.productVisual}
            id="demo"
            aria-label="Product preview"
          >
            <div className={styles.browserBar}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.visualBody}>
              <div className={styles.previewHeader}>
                <div>
                  <p>ReturnGuard command center</p>
                  <strong>Risk queue</strong>
                </div>
                <span className={styles.statusPill}>Live scoring</span>
              </div>

              <div className={styles.scorePanel}>
                <div>
                  <span>Return risk score</span>
                  <strong>87</strong>
                  <p>High confidence anomaly detected</p>
                </div>
                <div className={styles.ring} aria-hidden="true" />
              </div>

              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <span>Signal strength</span>
                  <strong>Repeat returns</strong>
                </div>
                <div className={styles.insightCard}>
                  <span>Recommended action</span>
                  <strong>Manual review</strong>
                </div>
              </div>

              <div className={styles.caseList}>
                <div className={styles.caseRow}>
                  <div>
                    <span>Order #1048</span>
                    <small>Luxury jacket, third return this month</small>
                  </div>
                  <strong>High risk</strong>
                </div>
                <div className={styles.caseRow}>
                  <div>
                    <span>Order #1031</span>
                    <small>Mismatch between order value and return reason</small>
                  </div>
                  <strong>Review</strong>
                </div>
                <div className={styles.caseRow}>
                  <div>
                    <span>Order #1026</span>
                    <small>Trusted customer history and clean policy fit</small>
                  </div>
                  <strong className={styles.approved}>Approved</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Business outcomes">
        {metrics.map((metric) => (
          <div className={styles.metric} key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <p>{metric.detail}</p>
          </div>
        ))}
      </section>

      <section className={styles.signalSection} id="platform">
        <div>
          <p className={styles.eyebrow}>Executive-grade risk operations</p>
          <h2>A refined workspace for every return decision.</h2>
        </div>
        <div className={styles.signalGrid}>
          {signals.map((signal) => (
            <article className={styles.signal} key={signal.title}>
              <span />
              <h3>{signal.title}</h3>
              <p>{signal.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.workflowSection}>
        <div className={styles.sectionIntro}>
          <p className={styles.eyebrow}>How it works</p>
          <h2>From return request to confident resolution.</h2>
        </div>
        <div className={styles.workflowGrid}>
          {workflow.map(([step, title, text]) => (
            <article className={styles.workflowCard} key={title}>
              <span>{step}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div>
          <p className={styles.eyebrow}>Ready for cleaner returns?</p>
          <h2>Turn refund reviews into a professional risk operation.</h2>
        </div>
        {showForm && (
          <a className={styles.buttonLink} href={`/auth/login?shop=${devStore}`}>
            Open ReturnGuard AI
          </a>
        )}
      </section>
    </main>
  );
}
