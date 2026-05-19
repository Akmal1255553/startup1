import { LOCALE_LABELS, SUPPORTED_LOCALES, type Locale } from "../i18n/types";

import styles from "./language-switcher-marketing.module.css";

function setLocaleHref(lng: Locale, redirectPath: string) {
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
  return (
    <details className={styles.root} data-variant={variant}>
      <summary className={styles.summary} aria-label={langLabel}>
        <span className={styles.label}>{langLabel}</span>
        <span className={styles.current}>{LOCALE_LABELS[locale]}</span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </summary>
      <ul className={styles.menu} role="listbox" aria-label={langLabel}>
        {SUPPORTED_LOCALES.map((id) => (
          <li key={id}>
            <a
              className={
                locale === id ? `${styles.menuLink} ${styles.menuActive}` : styles.menuLink
              }
              href={setLocaleHref(id, redirectPath)}
              hrefLang={id}
              aria-current={locale === id ? "true" : undefined}
            >
              {LOCALE_LABELS[id]}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
