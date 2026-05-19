import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Locale } from "./types";
import { getAppPagesMessages } from "./messages/app";
import { getAppShellMessages } from "./messages/app-shell";
import { getDashboardMessages } from "./messages/dashboard";

export type I18nContextValue = {
  locale: Locale;
  app: ReturnType<typeof getAppShellMessages>;
  dashboard: ReturnType<typeof getDashboardMessages>;
  pages: ReturnType<typeof getAppPagesMessages>;
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
    () => ({
      locale,
      app: getAppShellMessages(locale),
      dashboard: getDashboardMessages(locale),
      pages: getAppPagesMessages(locale),
    }),
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
