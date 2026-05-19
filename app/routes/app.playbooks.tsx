import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  InlineStack,
  Page,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import { useI18n } from "../i18n/i18n-context";
import { describePlanContext } from "../i18n/messages/app/common";
import { getPlaybooksCopy } from "../i18n/messages/app/playbooks";
import { resolveLocale } from "../i18n/resolver.server";
import {
  createPlaybook,
  deletePlaybook,
  listPlaybooks,
  togglePlaybook,
  updatePlaybook,
} from "../models/playbook.server";
import {
  readSafeFormData,
  toActionFailure,
} from "../lib/validation.server";
import { actionFailure, getFieldError } from "../lib/action-result";
import { loadCapabilities } from "../models/plan-gating.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const [playbooks, capabilities] = await Promise.all([
    listPlaybooks(session.shop),
    loadCapabilities(billing),
  ]);
  return { playbooks, capabilities };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
  const locale = await resolveLocale(request, {
    authenticatedShop: session.shop,
    sessionLocale: session.locale ?? null,
  });
  const copy = getPlaybooksCopy(locale);

  if (!capabilities.canUseAutomation) {
    return actionFailure(copy.errorGated);
  }

  let formData: FormData;
  try {
    formData = await readSafeFormData(request);
  } catch (error) {
    return toActionFailure(error);
  }

  const intent = String(formData.get("intent") || "");
  try {
    if (intent === "create") {
      return await createPlaybook(session.shop, formData);
    }
    if (intent === "update") {
      return await updatePlaybook(session.shop, formData);
    }
    if (intent === "toggle") {
      return await togglePlaybook(session.shop, formData);
    }
    if (intent === "delete") {
      return await deletePlaybook(session.shop, formData);
    }
    return actionFailure(copy.errorUnknownIntent);
  } catch (error) {
    return toActionFailure(error);
  }
};

