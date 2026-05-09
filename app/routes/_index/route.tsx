import type {
  HeadersFunction,
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

/**
 * Public marketing route. No per-user data, no auth — safe to cache.
 * 5 min browser cache, 10 min CDN edge cache.
 */
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
  ["31%", "fewer risky refunds"],
  ["4.8h", "saved per week"],
  ["92%", "auto-triaged cases"],
];

const signals = [
  "Repeat return velocity",
  "High-value refund anomalies",
  "Customer history and order context",
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
          <a className={styles.navLink} href="#demo">
            Live demo
          </a>
        </nav>

        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Shopify returns intelligence</p>
            <h1>Stop margin leaks before the refund is approved.</h1>
            <p className={styles.lede}>
              ReturnGuard AI scores return requests, highlights suspicious
              behavior, and gives support teams a clear decision trail inside
              Shopify Admin.
            </p>

            {showForm && (
              <div className={styles.formStack}>
                <a
                  className={styles.buttonLink}
                  href={`/auth/login?shop=${devStore}`}
                >
                  Open Shopify dev store
                </a>
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
              <li>Embedded Shopify app</li>
              <li>No-code fraud rules</li>
              <li>Built for ops teams</li>
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
            <div className={styles.previewHeader}>
              <div>
                <p>Risk queue</p>
                <strong>Today</strong>
              </div>
              <span className={styles.statusPill}>Live</span>
            </div>
            <div className={styles.scorePanel}>
              <div>
                <span>Return risk score</span>
                <strong>87</strong>
              </div>
              <div className={styles.ring} aria-hidden="true" />
            </div>
            <div className={styles.caseList}>
              <div className={styles.caseRow}>
                <span>Order #1048</span>
                <strong>High risk</strong>
              </div>
              <div className={styles.caseRow}>
                <span>Order #1031</span>
                <strong>Review</strong>
              </div>
              <div className={styles.caseRow}>
                <span>Order #1026</span>
                <strong>Approved</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Business outcomes">
        {metrics.map(([value, label]) => (
          <div className={styles.metric} key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className={styles.signalSection}>
        <div>
          <p className={styles.eyebrow}>What the model watches</p>
          <h2>Signals your team can act on immediately.</h2>
        </div>
        <div className={styles.signalGrid}>
          {signals.map((signal) => (
            <article className={styles.signal} key={signal}>
              <span />
              <h3>{signal}</h3>
              <p>
                Clear context, recommended action, and a confidence score for
                every return request.
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
