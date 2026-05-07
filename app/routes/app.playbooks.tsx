import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

const playbooks = [
  {
    title: "High-value refund hold",
    description:
      "Routes expensive refund requests to manual review before money leaves the store.",
    status: "On",
    owner: "Support lead",
  },
  {
    title: "New customer review",
    description:
      "Adds friction to first-order refund requests where payment or fulfillment signals look weak.",
    status: "On",
    owner: "CX operations",
  },
  {
    title: "Trusted customer fast lane",
    description:
      "Keeps low-risk paid and fulfilled orders moving with quick approval decisions.",
    status: "Draft",
    owner: "Automation",
  },
];

export default function PlaybooksPage() {
  return (
    <Page
      title="Playbooks"
      subtitle="Operational rules that turn risk signals into consistent return decisions"
      primaryAction={{ content: "Create playbook", url: "/app/settings" }}
      secondaryActions={[{ content: "Open queue", url: "/app/returns" }]}
    >
      <TitleBar title="ReturnGuard playbooks" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {playbooks.map((playbook) => (
              <Card key={playbook.title}>
                <InlineStack align="space-between" blockAlign="start" gap="400">
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        {playbook.title}
                      </Text>
                      <Badge
                        tone={playbook.status === "On" ? "success" : "warning"}
                        toneAndProgressLabelOverride=" "
                      >
                        {playbook.status}
                      </Badge>
                    </InlineStack>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {playbook.description}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Owner: {playbook.owner}
                    </Text>
                  </BlockStack>
                  <Button url="/app/settings">Tune</Button>
                </InlineStack>
              </Card>
            ))}
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Launch checklist
              </Text>
              <ChecklistItem label="Connect Shopify Admin data" done />
              <ChecklistItem label="Tune risk thresholds" done />
              <ChecklistItem label="Review first flagged orders" />
              <ChecklistItem label="Export weekly risk report" />
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function ChecklistItem({
  label,
  done = false,
}: {
  label: string;
  done?: boolean;
}) {
  return (
    <Box padding="200" background="bg-surface-active" borderRadius="200">
      <InlineStack gap="200" blockAlign="center">
        <Badge
          tone={done ? "success" : "attention"}
          toneAndProgressLabelOverride=" "
        >
          {done ? "Done" : "Next"}
        </Badge>
        <Text as="span" variant="bodyMd">
          {label}
        </Text>
      </InlineStack>
    </Box>
  );
}
