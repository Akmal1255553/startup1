import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineGrid,
  InlineStack,
  Layout,
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const playbooks = await listPlaybooks(session.shop);
  return { playbooks };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  try {
    if (intent === "create") await createPlaybook(session.shop, formData);
    else if (intent === "update") await updatePlaybook(session.shop, formData);
    else if (intent === "toggle") await togglePlaybook(session.shop, formData);
    else if (intent === "delete") await deletePlaybook(session.shop, formData);
    else return { ok: false, error: "Unknown action intent." };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Action failed",
    };
  }
};

const actionOptions = [
  { label: "Auto approve", value: "approved" },
  { label: "Auto review", value: "review" },
  { label: "Auto hold", value: "hold" },
];

export default function PlaybooksPage() {
  const { playbooks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const actionError =
    actionData && "error" in actionData ? actionData.error : null;
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";
  const [createAction, setCreateAction] = useState("review");
  const [isCreateActive, setIsCreateActive] = useState(true);
  const [vipBypass, setVipBypass] = useState(false);

  useEffect(() => {
    if (actionData?.ok) {
      shopify.toast.show("Playbook saved");
    }
  }, [actionData?.ok, shopify.toast]);

  return (
    <Page
      title="Playbooks"
      subtitle="Automated moderation rules for returns and refund actions"
      secondaryActions={[{ content: "Open queue", url: "/app/returns" }]}
    >
      <TitleBar title="ReturnGuard playbooks" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {actionError ? (
              <Card>
                <Text as="p" variant="bodyMd" tone="critical">
                  {actionError}
                </Text>
              </Card>
            ) : null}
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
                        <Badge tone={playbook.isActive ? "success" : "warning"} toneAndProgressLabelOverride=" ">
                          {playbook.isActive ? "Active" : "Paused"}
                        </Badge>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Button submit variant="primary" loading={isSubmitting}>
                          Save
                        </Button>
                      </InlineStack>
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
                          defaultValue={playbook.minAccountAgeDays?.toString() || ""}
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
                      <textarea name="notes" defaultValue={playbook.notes || ""} />
                    </label>
                    <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
                      <Select
                        label="Status"
                        name="isActive"
                        options={[
                          { label: "Active", value: "true" },
                          { label: "Paused", value: "false" },
                        ]}
                        value={playbook.isActive ? "true" : "false"}
                      />
                      <Select
                        label="VIP bypass"
                        name="vipBypassEnabled"
                        options={[
                          { label: "Disabled", value: "false" },
                          { label: "Enabled", value: "true" },
                        ]}
                        value={playbook.vipBypassEnabled ? "true" : "false"}
                      />
                    </InlineGrid>
                  </BlockStack>
                </Form>
                <Divider />
                <InlineStack align="space-between">
                  <Form method="post">
                    <input type="hidden" name="intent" value="toggle" />
                    <input type="hidden" name="id" value={playbook.id} />
                    <input type="hidden" name="isActive" value={playbook.isActive ? "false" : "true"} />
                    <Button submit>{playbook.isActive ? "Pause" : "Activate"}</Button>
                  </Form>
                  <Form method="post" onSubmit={(event) => {
                    if (!window.confirm("Delete this playbook?")) event.preventDefault();
                  }}>
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={playbook.id} />
                    <Button submit tone="critical" variant="secondary">Delete</Button>
                  </Form>
                </InlineStack>
              </Card>
            ))}
            {!playbooks.length ? (
              <Card>
                <Text as="p" variant="bodyMd" tone="subdued">
                  No playbooks yet. Create one to automate return moderation.
                </Text>
              </Card>
            ) : null}
          </BlockStack>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <Form method="post">
              <BlockStack gap="300">
                <input type="hidden" name="intent" value="create" />
                <Text as="h2" variant="headingMd">Create playbook</Text>
                <TextField label="Playbook name" name="name" autoComplete="off" />
                <Select label="Automated action" name="action" options={actionOptions} value={createAction} onChange={setCreateAction} />
                <TextField label="Minimum order value" name="minOrderValue" type="number" autoComplete="off" />
                <TextField label="Repeat returns threshold" name="repeatReturnsThreshold" type="number" autoComplete="off" />
                <TextField label="Minimum account age (days)" name="minAccountAgeDays" type="number" autoComplete="off" />
                <TextField label="Suspicious email domains (comma-separated)" name="suspiciousDomainsCsv" autoComplete="off" />
                <TextField label="Internal notes" name="notes" autoComplete="off" multiline={3} />
                <Checkbox label="Active on creation" checked={isCreateActive} onChange={setIsCreateActive} />
                <Checkbox label="Enable VIP bypass" checked={vipBypass} onChange={setVipBypass} />
                <input type="hidden" name="isActive" value={isCreateActive ? "true" : "false"} />
                <input type="hidden" name="vipBypassEnabled" value={vipBypass ? "true" : "false"} />
                <Button submit variant="primary" loading={isSubmitting}>Create playbook</Button>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
