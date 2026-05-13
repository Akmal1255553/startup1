import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";

import { authenticate } from "../shopify.server";
import {
  PLANS,
  type PlanDescriptor,
  type PlanId,
  isKnownPlanId,
} from "../billing/plans";
import {
  BILLING_TEST_MODE,
  KNOWN_PLAN_IDS,
  summarizeActiveSubscription,
} from "../models/billing.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);

  const checkResult = await billing.check({
    plans: KNOWN_PLAN_IDS,
    isTest: BILLING_TEST_MODE,
  });

  const subscription = summarizeActiveSubscription(checkResult);

  return {
    plans: PLANS,
    activePlan: subscription.activePlan,
    hasActivePayment: subscription.hasActivePayment,
    subscriptionId: subscription.subscriptionId,
    isTestMode: BILLING_TEST_MODE,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent === "subscribe") {
    const requestedPlan = String(formData.get("plan") || "");
    if (!isKnownPlanId(requestedPlan)) {
      return { ok: false, error: "Unknown plan." };
    }

    const url = new URL(request.url);
    const returnUrl = `${url.origin}/app/billing?shop=${encodeURIComponent(session.shop)}`;

    try {
      // billing.request always throws a Remix redirect / App Bridge response,
      // never resolves — do not convert that throw into JSON or the button looks “dead”.
      await billing.request({
        plan: requestedPlan,
        isTest: BILLING_TEST_MODE,
        returnUrl,
      });
    } catch (error) {
      // Preserve Remix redirects and App Bridge billing handoff responses.
      if (error instanceof Response) {
        throw error;
      }
      return {
        ok: false,
        error: formatBillingError(error, requestedPlan),
      };
    }
    return { ok: false, error: "Unexpected billing state." };
  }

  if (intent === "cancel") {
    const subscriptionId = String(formData.get("subscriptionId") || "");
    if (!subscriptionId) {
      return { ok: false, error: "Missing subscription id." };
    }

    try {
      await billing.cancel({
        subscriptionId,
        isTest: BILLING_TEST_MODE,
        prorate: true,
      });
      return { ok: true, cancelled: true };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not cancel subscription.",
      };
    }
  }

  return { ok: false, error: "Unknown intent." };
};

/**
 * Shopify's BillingError wraps a generic "Error while billing the store"
 * message and stashes the real GraphQL userErrors / errors in `errorData`.
 * Pull those out so the merchant can see *why* the charge was refused
 * (most often: test-mode mismatch between app config and store type).
 */
function formatBillingError(error: unknown, planId: string): string {
  if (!(error instanceof Error)) {
    return "Could not start subscription request.";
  }
  const errorData = (error as Error & { errorData?: unknown }).errorData;
  const detail = stringifyBillingErrorData(errorData);
  const hint =
    detail && /test|development/i.test(detail)
      ? " Tip: development stores can only accept test charges. Set BILLING_TEST=true in your environment."
      : "";
  if (detail) {
    return `${error.message} (${planId}): ${detail}.${hint}`;
  }
  return `${error.message} (${planId}).${hint}`;
}

function stringifyBillingErrorData(data: unknown): string | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    const messages = data
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const e = entry as { message?: unknown; field?: unknown };
        if (typeof e.message === "string" && e.message) return e.message;
        return null;
      })
      .filter((value): value is string => Boolean(value));
    if (messages.length) return messages.join("; ");
  }
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

export default function BillingPage() {
  const { plans, activePlan, hasActivePayment, subscriptionId, isTestMode } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";
  // Which plan/intent is currently being submitted — used to show
  // a "Confirming…" state on the right card and freeze the others.
  const pendingIntent = navigation.formData?.get("intent") ?? null;
  const pendingPlan =
    pendingIntent === "subscribe"
      ? String(navigation.formData?.get("plan") ?? "")
      : null;
  const errorMessage =
    actionData && "error" in actionData ? actionData.error : null;
  const cancelled =
    actionData && "cancelled" in actionData ? actionData.cancelled : false;

  useEffect(() => {
    if (cancelled) {
      shopify.toast.show("Subscription cancelled");
    }
  }, [cancelled, shopify.toast]);

  return (
    <Page
      title="Billing"
      subtitle="Choose the plan that fits your store's return volume"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <TitleBar title="Billing" />
      <BlockStack gap="500">
        {isTestMode ? (
          <Card>
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                Test mode
              </Badge>
              <Text as="p" variant="bodyMd" tone="subdued">
                Development environment — Shopify Billing is running in test
                mode and will not charge merchants.
              </Text>
            </InlineStack>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card>
            <Text as="p" variant="bodyMd" tone="critical">
              {errorMessage}
            </Text>
          </Card>
        ) : null}

        <CurrentPlanCard
          activePlan={activePlan}
          hasActivePayment={hasActivePayment}
          subscriptionId={subscriptionId}
          isSubmitting={isSubmitting}
        />

        <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              activePlan={activePlan}
              hasActivePayment={hasActivePayment}
              isSubmitting={isSubmitting}
              pendingPlan={pendingPlan}
            />
          ))}
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}

