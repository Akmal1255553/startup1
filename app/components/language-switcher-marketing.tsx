import {
  LOCALE_LABELS,
  toMarketingLocale,
  type Locale,
  type MarketingLocale,
} from "../i18n/types";

import styles from "./language-switcher-marketing.module.css";

function setLocaleHref(lng: MarketingLocale, redirectPath: string) {
  const redirect = encodeURIComponent(redirectPath);
  return `/set-locale?lng=${lng}&redirect=${redirect}`;
}

export function LanguageSwitcherMarketing({
  locale,
  langLabel,
  redirectPath = "/",
  variant = "header",
}: {
  locale: Locale;
  langLabel: string;
  redirectPath?: string;
  variant?: "header" | "footer";
}) {
  const current = toMarketingLocale(locale);
  const marketingLocales: MarketingLocale[] = ["en", "ru"];

  return (
    <div
      className={styles.root}
      role="group"
      aria-label={langLabel}
      data-variant={variant}
    >
      <span className={styles.label}>{langLabel}</span>
      <div className={styles.seg}>
        {marketingLocales.map((id) => (
          <a
            key={id}
            href={setLocaleHref(id, redirectPath)}
            className={
              current === id ? `${styles.segLink} ${styles.segActive}` : styles.segLink
            }
            aria-current={current === id ? "true" : undefined}
          >
            {LOCALE_LABELS[id]}
          </a>
        ))}
      </div>
    </div>
  );
}
