import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState } from "react";

import { authenticate } from "../shopify.server";
import {
  getRiskSettings,
  updateRiskSettings,
} from "../models/return-risk.server";
import type { RiskSettings } from "../models/return-risk";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    settings: await getRiskSettings(session.shop),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  await updateRiskSettings(session.shop, formData);

  return { ok: true };
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Page
      title="Risk Settings"
      subtitle="Tune ReturnGuard to match your refund policy and support capacity"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <TitleBar title="Risk Settings" />
      <Form method="post">
        <BlockStack gap="500">
          {actionData?.ok ? (
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

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Decision thresholds
              </Text>
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <SettingField
                  label="Manual review risk threshold"
                  name="reviewRiskThreshold"
                  value={settings.reviewRiskThreshold}
                  helpText="Orders at or above this score enter the review queue."
                />
                <SettingField
                  label="Refund hold risk threshold"
                  name="holdRiskThreshold"
                  value={settings.holdRiskThreshold}
                  helpText="Orders at or above this score should be paused before refunding."
                />
                <SettingField
                  label="Medium order value"
                  name="mediumValueThreshold"
                  value={settings.mediumValueThreshold}
                  prefix="$"
                />
                <SettingField
                  label="High order value"
                  name="highValueThreshold"
                  value={settings.highValueThreshold}
                  prefix="$"
                />
              </InlineGrid>
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
                />
                <SettingField
                  label="Repeat customer risk delta"
                  name="repeatCustomerRiskDelta"
                  value={settings.repeatCustomerRiskDelta}
                />
                <SettingField
                  label="Unfulfilled order risk delta"
                  name="unfulfilledRiskDelta"
                  value={settings.unfulfilledRiskDelta}
                />
                <SettingField
                  label="Payment review risk delta"
                  name="paymentReviewRiskDelta"
                  value={settings.paymentReviewRiskDelta}
                />
                <SettingField
                  label="Protected margin multiplier"
                  name="protectedMarginMultiplier"
                  value={settings.protectedMarginMultiplier}
                  helpText="Example: 0.25 means ReturnGuard estimates 25% of flagged GMV as margin at risk."
                />
              </InlineGrid>
            </BlockStack>
          </Card>

          <InlineStack align="end">
            <Button submit variant="primary">
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
  prefix,
  value,
}: {
  helpText?: string;
  label: string;
  name: keyof RiskSettings;
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
      onChange={setFieldValue}
      prefix={prefix}
      type="number"
      value={fieldValue}
    />
  );
}