function CurrentPlanCard({
  activePlan,
  hasActivePayment,
  subscriptionId,
  isSubmitting,
}: {
  activePlan: PlanId | null;
  hasActivePayment: boolean;
  subscriptionId: string | null;
  isSubmitting: boolean;
}) {
  const planDescriptor = activePlan
    ? PLANS.find((plan) => plan.id === activePlan)
    : null;

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              Current subscription
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {hasActivePayment && planDescriptor
                ? `${planDescriptor.name} — $${planDescriptor.monthlyPrice}/month`
                : "No active paid plan. ReturnGuard runs in trial mode."}
            </Text>
          </BlockStack>
          {hasActivePayment ? (
            <Badge tone="success" toneAndProgressLabelOverride=" ">
              Active
            </Badge>
          ) : (
            <Badge tone="attention" toneAndProgressLabelOverride=" ">
              Trial
            </Badge>
          )}
        </InlineStack>

        {hasActivePayment && subscriptionId ? (
          <Form
            method="post"
            onSubmit={(event) => {
              if (!window.confirm("Cancel current subscription?")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="cancel" />
            <input
              type="hidden"
              name="subscriptionId"
              value={subscriptionId}
            />
            <Button
              submit
              tone="critical"
              variant="tertiary"
              loading={isSubmitting}
            >
              Cancel subscription
            </Button>
          </Form>
        ) : null}
      </BlockStack>
    </Card>
  );
}

function PlanCard({
  plan,
  activePlan,
  hasActivePayment,
  isSubmitting,
  pendingPlan,
}: {
  plan: PlanDescriptor;
  activePlan: PlanId | null;
  hasActivePayment: boolean;
  isSubmitting: boolean;
  pendingPlan: string | null;
}) {
  const isCurrent = hasActivePayment && plan.id === activePlan;
  const isPending = pendingPlan === plan.id;
  // While one card is being submitted, freeze the other cards so the
  // merchant can't double-spend on a second plan mid-flow.
  const isFrozen = isSubmitting && !isPending;

  const buttonLabel = isPending
    ? "Confirming…"
    : hasActivePayment
      ? "Switch to this plan"
      : "Start free trial";

  return (
    <Card
      background={isCurrent ? "bg-surface-success" : isPending ? "bg-surface-selected" : undefined}
    >
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" gap="200">
          <Text as="h3" variant="headingMd">
            {plan.name}
          </Text>
          <InlineStack gap="100">
            {isCurrent ? (
              <Badge tone="success" toneAndProgressLabelOverride=" ">
                Current plan
              </Badge>
            ) : isPending ? (
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                Selecting…
              </Badge>
            ) : plan.recommended ? (
              <Badge tone="success" toneAndProgressLabelOverride=" ">
                Recommended
              </Badge>
            ) : null}
          </InlineStack>
        </InlineStack>

        <Text as="p" variant="bodySm" tone="subdued">
          {plan.tagline}
        </Text>

        <InlineStack gap="100" blockAlign="baseline">
          <Text as="p" variant="heading2xl">
            ${plan.monthlyPrice}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            / month
          </Text>
        </InlineStack>

        <Text as="span" variant="bodySm" tone="subdued">
          {plan.trialDays}-day free trial
        </Text>

        <Box paddingBlockStart="200">
          <List type="bullet" gap="extraTight">
            {plan.features.map((feature) => (
              <List.Item key={feature}>{feature}</List.Item>
            ))}
          </List>
        </Box>

        <Box paddingBlockStart="300">
          {isCurrent ? (
            <Button disabled fullWidth>
              Current plan
            </Button>
          ) : (
            <Form method="post">
              <input type="hidden" name="intent" value="subscribe" />
              <input type="hidden" name="plan" value={plan.id} />
              <Button
                submit
                variant={plan.recommended ? "primary" : "secondary"}
                fullWidth
                loading={isPending}
                disabled={isFrozen}
              >
                {buttonLabel}
              </Button>
            </Form>
          )}
        </Box>
      </BlockStack>
    </Card>
  );
}
