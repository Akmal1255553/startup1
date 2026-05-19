import type { Locale } from "./types";

/** BCP 47 tags for `Intl` date/number formatting. */
export const DATE_LOCALE_BY_APP: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  "pt-BR": "pt-BR",
  ja: "ja-JP",
  it: "it-IT",
  nl: "nl-NL",
  ko: "ko-KR",
};

export function getDateLocale(locale: Locale): string {
  return DATE_LOCALE_BY_APP[locale] ?? "en-US";
}
