import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Page,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";

import { authenticate } from "../shopify.server";
import {
  getRiskSettings,
  updateRiskSettings,
} from "../models/return-risk.server";
import type { RiskSettings } from "../models/return-risk";
import { loadCapabilities } from "../models/plan-gating.server";
import { useI18n } from "../i18n/i18n-context";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const [settings, capabilities] = await Promise.all([
    getRiskSettings(session.shop),
    loadCapabilities(billing, session.shop),
  ]);
  return { settings, capabilities };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing, session.shop);
  if (!capabilities.canSaveSettings) {
    return {
      ok: false as const,
      error: "Risk settings can be saved only on a paid plan.",
    };
  }
  const formData = await request.formData();

  await updateRiskSettings(session.shop, formData);

  return { ok: true as const };
};

export default function SettingsPage() {
  const { settings, capabilities } = useLoaderData<typeof loader>();
  const { pages: { settings: s, common: c } } = useI18n();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const settingsLocked = !capabilities.canSaveSettings;
  const [reviewThreshold, setReviewThreshold] = useState(
    settings.reviewRiskThreshold,
  );
  const [holdThreshold, setHoldThreshold] = useState(settings.holdRiskThreshold);
  const isSaving = navigation.state !== "idle";

  useEffect(() => {
    if (actionData && actionData.ok) {
      shopify.toast.show(s.toastSaved);
    }
  }, [actionData, shopify.toast]);

  return (
    <Page
      title={s.title}
      subtitle={s.subtitle}
      backAction={{ content: c.backDashboard, url: "/app" }}
    >
      <TitleBar title={s.title} />
      <Form method="post">
        <BlockStack gap="500">
          {settingsLocked ? (
            <Banner
              title={s.lockedTitle}
              tone="warning"
              action={{ content: c.openBilling, url: "/app/billing" }}
            >
              <p>{s.lockedBody(capabilities.planLabel)}</p>
            </Banner>
          ) : null}

          {actionData && actionData.ok ? (
            <Card>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success" toneAndProgressLabelOverride=" ">
                  {s.savedBadge}
                </Badge>
                <Text as="p" variant="bodyMd">
                  {s.savedMessage}
                </Text>
              </InlineStack>
            </Card>
          ) : null}

          {actionData && actionData.ok === false ? (
            <Card>
              <Text as="p" variant="bodyMd" tone="critical">
                {actionData.error}
              </Text>
            </Card>
          ) : null}

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {s.sectionThresholds}
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <SettingField
                  label={s.reviewThreshold}
                  name={undefined}
                  value={reviewThreshold}
                  onChange={(value) => setReviewThreshold(Number(value) || 0)}
                  helpText={s.reviewHelp}
                />
                <SettingField
                  label={s.holdThreshold}
                  name={undefined}
                  value={holdThreshold}
                  onChange={(value) => setHoldThreshold(Number(value) || 0)}
                  helpText={s.holdHelp}
                />
                <SettingField
                  label={s.mediumValue}
                  name="mediumValueThreshold"
                  value={settings.mediumValueThreshold}
                  onChange={() => {}}
                  prefix="$"
                />
                <SettingField
                  label={s.highValue}
                  name="highValueThreshold"
                  value={settings.highValueThreshold}
                  onChange={() => {}}
                  prefix="$"
                />
              </InlineGrid>
              <RangeSlider
                label={s.reviewThreshold}
                value={reviewThreshold}
                min={10}
                max={95}
                output
                onChange={(value) =>
                  setReviewThreshold(Array.isArray(value) ? value[0] : value)
                }
              />
              <RangeSlider
                label={s.holdThreshold}
                value={holdThreshold}
                min={20}
                max={99}
                output
                onChange={(value) =>
                  setHoldThreshold(Array.isArray(value) ? value[0] : value)
                }
              />
              <input
                type="hidden"
                name="reviewRiskThreshold"
                value={String(reviewThreshold)}
              />
              <input
                type="hidden"
                name="holdRiskThreshold"
                value={String(holdThreshold)}
              />
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {s.sectionWeights}
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <SettingField
                  label={s.newCustomer}
                  name="newCustomerRiskDelta"
                  value={settings.newCustomerRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label={s.repeatCustomer}
                  name="repeatCustomerRiskDelta"
                  value={settings.repeatCustomerRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label={s.unfulfilled}
                  name="unfulfilledRiskDelta"
                  value={settings.unfulfilledRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label={s.paymentReview}
                  name="paymentReviewRiskDelta"
                  value={settings.paymentReviewRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label={s.marginMultiplier}
                  name="protectedMarginMultiplier"
                  value={settings.protectedMarginMultiplier}
                  onChange={() => {}}
                  helpText={s.marginHelp}
                />
              </InlineGrid>
            </BlockStack>
          </Card>

          <InlineStack align="end">
            <Button
              submit
              variant="primary"
              loading={isSaving}
              disabled={settingsLocked}
            >
              {s.submit}
            </Button>
          </InlineStack>
        </BlockStack>
      </Form>
    </Page>
  );
}

function SettingField({
  helpText,
  label,
  name,
  onChange,
  prefix,
  value,
}: {
  helpText?: string;
  label: string;
  name?: keyof RiskSettings;
  onChange: (value: string) => void;
  prefix?: string;
  value: number;
}) {
  const [fieldValue, setFieldValue] = useState(String(value));

  return (
    <TextField
      autoComplete="off"
      helpText={helpText}
      label={label}
      name={name}
      onChange={(nextValue) => {
        setFieldValue(nextValue);
        onChange(nextValue);
      }}
      prefix={prefix}
      type="number"
      value={fieldValue}
    />
  );
}
