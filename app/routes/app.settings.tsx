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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const [settings, capabilities] = await Promise.all([
    getRiskSettings(session.shop),
    loadCapabilities(billing),
  ]);
  return { settings, capabilities };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
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
      shopify.toast.show("Risk settings saved");
    }
  }, [actionData, shopify.toast]);

  return (
    <Page
      title="Risk Settings"
      subtitle="Tune ReturnGuard to match your refund policy and support capacity"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <TitleBar title="Risk Settings" />
      <Form method="post">
        <BlockStack gap="500">
          {settingsLocked ? (
            <Banner
              title="Risk settings can be saved only on a paid plan"
              tone="warning"
              action={{ content: "Open billing", url: "/app/billing" }}
            >
              <p>
                You're on {capabilities.planLabel}. Saving thresholds and
                signal weights requires Starter, Growth, or Scale.
              </p>
            </Banner>
          ) : null}

          {actionData && actionData.ok ? (
            <Card>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success" toneAndProgressLabelOverride=" ">
                  Saved
                </Badge>
                <Text as="p" variant="bodyMd">
                  Risk settings were updated.
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
                Decision thresholds
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <SettingField
                  label="Manual review risk threshold"
                  name={undefined}
                  value={reviewThreshold}
                  onChange={(value) => setReviewThreshold(Number(value) || 0)}
                  helpText="Orders at or above this score enter the review queue."
                />
                <SettingField
                  label="Refund hold risk threshold"
                  name={undefined}
                  value={holdThreshold}
                  onChange={(value) => setHoldThreshold(Number(value) || 0)}
                  helpText="Orders at or above this score should be paused before refunding."
                />
                <SettingField
                  label="Medium order value"
                  name="mediumValueThreshold"
                  value={settings.mediumValueThreshold}
                  onChange={() => {}}
                  prefix="$"
                />
                <SettingField
                  label="High order value"
                  name="highValueThreshold"
                  value={settings.highValueThreshold}
                  onChange={() => {}}
                  prefix="$"
                />
              </InlineGrid>
              <RangeSlider
                label="Manual review threshold"
                value={reviewThreshold}
                min={10}
                max={95}
                output
                onChange={(value) =>
                  setReviewThreshold(Array.isArray(value) ? value[0] : value)
                }
              />
              <RangeSlider
                label="Hold threshold"
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
                Risk signal weights
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <SettingField
                  label="New customer risk delta"
                  name="newCustomerRiskDelta"
                  value={settings.newCustomerRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label="Repeat customer risk delta"
                  name="repeatCustomerRiskDelta"
                  value={settings.repeatCustomerRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label="Unfulfilled order risk delta"
                  name="unfulfilledRiskDelta"
                  value={settings.unfulfilledRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label="Payment review risk delta"
                  name="paymentReviewRiskDelta"
                  value={settings.paymentReviewRiskDelta}
                  onChange={() => {}}
                />
                <SettingField
                  label="Protected margin multiplier"
                  name="protectedMarginMultiplier"
                  value={settings.protectedMarginMultiplier}
                  onChange={() => {}}
                  helpText="Example: 0.25 means ReturnGuard estimates 25% of flagged GMV as margin at risk."
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
              Save settings
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
