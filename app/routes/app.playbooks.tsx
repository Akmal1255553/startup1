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
import { describePlanContext } from "../billing/capabilities";

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

  if (!capabilities.canUseAutomation) {
    return actionFailure(
      "Automation playbooks are available on the Growth and Scale plans. Open Billing to upgrade.",
    );
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
    return actionFailure("Unknown action intent.");
  } catch (error) {
    return toActionFailure(error);
  }
};

export default function PlaybooksPage() {
  const { playbooks, capabilities } = useLoaderData<typeof loader>();
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
  // Polaris TextField is a *controlled* component — without value/onChange
  // it silently swallows keystrokes. Track every field here so users can
  // actually type into the "Create playbook" form.
  const [createName, setCreateName] = useState("");
  const [createMinOrderValue, setCreateMinOrderValue] = useState("");
  const [createRepeatThreshold, setCreateRepeatThreshold] = useState("");
  const [createMinAccountAge, setCreateMinAccountAge] = useState("");
  const [createDomains, setCreateDomains] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  useEffect(() => {
    if (actionData && actionData.ok && actionData.toast) {
      shopify.toast.show(actionData.toast);
      // Reset the create form once Shopify confirmed the row was saved.
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
      title="Playbooks"
      subtitle="Automated moderation rules for returns and refund actions"
      secondaryActions={[{ content: "Open queue", url: "/app/returns" }]}
    >
      <TitleBar title="ReturnGuard playbooks" />
      <BlockStack gap="500">
        {automationLocked ? (
          <Banner
            title="Playbooks are a Growth feature"
            tone="warning"
            action={{ content: "Upgrade plan", url: "/app/billing" }}
          >
            <p>
              {describePlanContext(capabilities)}{" "}
              Existing playbooks are shown read-only. Upgrade to Growth or Scale
              to create, edit, or pause automation rules.
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
                Create playbook
              </Text>
              <TextField
                label="Playbook name"
                name="name"
                autoComplete="off"
                error={nameError}
                value={createName}
                onChange={setCreateName}
                disabled={automationLocked}
              />
              <BlockStack gap="100">
                <Text as="p" variant="bodySm">
                  Automated action
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
                  <option value="approved">Auto approve</option>
                  <option value="review">Auto review</option>
                  <option value="hold">Auto hold</option>
                </select>
                {actionFieldError ? (
                  <Text as="p" variant="bodySm" tone="critical">
                    {actionFieldError}
                  </Text>
                ) : null}
              </BlockStack>
              <TextField
                label="Minimum order value"
                name="minOrderValue"
                type="number"
                autoComplete="off"
                value={createMinOrderValue}
                onChange={setCreateMinOrderValue}
                disabled={automationLocked}
              />
              <TextField
                label="Repeat returns threshold"
                name="repeatReturnsThreshold"
                type="number"
                autoComplete="off"
                value={createRepeatThreshold}
                onChange={setCreateRepeatThreshold}
                disabled={automationLocked}
              />
              <TextField
                label="Minimum account age (days)"
                name="minAccountAgeDays"
                type="number"
                autoComplete="off"
                value={createMinAccountAge}
                onChange={setCreateMinAccountAge}
                disabled={automationLocked}
              />
              <TextField
                label="Suspicious email domains (comma-separated)"
                name="suspiciousDomainsCsv"
                autoComplete="off"
                value={createDomains}
                onChange={setCreateDomains}
                disabled={automationLocked}
              />
              <TextField
                label="Internal notes"
                name="notes"
                autoComplete="off"
                multiline={3}
                value={createNotes}
                onChange={setCreateNotes}
                disabled={automationLocked}
              />
              <Checkbox
                label="Active on creation"
                checked={isCreateActive}
                onChange={setIsCreateActive}
              />
              <Checkbox
                label="Enable VIP bypass"
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
                Create playbook
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
          />
        ))}

        {!playbooks.length ? (
          <Card>
            <Text as="p" variant="bodyMd" tone="subdued">
              No playbooks in the list yet. Use the form above to create your
              first rule.
            </Text>
          </Card>
        ) : null}
      </BlockStack>
    </Page>
  );
}

type PlaybookRow = ReturnType<typeof useLoaderData<typeof loader>>["playbooks"][number];

/**
 * One playbook = one editable card. We give each card its own local state
 * so Polaris's controlled TextField / Select / Checkbox components accept
 * keystrokes and so the form layout is consistent with the create-form
 * above. Each row submits a separate `intent=update` POST.
 */
function PlaybookEditor({
  playbook,
  isSubmitting,
  automationLocked,
}: {
  playbook: PlaybookRow;
  isSubmitting: boolean;
  automationLocked: boolean;
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
                  {playbook.isActive ? "Active" : "Paused"}
                </Badge>
              </InlineStack>
              <Button
                submit
                variant="primary"
                loading={isSubmitting}
                disabled={automationLocked}
              >
                Save
              </Button>
            </InlineStack>

            <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
              <TextField
                label="Playbook name"
                name="name"
                autoComplete="off"
                value={name}
                onChange={setName}
                disabled={automationLocked}
              />
              <Select
                label="Automated action"
                name="action"
                value={action}
                onChange={setAction}
                disabled={automationLocked}
                options={[
                  { label: "Auto approve", value: "approved" },
                  { label: "Auto review", value: "review" },
                  { label: "Auto hold", value: "hold" },
                ]}
              />
              <TextField
                label="Minimum order value"
                name="minOrderValue"
                type="number"
                autoComplete="off"
                value={minOrderValue}
                onChange={setMinOrderValue}
                disabled={automationLocked}
              />
              <TextField
                label="Repeat returns threshold"
                name="repeatReturnsThreshold"
                type="number"
                autoComplete="off"
                value={repeatReturnsThreshold}
                onChange={setRepeatReturnsThreshold}
                disabled={automationLocked}
              />
              <TextField
                label="Minimum account age (days)"
                name="minAccountAgeDays"
                type="number"
                autoComplete="off"
                value={minAccountAgeDays}
                onChange={setMinAccountAgeDays}
                disabled={automationLocked}
              />
              <TextField
                label="Suspicious email domains (comma-separated)"
                name="suspiciousDomainsCsv"
                autoComplete="off"
                value={suspiciousDomainsCsv}
                onChange={setSuspiciousDomainsCsv}
                disabled={automationLocked}
              />
            </InlineGrid>

            <TextField
              label="Internal notes"
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
                  label="Active"
                  checked={isActive}
                  onChange={setIsActive}
                  disabled={automationLocked}
                />
              </Box>
              <Box paddingBlockStart="100">
                <Checkbox
                  label="Enable VIP bypass"
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
              {playbook.isActive ? "Pause" : "Activate"}
            </Button>
          </Form>
          <Form
            method="post"
            onSubmit={(event) => {
              if (!window.confirm("Delete this playbook?")) {
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
              Delete
            </Button>
          </Form>
        </InlineStack>
      </BlockStack>
    </Card>
  );
}
