import { useCallback, useState } from "react";
import { useLocation } from "@remix-run/react";
import {
  ActionList,
  Box,
  Button,
  InlineStack,
  Popover,
  Text,
} from "@shopify/polaris";

import { useI18n } from "../i18n/i18n-context";
import { LOCALE_LABELS, SUPPORTED_LOCALES } from "../i18n/types";

export function LanguageSwitcherApp() {
  const { locale, app } = useI18n();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const redirect = encodeURIComponent(
    `${location.pathname}${location.search}`,
  );

  const go = useCallback(
    (lng: string) => {
      setOpen(false);
      const params = new URLSearchParams(location.search);
      const shop = params.get("shop");
      let href = `/set-locale?lng=${encodeURIComponent(lng)}&redirect=${redirect}`;
      if (shop) {
        href += `&shop=${encodeURIComponent(shop)}`;
      }
      window.location.assign(href);
    },
    [redirect, location.search],
  );

  const activator = (
    <Button
      disclosure="down"
      variant="secondary"
      size="slim"
      onClick={() => setOpen((o) => !o)}
      accessibilityLabel={app.langLabel}
    >
      <InlineStack gap="100" blockAlign="center" wrap={false}>
        <Text as="span" variant="bodySm" fontWeight="semibold">
          {LOCALE_LABELS[locale]}
        </Text>
      </InlineStack>
    </Button>
  );

  return (
    <Box minWidth="0">
      <Popover
        active={open}
        activator={activator}
        autofocusTarget="first-node"
        onClose={() => setOpen(false)}
      >
        <Box padding="150" minWidth="220px">
          <Text as="p" variant="bodySm" tone="subdued">
            {app.langLabel}
          </Text>
          <Box paddingBlockStart="200">
            <ActionList
              items={SUPPORTED_LOCALES.map((id) => ({
                content: LOCALE_LABELS[id],
                active: id === locale,
                onAction: () => go(id),
              }))}
            />
          </Box>
        </Box>
      </Popover>
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
