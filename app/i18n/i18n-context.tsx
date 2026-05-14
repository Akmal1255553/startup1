import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Locale } from "./types";
import { getAppShellMessages } from "./messages/app-shell";

export type I18nContextValue = {
  locale: Locale;
  app: ReturnType<typeof getAppShellMessages>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, app: getAppShellMessages(locale) }),
    [locale],
  );
  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
