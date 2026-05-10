import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
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
    description: "Reduction in fraudulent return approvals",
  },
  {
    value: "4.8h",
    label: "saved per week",
    description: "Time reclaimed by your support team",
  },
  {
    value: "92%",
    label: "auto-triaged",
    description: "Return requests scored without manual review",
  },
];

const features = [
  {
    icon: "⚡",
    title: "Repeat return velocity",
    description:
      "Detect customers with abnormally high return frequency. The model tracks patterns across time windows and flags serial returners before they drain margin.",
  },
  {
    icon: "🎯",
    title: "High-value refund anomalies",
    description:
      "Surface refund requests that deviate from normal order value distributions. Catch outlier amounts that warrant a closer look from your team.",
  },
  {
    icon: "📊",
    title: "Customer history context",
    description:
      "Enrich every return decision with full purchase history, lifetime value, and behavioral signals. Your team sees the complete picture in one view.",
  },
  {
    icon: "🔒",
    title: "No-code fraud rules",
    description:
      "Build custom rule sets without engineering. Combine AI scores with business logic to create policies that match your brand's tolerance for risk.",
  },
  {
    icon: "🔗",
    title: "Native Shopify integration",
    description:
      "Runs directly inside Shopify Admin. No separate dashboard, no context switching. Your team works where they already live.",
  },
  {
    icon: "📈",
    title: "Actionable audit trail",
    description:
      "Every decision comes with a clear confidence score and reasoning chain. Full transparency for your ops team and finance stakeholders.",
  },
];

const steps = [
  {
    number: "01",
    title: "Install in seconds",
    description:
      "Add ReturnGuard AI to your Shopify store with one click. No code changes, no developer needed.",
  },
  {
    number: "02",
    title: "AI scores every return",
    description:
      "Our model analyzes each return request in real-time using order data, customer history, and behavioral signals.",
  },
  {
    number: "03",
    title: "Your team acts with confidence",
    description:
      "High-risk returns get flagged. Low-risk returns auto-approve. Your team focuses only on cases that matter.",
  },
];

