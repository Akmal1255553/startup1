import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { LanguageSwitcherMarketing } from "../../components/language-switcher-marketing";
import { useI18n } from "../../i18n/i18n-context";
import { getLandingCopy } from "../../i18n/messages/landing";
import { type Locale, toMarketingLocale } from "../../i18n/types";
import { resolveLocale } from "../../i18n/resolver.server";
import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const locale = (data?.locale as Locale | undefined) ?? "en";
  const L = getLandingCopy(toMarketingLocale(locale));
  return [
    { title: L.metaTitle },
    { name: "description", content: L.metaDescription },
  ];
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
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
  },
];

export const headers: HeadersFunction = () => ({
  // Avoid stale HTML on CDNs after deploys (language UI lives in document markup).
  "Cache-Control": "public, max-age=0, s-maxage=120, must-revalidate",
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  const locale = await resolveLocale(request);

  return json({
    showForm: Boolean(login),
    locale,
  });
};

export default function Index() {
  const { showForm } = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  const L = getLandingCopy(toMarketingLocale(locale));

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main navigation">
          <div className={styles.navStart}>
            <a className={styles.brand} href="/">
              <span className={styles.brandMark} aria-hidden="true" />
              <span className={styles.brandText}>ReturnGuard AI</span>
            </a>
            <span className={styles.navLangWrap}>
              <LanguageSwitcherMarketing
                locale={locale}
                langLabel={L.langLabel}
                redirectPath="/"
              />
            </span>
          </div>
          <div className={styles.navLinks}>
            <a className={styles.navItem} href="#product">
              {L.navProduct}
            </a>
            <a className={styles.navItem} href="#workflow">
              {L.navWorkflow}
            </a>
            <a className={styles.navItem} href="#install">
              {L.navInstall}
            </a>
            <a className={styles.navItem} href="/privacy">
              {L.navPrivacy}
            </a>
            <a className={styles.navItem} href="/support">
              {L.navSupport}
            </a>
            <a className={styles.navCta} href="#demo">
              {L.navPreview}
            </a>
          </div>
        </nav>
      </header>

      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroBg} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{L.heroEyebrow}</p>
              <h1 id="hero-heading" className={styles.heroTitle}>
                {L.heroTitle}
              </h1>
              <p className={styles.lede}>{L.heroLede}</p>

              {showForm ? (
                <Form
                  className={styles.inlineForm}
                  method="post"
                  action="/auth/login"
                  id="install"
                >
                  <label className={styles.srOnly} htmlFor="shop-domain">
                    {L.labelStoreDomain}
                  </label>
                  <input
                    id="shop-domain"
                    className={styles.inlineInput}
                    type="text"
                    name="shop"
                    required
                    placeholder={L.placeholderShop}
                    autoComplete="url"
                  />
                  <button className={styles.btnPrimary} type="submit">
                    {L.btnInstall}
                  </button>
                </Form>
              ) : (
                <p className={styles.ledeMuted}>{L.installDisabled}</p>
              )}

              {showForm ? (
                <div className={styles.ctaRow}>
                  <a className={styles.btnGhost} href="#demo">
                    {L.btnSeeInterface}
                  </a>
                </div>
              ) : null}

              <ul className={styles.trustChips}>
                <li>{L.chipEmbedded}</li>
                <li>{L.chipQueue}</li>
                <li>{L.chipAudit}</li>
              </ul>
            </div>

            <div
              className={styles.mockFrame}
              id="demo"
              aria-label={L.mockAria}
            >
              <div className={styles.mockChrome}>
                <span className={styles.mockDot} />
                <span className={styles.mockDot} />
                <span className={styles.mockDot} />
                <span className={styles.mockUrl}>{L.mockUrl}</span>
              </div>
              <div className={styles.mockBody}>
                <div className={styles.mockToolbar}>
                  <div>
                    <p className={styles.mockLabel}>{L.mockReturnsQueue}</p>
                    <p className={styles.mockTitle}>{L.mockToday}</p>
                  </div>
                  <span className={styles.mockBadge}>{L.mockLiveSync}</span>
                </div>
                <div className={styles.mockHeroStat}>
                  <div>
                    <p className={styles.mockLabel}>{L.mockPortfolioRisk}</p>
                    <p className={styles.mockScore}>87</p>
                    <p className={styles.mockSub}>{L.mockWeighted}</p>
                  </div>
                  <div className={styles.mockRing} aria-hidden="true" />
                </div>
                <div className={styles.mockTable}>
                  <div className={styles.mockRow}>
                    <span className={styles.mockCellMain}>
                      <strong>#RMA-1048</strong>
                      <span className={styles.mockMuted}>Order #4812</span>
                    </span>
                    <span className={styles.mockTagHigh}>{L.mockHighRisk}</span>
                  </div>
                  <div className={styles.mockRow}>
                    <span className={styles.mockCellMain}>
                      <strong>#RMA-1031</strong>
                      <span className={styles.mockMuted}>Order #4798</span>
                    </span>
                    <span className={styles.mockTagMid}>{L.mockReview}</span>
                  </div>
                  <div className={styles.mockRow}>
                    <span className={styles.mockCellMain}>
                      <strong>#RMA-1026</strong>
                      <span className={styles.mockMuted}>Order #4791</span>
                    </span>
                    <span className={styles.mockTagOk}>{L.mockApproved}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.metricsBand} aria-label={L.metricsAria}>
          <div className={styles.metricsInner}>
            {L.metrics.map((m) => (
              <div className={styles.metricCard} key={m.label}>
                <strong className={styles.metricValue}>{m.value}</strong>
                <span className={styles.metricLabel}>{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section} id="product" aria-labelledby="feat-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{L.platformEyebrow}</p>
            <h2 id="feat-heading" className={styles.sectionTitle}>
              {L.featTitle}
            </h2>
            <p className={styles.sectionLead}>{L.featLead}</p>
          </div>
          <div className={styles.featureGrid}>
            {L.features.map((f) => (
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
              <p className={styles.eyebrow}>{L.workflowEyebrow}</p>
              <h2 id="workflow-heading" className={styles.sectionTitle}>
                {L.workflowTitle}
              </h2>
            </div>
            <ol className={styles.steps}>
              {L.steps.map((s) => (
                <li className={styles.step} key={s.n}>
                  <span className={styles.stepNum}>{s.n}</span>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepText}>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.ctaBand} aria-labelledby="cta-heading">
          <div className={styles.ctaInner}>
            <h2 id="cta-heading" className={styles.ctaTitle}>
              {L.ctaTitle}
            </h2>
            <p className={styles.ctaLead}>{L.ctaLead}</p>
            {showForm ? (
              <div className={styles.ctaActions}>
                <a className={styles.btnPrimaryInverse} href="#install">
                  {L.btnInstallCta}
                </a>
                <a className={styles.btnLinkLight} href="#product">
                  {L.btnExplore}
                </a>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <span className={styles.footerBrand}>ReturnGuard AI</span>
            <LanguageSwitcherMarketing
              locale={locale}
              langLabel={L.langLabel}
              redirectPath="/"
              variant="footer"
            />
          </div>
          <div className={styles.footerLinks}>
            <a className={styles.footerLink} href="/privacy">
              {L.footerPrivacy}
            </a>
            <a className={styles.footerLink} href="/support">
              {L.footerSupport}
            </a>
            <span className={styles.footerNote}>{L.footerNote}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
