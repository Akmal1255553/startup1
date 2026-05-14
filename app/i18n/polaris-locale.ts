import type { Locale } from "./types";

import polarisDe from "@shopify/polaris/locales/de.json";
import polarisEn from "@shopify/polaris/locales/en.json";
import polarisEs from "@shopify/polaris/locales/es.json";
import polarisFr from "@shopify/polaris/locales/fr.json";
import polarisIt from "@shopify/polaris/locales/it.json";
import polarisJa from "@shopify/polaris/locales/ja.json";
import polarisKo from "@shopify/polaris/locales/ko.json";
import polarisNl from "@shopify/polaris/locales/nl.json";
import polarisPtBr from "@shopify/polaris/locales/pt-BR.json";

/**
 * Polaris has no `ru` bundle — keep English Polaris chrome while app strings
 * use Russian from `app-shell.ts`.
 */
const POLARIS_BY_LOCALE: Record<Locale, typeof polarisEn> = {
  en: polarisEn,
  ru: polarisEn,
  es: polarisEs,
  de: polarisDe,
  fr: polarisFr,
  "pt-BR": polarisPtBr,
  ja: polarisJa,
  it: polarisIt,
  nl: polarisNl,
  ko: polarisKo,
};

export function getPolarisI18n(locale: Locale): typeof polarisEn {
  return POLARIS_BY_LOCALE[locale] ?? polarisEn;
}
