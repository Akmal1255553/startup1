import { LanguageSwitcherMarketing } from "./language-switcher-marketing";
import type { Locale } from "../i18n/types";

export function LanguageSwitcherLegal({
  locale,
  langLabel,
  redirectPath,
}: {
  locale: Locale;
  langLabel: string;
  redirectPath: string;
}) {
  return (
    <LanguageSwitcherMarketing
      locale={locale}
      langLabel={langLabel}
      redirectPath={redirectPath}
      variant="footer"
    />
  );
}