export default function Index() {
  const { devStore, showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a className={styles.brand} href="/">
            <span className={styles.brandMark}>RG</span>
            <span className={styles.brandName}>ReturnGuard AI</span>
          </a>
          <div className={styles.navLinks}>
            <a className={styles.navLink} href="#features">
              Features
            </a>
            <a className={styles.navLink} href="#how-it-works">
              How it works
            </a>
            <a className={styles.navLink} href="#demo">
              Demo
            </a>
            <a className={styles.navCta} href="#get-started">
              Get started
            </a>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              Shopify returns intelligence
            </div>
            <h1 className={styles.heroTitle}>
              Stop margin leaks
              <br />
              <span className={styles.heroAccent}>before the refund</span>
              <br />
              is approved.
            </h1>
            <p className={styles.heroLede}>
              ReturnGuard AI scores every return request, highlights suspicious
              behavior, and gives your support team a clear decision trail —
              right inside Shopify Admin.
            </p>
            {showForm && (
              <div className={styles.heroActions}>
                <a
                  className={styles.primaryBtn}
                  href={`/auth/login?shop=${devStore}`}
                >
                  Start free trial
                  <span className={styles.btnArrow}>→</span>
                </a>
                <a className={styles.secondaryBtn} href="#demo">
                  See it in action
                </a>
              </div>
            )}
            <div className={styles.trustRow}>
              <div className={styles.trustItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M13.333 4L6 11.333 2.667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className={styles.trustItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M13.333 4L6 11.333 2.667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>5-minute setup</span>
              </div>
              <div className={styles.trustItem}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M13.333 4L6 11.333 2.667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Built for Shopify</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual} id="demo">
            <div className={styles.visualCard}>
              <div className={styles.browserBar}>
                <div className={styles.browserDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.browserAddress}>
                  admin.shopify.com/store/returnguard
                </div>
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewHeader}>
                  <div>
                    <p className={styles.previewLabel}>Risk queue</p>
                    <strong className={styles.previewTitle}>Today</strong>
                  </div>
                  <span className={styles.statusPill}>
                    <span className={styles.statusDot} />
                    Live
                  </span>
                </div>
                <div className={styles.scorePanel}>
                  <div>
                    <span className={styles.scoreLabel}>Return risk score</span>
                    <strong className={styles.scoreValue}>87</strong>
                  </div>
                  <div className={styles.ring} aria-hidden="true">
                    <span className={styles.ringLabel}>87%</span>
                  </div>
                </div>
                <div className={styles.caseList}>
                  <div className={`${styles.caseRow} ${styles.caseHigh}`}>
                    <div className={styles.caseInfo}>
                      <span className={styles.caseOrder}>Order #1048</span>
                      <span className={styles.caseAmount}>$247.00</span>
                    </div>
                    <span className={styles.caseBadgeHigh}>High risk</span>
                  </div>
                  <div className={`${styles.caseRow} ${styles.caseReview}`}>
                    <div className={styles.caseInfo}>
                      <span className={styles.caseOrder}>Order #1031</span>
                      <span className={styles.caseAmount}>$89.50</span>
                    </div>
                    <span className={styles.caseBadgeReview}>Review</span>
                  </div>
                  <div className={`${styles.caseRow} ${styles.caseApproved}`}>
                    <div className={styles.caseInfo}>
                      <span className={styles.caseOrder}>Order #1026</span>
                      <span className={styles.caseAmount}>$34.99</span>
                    </div>
                    <span className={styles.caseBadgeApproved}>Approved</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.floatingCard} aria-hidden="true">
              <span className={styles.floatingIcon}>🛡️</span>
              <div>
                <strong>$12,400 saved</strong>
                <span>this month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Business outcomes">
        <div className={styles.metricsInner}>
          {metrics.map(({ value, label, description }) => (
            <div className={styles.metricCard} key={label}>
              <strong className={styles.metricValue}>{value}</strong>
              <span className={styles.metricLabel}>{label}</span>
              <p className={styles.metricDesc}>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.features} id="features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Features</span>
            <h2 className={styles.sectionTitle}>
              Signals your team can
              <br />
              act on immediately.
            </h2>
            <p className={styles.sectionDesc}>
              ReturnGuard AI watches dozens of behavioral and transactional
              signals, surfacing the ones that matter most for every return
              request.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {features.map(({ icon, title, description }) => (
              <article className={styles.featureCard} key={title}>
                <div className={styles.featureIcon}>{icon}</div>
                <h3 className={styles.featureTitle}>{title}</h3>
                <p className={styles.featureDesc}>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>How it works</span>
            <h2 className={styles.sectionTitle}>
              From install to insight
              <br />
              in minutes.
            </h2>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map(({ number, title, description }) => (
              <div className={styles.stepCard} key={number}>
                <span className={styles.stepNumber}>{number}</span>
                <h3 className={styles.stepTitle}>{title}</h3>
                <p className={styles.stepDesc}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection} id="get-started">
        <div className={styles.ctaInner}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <h2 className={styles.ctaTitle}>
            Ready to protect your margins?
          </h2>
          <p className={styles.ctaDesc}>
            Join Shopify merchants who use ReturnGuard AI to catch risky
            returns before they hit the bottom line.
          </p>
          {showForm && (
            <div className={styles.ctaActions}>
              <a
                className={styles.primaryBtn}
                href={`/auth/login?shop=${devStore}`}
              >
                Start free trial
                <span className={styles.btnArrow}>→</span>
              </a>
              <Form
                className={styles.ctaForm}
                method="post"
                action="/auth/login"
              >
                <div className={styles.ctaInputGroup}>
                  <input
                    className={styles.ctaInput}
                    type="text"
                    name="shop"
                    defaultValue={devStore}
                    placeholder="your-store.myshopify.com"
                    autoComplete="url"
                  />
                  <button className={styles.ctaSubmit} type="submit">
                    Connect store
                  </button>
                </div>
              </Form>
            </div>
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <a className={styles.brand} href="/">
              <span className={styles.brandMark}>RG</span>
              <span className={styles.brandName}>ReturnGuard AI</span>
            </a>
            <p className={styles.footerTagline}>
              Returns intelligence for Shopify.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#demo">Demo</a>
            <a href="#get-started">Get started</a>
          </div>
          <div className={styles.footerBottom}>
            <span>&copy; {new Date().getFullYear()} ReturnGuard AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
