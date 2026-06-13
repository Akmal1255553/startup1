import { useCallback, useEffect, useState } from "react";
import { useFetcher, useLocation, useRevalidator } from "@remix-run/react";
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

type SetLocaleResponse = { ok: true; locale: string } | { ok: false };

export function LanguageSwitcherApp() {
  const { locale, app } = useI18n();
  const location = useLocation();
  const fetcher = useFetcher<SetLocaleResponse>();
  const revalidator = useRevalidator();
  const [open, setOpen] = useState(false);
  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      revalidator.revalidate();
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  const go = useCallback(
    (lng: string) => {
      setOpen(false);
      const params = new URLSearchParams(location.search);
      const formData = new FormData();
      formData.set("lng", lng);
      formData.set("redirect", `${location.pathname}${location.search}`);
      const shop = params.get("shop");
      if (shop) {
        formData.set("shop", shop);
      }
      fetcher.submit(formData, { method: "post", action: "/set-locale" });
    },
    [fetcher, location.pathname, location.search],
  );

  const activator = (
    <Button
      disclosure="down"
      variant="secondary"
      size="slim"
      loading={isSaving}
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
                disabled: isSaving,
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
