export const SUPPORTED_LOCALES = [
  "en",
  "ru",
  "es",
  "de",
  "fr",
  "pt-BR",
  "ja",
  "it",
  "nl",
  "ko",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  de: "Deutsch",
  fr: "Français",
  "pt-BR": "Português (BR)",
  ja: "日本語",
  it: "Italiano",
  nl: "Nederlands",
  ko: "한국어",
};

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Public marketing / legal pages use the same locales as the embedded app. */
export type MarketingLocale = Locale;

export function toMarketingLocale(locale: Locale): MarketingLocale {
  return locale;
}
