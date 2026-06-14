import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Locale } from "./types";
import { getAppPagesMessages } from "./messages/app";
import { getAppShellMessages } from "./messages/app-shell";
import { getDashboardMessages } from "./messages/dashboard";

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  app: ReturnType<typeof getAppShellMessages>;
  dashboard: ReturnType<typeof getDashboardMessages>;
  pages: ReturnType<typeof getAppPagesMessages>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale ?? "en");

  useEffect(() => {
    if (initialLocale) {
      setLocale(initialLocale);
    }
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
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
