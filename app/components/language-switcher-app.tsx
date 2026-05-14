import { useLocation } from "@remix-run/react";
import { Box, InlineStack, Select } from "@shopify/polaris";

import { useI18n } from "../i18n/i18n-context";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../i18n/types";

export function LanguageSwitcherApp() {
  const { locale, app } = useI18n();
  const location = useLocation();
  const redirect = encodeURIComponent(
    `${location.pathname}${location.search}`,
  );

  return (
    <Box minWidth="160px">
      <Select
        label={app.langLabel}
        options={SUPPORTED_LOCALES.map((id) => ({
          label: LOCALE_LABELS[id],
          value: id,
        }))}
        value={locale}
        onChange={(value) => {
          if (!value) return;
          window.location.assign(
            `/set-locale?lng=${encodeURIComponent(value)}&redirect=${redirect}`,
          );
        }}
      />
    </Box>
  );
}

export function LanguageSwitcherAppInline() {
  return (
    <InlineStack align="end" blockAlign="center">
      <LanguageSwitcherApp />
    </InlineStack>
  );
}