export default function PlaybooksPage() {
  const { playbooks, capabilities } = useLoaderData<typeof loader>();
  const {
    pages: { playbooks: p, common: c },
  } = useI18n();
  const actionData = useActionData<typeof action>();
  const actionError =
    actionData && actionData.ok === false ? actionData.error : null;
  const nameError = getFieldError(actionData, "name");
  const actionFieldError = getFieldError(actionData, "action");
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";
  const automationLocked = !capabilities.canUseAutomation;
  const [createAction, setCreateAction] = useState("review");
  const [isCreateActive, setIsCreateActive] = useState(true);
  const [vipBypass, setVipBypass] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createMinOrderValue, setCreateMinOrderValue] = useState("");
  const [createRepeatThreshold, setCreateRepeatThreshold] = useState("");
  const [createMinAccountAge, setCreateMinAccountAge] = useState("");
  const [createDomains, setCreateDomains] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  const actionOptions = [
    { label: p.actionApprove, value: "approved" },
    { label: p.actionReview, value: "review" },
    { label: p.actionHold, value: "hold" },
  ];

  useEffect(() => {
    if (actionData && actionData.ok && actionData.toast) {
      shopify.toast.show(actionData.toast);
      setCreateName("");
      setCreateMinOrderValue("");
      setCreateRepeatThreshold("");
      setCreateMinAccountAge("");
      setCreateDomains("");
      setCreateNotes("");
      setCreateAction("review");
      setIsCreateActive(true);
      setVipBypass(false);
    }
  }, [actionData, shopify.toast]);

  return (
    <Page
      title={p.title}
      subtitle={p.subtitle}
      secondaryActions={[{ content: c.openQueue, url: "/app/returns" }]}
    >
      <TitleBar title={p.titleBar} />
      <BlockStack gap="500">
        {automationLocked ? (
          <Banner
            title={p.gatedTitle}
            tone="warning"
            action={{ content: c.upgradePlan, url: "/app/billing" }}
          >
            <p>
              {describePlanContext(
                c,
                capabilities.planLabel,
                capabilities.hasActivePlan,
              )}{" "}
              {p.gatedBody}
            </p>
          </Banner>
        ) : null}

        {actionError ? (
          <Card>
            <Text as="p" variant="bodyMd" tone="critical">
              {actionError}
            </Text>
          </Card>
        ) : null}

        <Card>
          <Form method="post">
            <BlockStack gap="300">
              <input type="hidden" name="intent" value="create" />
              <Text as="h2" variant="headingMd">
                {p.createTitle}
              </Text>
              <TextField
                label={p.fieldName}
                name="name"
                autoComplete="off"
                error={nameError}
                value={createName}
                onChange={setCreateName}
                disabled={automationLocked}
              />
              <BlockStack gap="100">
                <Text as="p" variant="bodySm">
                  {p.fieldAction}
                </Text>
                <select
                  name="action"
                  value={createAction}
                  onChange={(event) => setCreateAction(event.target.value)}
                  aria-invalid={Boolean(actionFieldError)}
                  disabled={automationLocked}
                  style={{
                    width: "100%",
                    minHeight: "2.25rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--p-color-border)",
                    padding: "0 0.75rem",
                  }}
                >
                  {actionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {actionFieldError ? (
                  <Text as="p" variant="bodySm" tone="critical">
                    {actionFieldError}
                  </Text>
                ) : null}
              </BlockStack>
              <TextField
                label={p.fieldMinValue}
                name="minOrderValue"
                type="number"
                autoComplete="off"
                value={createMinOrderValue}
                onChange={setCreateMinOrderValue}
                disabled={automationLocked}
              />
              <TextField
                label={p.fieldRepeatReturns}
                name="repeatReturnsThreshold"
                type="number"
                autoComplete="off"
                value={createRepeatThreshold}
                onChange={setCreateRepeatThreshold}
                disabled={automationLocked}
              />
              <TextField
                label={p.fieldMinAccountAge}
                name="minAccountAgeDays"
                type="number"
                autoComplete="off"
                value={createMinAccountAge}
                onChange={setCreateMinAccountAge}
                disabled={automationLocked}
              />
              <TextField
                label={p.fieldDomains}
                name="suspiciousDomainsCsv"
                autoComplete="off"
                value={createDomains}
                onChange={setCreateDomains}
                disabled={automationLocked}
              />
              <TextField
                label={p.fieldNotes}
                name="notes"
                autoComplete="off"
                multiline={3}
                value={createNotes}
                onChange={setCreateNotes}
                disabled={automationLocked}
              />
              <Checkbox
                label={p.activeOnCreate}
                checked={isCreateActive}
                onChange={setIsCreateActive}
              />
              <Checkbox
                label={p.vipBypass}
                checked={vipBypass}
                onChange={setVipBypass}
              />
              <input
                type="hidden"
                name="isActive"
                value={isCreateActive ? "true" : "false"}
              />
              <input
                type="hidden"
                name="vipBypassEnabled"
                value={vipBypass ? "true" : "false"}
              />
              <Button
                submit
                variant="primary"
                loading={isSubmitting}
                disabled={automationLocked}
              >
                {p.createSubmit}
              </Button>
            </BlockStack>
          </Form>
        </Card>

        {playbooks.map((playbook) => (
          <PlaybookEditor
            key={playbook.id}
            playbook={playbook}
            isSubmitting={isSubmitting}
            automationLocked={automationLocked}
            copy={p}
            actionOptions={actionOptions}
          />
        ))}

        {!playbooks.length ? (
          <Card>
            <Text as="p" variant="bodyMd" tone="subdued">
              {p.empty}
            </Text>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}

type PlaybookRow = ReturnType<typeof useLoaderData<typeof loader>>["playbooks"][number];

function PlaybookEditor({
  playbook,
  isSubmitting,
  automationLocked,
  copy,
  actionOptions,
}: {
  playbook: PlaybookRow;
  isSubmitting: boolean;
  automationLocked: boolean;
  copy: ReturnType<typeof useI18n>["pages"]["playbooks"];
  actionOptions: Array<{ label: string; value: string }>;
}) {
  const [name, setName] = useState(playbook.name);
  const [action, setAction] = useState(playbook.action);
  const [minOrderValue, setMinOrderValue] = useState(
    playbook.minOrderValue?.toString() ?? "",
  );
  const [repeatReturnsThreshold, setRepeatReturnsThreshold] = useState(
    playbook.repeatReturnsThreshold?.toString() ?? "",
  );
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(
    playbook.minAccountAgeDays?.toString() ?? "",
  );
  const [suspiciousDomainsCsv, setSuspiciousDomainsCsv] = useState(
    playbook.suspiciousDomainsCsv ?? "",
  );
  const [notes, setNotes] = useState(playbook.notes ?? "");
  const [isActive, setIsActive] = useState(playbook.isActive);
  const [vipBypassEnabled, setVipBypassEnabled] = useState(
    playbook.vipBypassEnabled,
  );

  return (
    <Card>
      <BlockStack gap="400">
        <Form method="post">
          <BlockStack gap="300">
            <input type="hidden" name="intent" value="update" />
            <input type="hidden" name="id" value={playbook.id} />
            <input
              type="hidden"
              name="isActive"
              value={isActive ? "true" : "false"}
            />
            <input
              type="hidden"
              name="vipBypassEnabled"
              value={vipBypassEnabled ? "true" : "false"}
            />

            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  {playbook.name}
                </Text>
                <Badge
                  tone={playbook.isActive ? "success" : "warning"}
                  toneAndProgressLabelOverride=" "
                >
                  {playbook.isActive ? copy.statusActive : copy.statusPaused}
                </Badge>
              </InlineStack>
              <Button
                submit
                variant="primary"
                loading={isSubmitting}
                disabled={automationLocked}
              >
                {copy.save}
              </Button>
            </InlineStack>

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
              <TextField
                label={copy.fieldName}
                name="name"
                autoComplete="off"
                value={name}
                onChange={setName}
                disabled={automationLocked}
              />
              <Select
                label={copy.fieldAction}
                name="action"
                value={action}
                onChange={setAction}
                disabled={automationLocked}
                options={actionOptions}
              />
              <TextField
                label={copy.fieldMinValue}
                name="minOrderValue"
                type="number"
                autoComplete="off"
                value={minOrderValue}
                onChange={setMinOrderValue}
                disabled={automationLocked}
              />
              <TextField
                label={copy.fieldRepeatReturns}
                name="repeatReturnsThreshold"
                type="number"
                autoComplete="off"
                value={repeatReturnsThreshold}
                onChange={setRepeatReturnsThreshold}
                disabled={automationLocked}
              />
              <TextField
                label={copy.fieldMinAccountAge}
                name="minAccountAgeDays"
                type="number"
                autoComplete="off"
                value={minAccountAgeDays}
                onChange={setMinAccountAgeDays}
                disabled={automationLocked}
              />
              <TextField
                label={copy.fieldDomains}
                name="suspiciousDomainsCsv"
                autoComplete="off"
                value={suspiciousDomainsCsv}
                onChange={setSuspiciousDomainsCsv}
                disabled={automationLocked}
              />
            </InlineGrid>

            <TextField
              label={copy.fieldNotes}
              name="notes"
              autoComplete="off"
              multiline={3}
              value={notes}
              onChange={setNotes}
              disabled={automationLocked}
            />

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
              <Box paddingBlockStart="100">
                <Checkbox
                  label={copy.active}
                  checked={isActive}
                  onChange={setIsActive}
                  disabled={automationLocked}
                />
              </Box>
              <Box paddingBlockStart="100">
                <Checkbox
                  label={copy.vipBypass}
                  checked={vipBypassEnabled}
                  onChange={setVipBypassEnabled}
                  disabled={automationLocked}
                />
              </Box>
            </InlineGrid>
          </BlockStack>
        </Form>

        <Divider />

        <InlineStack align="space-between">
          <Form method="post">
            <input type="hidden" name="intent" value="toggle" />
            <input type="hidden" name="id" value={playbook.id} />
            <input
              type="hidden"
              name="isActive"
              value={playbook.isActive ? "false" : "true"}
            />
            <Button submit disabled={automationLocked}>
              {playbook.isActive ? copy.pause : copy.activate}
            </Button>
          </Form>
          <Form
            method="post"
            onSubmit={(event) => {
              if (!window.confirm(copy.deleteConfirm)) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="id" value={playbook.id} />
            <Button
              submit
              tone="critical"
              variant="secondary"
              disabled={automationLocked}
            >
              {copy.delete}
            </Button>
          </Form>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
