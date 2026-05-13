import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineStack,
  Link,
  List,
  Page,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import {
  ONBOARDING_STEPS,
  type OnboardingProgress,
  type OnboardingStep,
} from "../models/onboarding";
import {
  dismissOnboarding,
  getOnboardingProgress,
  markStepComplete,
  resetOnboarding,
  seedStarterPlaybook,
} from "../models/onboarding.server";

const REQUIRED_SCOPES = [
  "read_orders",
  "read_returns",
  "read_products",
  "read_customers",
] as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const progress = await getOnboardingProgress(session.shop);

  const grantedScopes = (session.scope || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  return {
    progress,
    grantedScopes,
    missingScopes,
    shop: session.shop,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  try {
    switch (intent) {
      case "acknowledge_welcome":
        await markStepComplete(session.shop, "welcome");
        break;
      case "verify_scopes":
        await markStepComplete(session.shop, "scopes");
        break;
      case "seed_playbook":
        await seedStarterPlaybook(session.shop);
        break;
      case "skip_playbook":
        await markStepComplete(session.shop, "playbook");
        break;
      case "acknowledge_settings":
        await markStepComplete(session.shop, "settings");
        break;
      case "dismiss":
        await dismissOnboarding(session.shop);
        return redirect("/app");
      case "reset":
        await resetOnboarding(session.shop);
        return { ok: true, reset: true };
      default:
        return { ok: false, error: "Unknown intent." };
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected onboarding error.",
    };
  }

  const progress = await getOnboardingProgress(session.shop);
  if (progress.completed) {
    return redirect("/app?onboarding=done");
  }
  return { ok: true };
};

export default function OnboardingPage() {
  const { progress, grantedScopes, missingScopes, shop } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";
  const pendingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;

  const errorMessage =
    actionData && "error" in actionData ? actionData.error : null;

  return (
    <Page
      title="Get started with ReturnGuard AI"
      subtitle="Four quick steps to start scoring returns automatically"
      backAction={{ content: "Skip for now", url: "/app" }}
    >
      <TitleBar title="Onboarding" />
      <BlockStack gap="500">
        {errorMessage ? (
          <Banner tone="critical">{errorMessage}</Banner>
        ) : null}

        <OverallProgress progress={progress} shop={shop} />

        <StepCard
          step="welcome"
          progress={progress}
          title="1. Welcome — what ReturnGuard does"
          done={progress.welcomeAcknowledged}
          pending={pendingIntent === "acknowledge_welcome" && isSubmitting}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              ReturnGuard scores every Shopify return as it comes in,
              recommends approve / review / hold based on order value,
              fulfillment status, and customer history, and lets you act on
              them from one queue.
            </Text>
            <List type="bullet" gap="extraTight">
              <List.Item>Dashboard with live risk metrics.</List.Item>
              <List.Item>
                Returns queue with bulk actions and CSV export.
              </List.Item>
              <List.Item>
                Playbooks that auto-decide trusted or suspicious cases.
              </List.Item>
              <List.Item>
                Audit log of every decision (yours and ours).
              </List.Item>
            </List>
            <Form method="post">
              <input type="hidden" name="intent" value="acknowledge_welcome" />
              <Button
                submit
                variant="primary"
                loading={pendingIntent === "acknowledge_welcome" && isSubmitting}
              >
                Got it — continue
              </Button>
            </Form>
          </BlockStack>
        </StepCard>

        <StepCard
          step="scopes"
          progress={progress}
          title="2. Connection — Shopify access"
          done={progress.scopesVerified}
          pending={pendingIntent === "verify_scopes" && isSubmitting}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              Make sure ReturnGuard can read the data it needs to score
              returns. These scopes were granted when you installed the app:
            </Text>
            <ScopesList granted={grantedScopes} missing={missingScopes} />
            {missingScopes.length ? (
              <Banner tone="warning">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">
                    Some required scopes are missing:{" "}
                    <strong>{missingScopes.join(", ")}</strong>. Reinstall the
                    app from your Shopify admin to grant them.
                  </Text>
                </BlockStack>
              </Banner>
            ) : (
              <Banner tone="success">
                <Text as="p" variant="bodyMd">
                  All required scopes look good. If your store handles{" "}
                  <strong>customer order data</strong>, also enable{" "}
                  <Link
                    url="https://shopify.dev/docs/apps/launch/protected-customer-data"
                    target="_blank"
                  >
                    Protected Customer Data access
                  </Link>{" "}
                  for this app in the Partner Dashboard so we can show order
                  detail in the queue.
                </Text>
              </Banner>
            )}
            <Form method="post">
              <input type="hidden" name="intent" value="verify_scopes" />
              <Button
                submit
                variant="primary"
                loading={pendingIntent === "verify_scopes" && isSubmitting}
                disabled={missingScopes.length > 0}
              >
                {missingScopes.length
                  ? "Grant missing scopes first"
                  : "Looks good — continue"}
              </Button>
            </Form>
          </BlockStack>
        </StepCard>

        <StepCard
          step="playbook"
          progress={progress}
          title="3. First playbook — automate the easy cases"
          done={progress.playbookSeeded}
          pending={
            (pendingIntent === "seed_playbook" ||
              pendingIntent === "skip_playbook") &&
            isSubmitting
          }
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              Playbooks auto-decide returns that match a pattern. We can seed
              a sensible starter you can edit later: <em>auto-approve
              customers with 5+ orders whose account is 90+ days old</em>.
            </Text>
            <InlineStack gap="200">
              <Form method="post">
                <input type="hidden" name="intent" value="seed_playbook" />
                <Button
                  submit
                  variant="primary"
                  loading={pendingIntent === "seed_playbook" && isSubmitting}
                >
                  Create starter playbook
                </Button>
              </Form>
              <Form method="post">
                <input type="hidden" name="intent" value="skip_playbook" />
                <Button
                  submit
                  loading={pendingIntent === "skip_playbook" && isSubmitting}
                >
                  Skip — I'll add later
                </Button>
              </Form>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              You can manage playbooks any time from <Link url="/app/playbooks">/app/playbooks</Link>.
            </Text>
          </BlockStack>
        </StepCard>

        <StepCard
          step="settings"
          progress={progress}
          title="4. Risk thresholds — your call"
          done={progress.settingsTuned}
          pending={pendingIntent === "acknowledge_settings" && isSubmitting}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              The defaults work for most stores:{" "}
              <strong>review at 60</strong>, <strong>hold at 80</strong>{" "}
              (out of 100). Bump them up if you want fewer holds, or down if
              fraud is a real concern. You can change these any time in{" "}
              <Link url="/app/settings">Settings</Link>.
            </Text>
            <Form method="post">
              <input type="hidden" name="intent" value="acknowledge_settings" />
              <Button
                submit
                variant="primary"
                loading={pendingIntent === "acknowledge_settings" && isSubmitting}
              >
                Use defaults — finish setup
              </Button>
            </Form>
          </BlockStack>
        </StepCard>

        {progress.completed ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success" toneAndProgressLabelOverride=" ">
                  All set
                </Badge>
                <Text as="h2" variant="headingMd">
                  You're ready to go
                </Text>
              </InlineStack>
              <Text as="p" variant="bodyMd">
                Open the returns queue to see scoring in action. If you've
                got no returns yet, create a test order in Shopify and
                refresh — ReturnGuard will score it immediately.
              </Text>
              <InlineStack gap="200">
                <Button url="/app/returns" variant="primary">
                  Open Returns queue
                </Button>
                <Button url="/app">Back to dashboard</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}

function OverallProgress({
  progress,
  shop,
}: {
  progress: OnboardingProgress;
  shop: string;
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h2" variant="headingMd">
              Setup progress
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {progress.completed
                ? `Onboarding complete for ${shop}.`
                : `Step ${
                    ONBOARDING_STEPS.indexOf(progress.nextStep || "welcome") + 1
                  } of ${ONBOARDING_STEPS.length} — ${labelForStep(
                    progress.nextStep,
                  )}`}
            </Text>
          </BlockStack>
          <Badge tone={progress.completed ? "success" : "info"}>
            {`${progress.percent}%`}
          </Badge>
        </InlineStack>
        <ProgressBar
          progress={progress.percent}
          tone={progress.completed ? "success" : "primary"}
        />
        <Divider />
        <InlineStack gap="200">
          <Form method="post">
            <input type="hidden" name="intent" value="dismiss" />
            <Button submit variant="tertiary">
              Hide onboarding
            </Button>
          </Form>
          {process.env.NODE_ENV !== "production" ? (
            <Form method="post">
              <input type="hidden" name="intent" value="reset" />
              <Button submit variant="tertiary" tone="critical">
                Reset (dev only)
              </Button>
            </Form>
          ) : null}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}

function StepCard({
  step,
  progress,
  title,
  done,
  pending,
  children,
}: {
  step: OnboardingStep;
  progress: OnboardingProgress;
  title: string;
  done: boolean;
  pending: boolean;
  children: React.ReactNode;
}) {
  // Steps that come after the current next-step are rendered greyed-out
  // until earlier steps are done. Keeps the merchant focused on one thing.
  const indexOf = ONBOARDING_STEPS.indexOf(step);
  const nextIndex = progress.nextStep
    ? ONBOARDING_STEPS.indexOf(progress.nextStep)
    : ONBOARDING_STEPS.length;
  const locked = !done && indexOf > nextIndex;

  return (
    <Card>
      <div style={locked ? { opacity: 0.5 } : undefined}>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h3" variant="headingMd">
              {title}
            </Text>
            {done ? (
              <Badge tone="success" toneAndProgressLabelOverride=" ">
                Done
              </Badge>
            ) : pending ? (
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                Saving…
              </Badge>
            ) : locked ? (
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                Up next
              </Badge>
            ) : (
              <Badge tone="attention" toneAndProgressLabelOverride=" ">
                Current step
              </Badge>
            )}
          </InlineStack>
          <Box>{children}</Box>
        </BlockStack>
      </div>
    </Card>
  );
}

function ScopesList({
  granted,
  missing,
}: {
  granted: string[];
  missing: readonly string[];
}) {
  return (
    <Box paddingBlockStart="100">
      <BlockStack gap="100">
        {REQUIRED_SCOPES.map((scope) => {
          const isGranted = granted.includes(scope) && !missing.includes(scope);
          return (
            <InlineStack key={scope} gap="200" blockAlign="center">
              <Badge
                tone={isGranted ? "success" : "critical"}
                toneAndProgressLabelOverride=" "
              >
                {isGranted ? "Granted" : "Missing"}
              </Badge>
              <Text as="span" variant="bodyMd">
                {scope}
              </Text>
            </InlineStack>
          );
        })}
      </BlockStack>
    </Box>
  );
}

function labelForStep(step: OnboardingStep | null): string {
  switch (step) {
    case "welcome":
      return "Welcome";
    case "scopes":
      return "Connection check";
    case "playbook":
      return "First playbook";
    case "settings":
      return "Risk thresholds";
    default:
      return "All done";
  }
}
