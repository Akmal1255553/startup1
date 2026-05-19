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
  List,
  Page,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { useI18n } from "../i18n/i18n-context";
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
  const {
    pages: { onboarding: o },
  } = useI18n();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";
  const pendingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;

  const errorMessage =
    actionData && "error" in actionData ? actionData.error : null;

  return (
    <Page
      title={o.title}
      subtitle={o.subtitle}
      backAction={{ content: o.skip, url: "/app" }}
    >
      <TitleBar title={o.title} />
      <BlockStack gap="500">
        {errorMessage ? (
          <Banner tone="critical">{errorMessage}</Banner>
        ) : null}

        <OverallProgress progress={progress} shop={shop} copy={o} />

        <StepCard
          step="welcome"
          progress={progress}
          title={o.s1Title}
          done={progress.welcomeAcknowledged}
          pending={pendingIntent === "acknowledge_welcome" && isSubmitting}
          copy={o}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              {o.s1Body}
            </Text>
            <List type="bullet" gap="extraTight">
              {o.s1Bullets.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
            <Form method="post">
              <input type="hidden" name="intent" value="acknowledge_welcome" />
              <Button
                submit
                variant="primary"
                loading={pendingIntent === "acknowledge_welcome" && isSubmitting}
              >
                {o.s1Continue}
              </Button>
            </Form>
          </BlockStack>
        </StepCard>

        <StepCard
          step="scopes"
          progress={progress}
          title={o.s2Title}
          done={progress.scopesVerified}
          pending={pendingIntent === "verify_scopes" && isSubmitting}
          copy={o}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              {o.s2Body}
            </Text>
            <ScopesList
              granted={grantedScopes}
              missing={missingScopes}
              grantedLabel={o.scopeGranted}
              missingLabel={o.scopeMissing}
            />
            {missingScopes.length ? (
              <Banner tone="warning">
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd">
                    {o.s2Missing}{" "}
                    <strong>{missingScopes.join(", ")}</strong>
                  </Text>
                </BlockStack>
              </Banner>
            ) : (
              <Banner tone="success">
                <Text as="p" variant="bodyMd">
                  {o.s2Success}
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
                {missingScopes.length ? o.s2SubmitMissing : o.s2SubmitOk}
              </Button>
            </Form>
          </BlockStack>
        </StepCard>

        <StepCard
          step="playbook"
          progress={progress}
          title={o.s3Title}
          done={progress.playbookSeeded}
          pending={
            (pendingIntent === "seed_playbook" ||
              pendingIntent === "skip_playbook") &&
            isSubmitting
          }
          copy={o}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              {o.s3Body}
            </Text>
            <InlineStack gap="200">
              <Form method="post">
                <input type="hidden" name="intent" value="seed_playbook" />
                <Button
                  submit
                  variant="primary"
                  loading={pendingIntent === "seed_playbook" && isSubmitting}
                >
                  {o.s3Create}
                </Button>
              </Form>
              <Form method="post">
                <input type="hidden" name="intent" value="skip_playbook" />
                <Button
                  submit
                  loading={pendingIntent === "skip_playbook" && isSubmitting}
                >
                  {o.s3Skip}
                </Button>
              </Form>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {o.s3Link}
            </Text>
          </BlockStack>
        </StepCard>

        <StepCard
          step="settings"
          progress={progress}
          title={o.s4Title}
          done={progress.settingsTuned}
          pending={pendingIntent === "acknowledge_settings" && isSubmitting}
          copy={o}
        >
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              {o.s4Body}
            </Text>
            <Form method="post">
              <input type="hidden" name="intent" value="acknowledge_settings" />
              <Button
                submit
                variant="primary"
                loading={
                  pendingIntent === "acknowledge_settings" && isSubmitting
                }
              >
                {o.s4Finish}
              </Button>
            </Form>
          </BlockStack>
        </StepCard>

        {progress.completed ? (
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="success" toneAndProgressLabelOverride=" ">
                  {o.completeBadge}
                </Badge>
                <Text as="h2" variant="headingMd">
                  {o.completeTitle}
                </Text>
              </InlineStack>
              <Text as="p" variant="bodyMd">
                {o.completeBody}
              </Text>
              <InlineStack gap="200">
                <Button url="/app/returns" variant="primary">
                  {o.openQueue}
                </Button>
                <Button url="/app">{o.backDashboard}</Button>
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
  copy,
}: {
  progress: OnboardingProgress;
  shop: string;
  copy: ReturnType<typeof useI18n>["pages"]["onboarding"];
}) {
  const stepIndex = ONBOARDING_STEPS.indexOf(progress.nextStep || "welcome");

  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="050">
            <Text as="h2" variant="headingMd">
              {copy.progressTitle}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {progress.completed
                ? copy.progressComplete(shop)
                : copy.progressStep(
                    stepIndex + 1,
                    ONBOARDING_STEPS.length,
                    labelForStep(progress.nextStep, copy),
                  )}
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
              {copy.hide}
            </Button>
          </Form>
          {process.env.NODE_ENV !== "production" ? (
            <Form method="post">
              <input type="hidden" name="intent" value="reset" />
              <Button submit variant="tertiary" tone="critical">
                {copy.resetDev}
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
  copy,
}: {
  step: OnboardingStep;
  progress: OnboardingProgress;
  title: string;
  done: boolean;
  pending: boolean;
  children: React.ReactNode;
  copy: ReturnType<typeof useI18n>["pages"]["onboarding"];
}) {
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
                {copy.badgeDone}
              </Badge>
            ) : pending ? (
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                {copy.badgeSaving}
              </Badge>
            ) : locked ? (
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                {copy.badgeUpNext}
              </Badge>
            ) : (
              <Badge tone="attention" toneAndProgressLabelOverride=" ">
                {copy.badgeCurrent}
              </Badge>
            )}
          </InlineStack>
          <Box>{children}</Box>
        </BlockStack>
      </div>
    </Card>
  );
}

function labelForStep(
  step: OnboardingStep | null,
  copy: ReturnType<typeof useI18n>["pages"]["onboarding"],
): string {
  switch (step) {
    case "welcome":
      return copy.stepWelcome;
    case "scopes":
      return copy.stepScopes;
    case "playbook":
      return copy.stepPlaybook;
    case "settings":
      return copy.stepSettings;
    default:
      return copy.stepDone;
  }
}

function ScopesList({
  granted,
  missing,
  grantedLabel,
  missingLabel,
}: {
  granted: string[];
  missing: readonly string[];
  grantedLabel: string;
  missingLabel: string;
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
                {isGranted ? grantedLabel : missingLabel}
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