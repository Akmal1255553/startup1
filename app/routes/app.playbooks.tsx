import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  InlineStack,
  Page,
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
              You're on {capabilities.planLabel}. Existing playbooks are shown
              read-only. Upgrade to Growth or Scale to create, edit, or pause
              automation rules.
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
          <Card key={playbook.id}>
            <Form method="post">
              <BlockStack gap="300">
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="id" value={playbook.id} />
                <InlineStack align="space-between">
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
                  <label>
                    <Text as="span" variant="bodySm">
                      Playbook name
                    </Text>
                    <input name="name" defaultValue={playbook.name} />
                  </label>
                  <label>
                    <Text as="span" variant="bodySm">
                      Automated action
                    </Text>
                    <select name="action" defaultValue={playbook.action}>
                      <option value="approved">Auto approve</option>
                      <option value="review">Auto review</option>
                      <option value="hold">Auto hold</option>
                    </select>
                  </label>
                  <label>
                    <Text as="span" variant="bodySm">
                      Minimum order value
                    </Text>
                    <input
                      name="minOrderValue"
                      type="number"
                      defaultValue={playbook.minOrderValue?.toString() || ""}
                    />
                  </label>
                  <label>
                    <Text as="span" variant="bodySm">
                      Repeat returns threshold
                    </Text>
                    <input
                      name="repeatReturnsThreshold"
                      type="number"
                      defaultValue={
                        playbook.repeatReturnsThreshold?.toString() || ""
                      }
                    />
                  </label>
                  <label>
                    <Text as="span" variant="bodySm">
                      Minimum account age (days)
                    </Text>
                    <input
                      name="minAccountAgeDays"
                      type="number"
                      defaultValue={
                        playbook.minAccountAgeDays?.toString() || ""
                      }
                    />
                  </label>
                  <label>
                    <Text as="span" variant="bodySm">
                      Suspicious email domains (comma-separated)
                    </Text>
                    <input
                      name="suspiciousDomainsCsv"
                      defaultValue={playbook.suspiciousDomainsCsv || ""}
                    />
                  </label>
                </InlineGrid>
                <label>
                  <Text as="span" variant="bodySm">
                    Internal notes
                  </Text>
                  <textarea
                    name="notes"
                    defaultValue={playbook.notes || ""}
                  />
                </label>
                <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
                  <label>
                    <Text as="span" variant="bodySm">
                      Status
                    </Text>
                    <select
                      name="isActive"
                      defaultValue={playbook.isActive ? "true" : "false"}
                    >
                      <option value="true">Active</option>
                      <option value="false">Paused</option>
                    </select>
                  </label>
                  <label>
                    <Text as="span" variant="bodySm">
                      VIP bypass
                    </Text>
                    <select
                      name="vipBypassEnabled"
                      defaultValue={
                        playbook.vipBypassEnabled ? "true" : "false"
                      }
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  </label>
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
          </Card>
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
