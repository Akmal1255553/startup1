import type { CSSProperties } from "react";

import {
  LOCALE_LABELS,
  toMarketingLocale,
  type Locale,
  type MarketingLocale,
} from "../i18n/types";

function setLocaleHref(lng: MarketingLocale, redirectPath: string) {
  const redirect = encodeURIComponent(redirectPath);
  return `/set-locale?lng=${lng}&redirect=${redirect}`;
}

const seg: CSSProperties = {
  display: "inline-flex",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  overflow: "hidden",
};

const segLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  fontSize: 13,
  fontWeight: 600,
  color: "#4b5563",
  textDecoration: "none",
  borderRight: "1px solid #e5e7eb",
};

const segLinkLast: CSSProperties = {
  ...segLink,
  borderRight: "none",
};

const segActive: CSSProperties = {
  ...segLink,
  color: "#064038",
  background: "rgb(10 92 82 / 0.1)",
  pointerEvents: "none",
};

export function LanguageSwitcherLegal({
  locale,
  langLabel,
  redirectPath,
}: {
  locale: Locale;
  langLabel: string;
  redirectPath: string;
}) {
  const current = toMarketingLocale(locale);
  const marketingLocales: MarketingLocale[] = ["en", "ru"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px 10px",
      }}
      role="group"
      aria-label={langLabel}
    >
      <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 600 }}>
        {langLabel}
      </span>
      <span style={seg}>
        {marketingLocales.map((id, i) => {
          const isLast = i === marketingLocales.length - 1;
          const isActive = current === id;
          return (
            <a
              key={id}
              href={setLocaleHref(id, redirectPath)}
              style={
                isActive
                  ? isLast
                    ? { ...segActive, borderRight: "none" }
                    : segActive
                  : isLast
                    ? segLinkLast
                    : segLink
              }
              aria-current={isActive ? "true" : undefined}
            >
              {LOCALE_LABELS[id]}
            </a>
          );
        })}
      </span>
    </div>
  );
}
