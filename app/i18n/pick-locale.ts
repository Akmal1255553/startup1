import type { Locale } from "./types";

/** Return localized copy for `locale`, falling back to English. */
export function pickByLocale<T>(
  table: Record<Locale, T>,
  locale: Locale,
): T {
  return table[locale] ?? table.en;
}
