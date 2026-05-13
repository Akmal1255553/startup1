import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Link,
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
      const payload = formatBillingError(error, requestedPlan);
      return {
        ok: false,
        error: payload.message,
        errorKind: payload.kind,
        shop: session.shop,
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
 * Categorize the BillingError so the UI can show a targeted banner.
 *
 *  - `public-distribution` → app is on Custom distribution. Shopify rejects
 *    Billing API entirely until distribution is set to Public in Partner
 *    Dashboard, even on dev stores in test mode.
 *  - `test-mismatch`       → live store with isTest=true, or dev store with
 *    isTest=false.
 *  - `generic`             → anything else, with errorData appended.
 */
type BillingErrorKind = "public-distribution" | "test-mismatch" | "generic";
type BillingErrorPayload = {
  kind: BillingErrorKind;
  message: string;
  detail: string | null;
};

function formatBillingError(
  error: unknown,
  planId: string,
): BillingErrorPayload {
  if (!(error instanceof Error)) {
    return {
      kind: "generic",
      message: "Could not start subscription request.",
      detail: null,
    };
  }
  const errorData = (error as Error & { errorData?: unknown }).errorData;
  const detail = stringifyBillingErrorData(errorData);
  const merged = `${error.message} ${detail ?? ""}`.toLowerCase();

  if (/public distribution|managed pricing/.test(merged)) {
    return {
      kind: "public-distribution",
      message: detail
        ? `${error.message} (${planId}): ${detail}.`
        : `${error.message} (${planId}).`,
      detail,
    };
  }
  if (/test|development store/.test(merged)) {
    return {
      kind: "test-mismatch",
      message: detail
        ? `${error.message} (${planId}): ${detail}. Set BILLING_TEST=true on Render if you're on a development store, or BILLING_TEST=false on a live store.`
        : `${error.message} (${planId}).`,
      detail,
    };
  }
  return {
    kind: "generic",
    message: detail
      ? `${error.message} (${planId}): ${detail}.`
      : `${error.message} (${planId}).`,
    detail,
  };
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
  const errorKind =
    actionData && "errorKind" in actionData
      ? (actionData as { errorKind?: BillingErrorKind }).errorKind ?? null
      : null;
  const errorShop =
    actionData && "shop" in actionData
      ? (actionData as { shop?: string }).shop ?? null
      : null;
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
          <BillingErrorBanner
            kind={errorKind}
            message={errorMessage}
            shop={errorShop}
          />
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

function BillingErrorBanner({
  kind,
  message,
  shop,
}: {
  kind: BillingErrorKind | null;
  message: string;
  shop: string | null;
}) {
  if (kind === "public-distribution") {
    return (
      <Banner
        title="Billing API requires Public Distribution"
        tone="warning"
      >
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">
            Shopify only lets apps charge merchants through the Billing API
            once they're set to <strong>Public distribution</strong> in the
            Partner Dashboard — even on development stores. Apps on Custom
            distribution must use Managed Pricing instead.
          </Text>
          <Text as="p" variant="bodyMd">
            <strong>Fix it in 30 seconds:</strong>
          </Text>
          <List type="number" gap="extraTight">
            <List.Item>
              Open{" "}
              <Link
                url="https://partners.shopify.com/current/apps"
                target="_blank"
              >
                Partner Dashboard → Apps → ReturnGuard-AI
              </Link>
              .
            </List.Item>
            <List.Item>
              Go to <strong>Distribution</strong> in the left sidebar.
            </List.Item>
            <List.Item>
              Click <strong>Choose distribution</strong> →{" "}
              <strong>Public distribution</strong> → <strong>Save</strong>.
              You don't need to finish the App Store listing yet — Billing API
              starts working as soon as distribution is set.
            </List.Item>
            <List.Item>Come back here and pick a plan again.</List.Item>
          </List>
          <Text as="p" variant="bodySm" tone="subdued">
            Raw error: {message}
          </Text>
          {shop ? (
            <Text as="p" variant="bodySm" tone="subdued">
              Store: {shop}
            </Text>
          ) : null}
        </BlockStack>
      </Banner>
    );
  }

  if (kind === "test-mismatch") {
    return (
      <Banner title="Test-mode mismatch with this store" tone="warning">
        <Text as="p" variant="bodyMd">
          {message}
        </Text>
      </Banner>
    );
  }

  return (
    <Banner title="Could not start subscription" tone="critical">
      <Text as="p" variant="bodyMd">
        {message}
      </Text>
    </Banner>
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
