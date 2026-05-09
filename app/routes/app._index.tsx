import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import {
  loadReturnRiskData,
  saveReturnDecision,
} from "../models/return-risk.server";
import {
  getDecisionLabel,
  getDecisionTone,
  getMoneyFormatter,
  type RiskOrder,
} from "../models/return-risk";

const playbooks = [
  "Flag high-value refund requests",
  "Pause refunds above the hold threshold",
  "Auto-approve low-risk paid and fulfilled orders",
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  return loadReturnRiskData(admin, session.shop);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  return saveReturnDecision(session.shop, formData);
};

export default function Dashboard() {
  const {
    orders,
    summary,
    error,
    needsProtectedDataAccess,
    settings,
    recentActions,
  } = useLoaderData<typeof loader>();
  const topRiskOrder = [...orders].sort((a, b) => b.risk - a.risk)[0];
  const moneyFormatter = getMoneyFormatter(summary.currencyCode);

  const riskCards = [
    {
      label: "Estimated margin protected",
      value: moneyFormatter.format(summary.protectedMargin),
      change: `${summary.analyzedOrders} recent orders analyzed`,
      tone: "success",
    },
    {
      label: "Manual review queue",
      value: String(summary.reviewCount),
      change: `Risk ${settings.reviewRiskThreshold}-${settings.holdRiskThreshold - 1}`,
      tone: "attention",
    },
    {
      label: "Refund holds",
      value: String(summary.holdCount),
      change: `Risk ${settings.holdRiskThreshold}+`,
      tone: "critical",
    },
    {
      label: "Approval ratio",
      value: `${summary.approvalRatio}%`,
      change: `${summary.totalReturns} total returns`,
      tone: "success",
    },
    {
      label: "Flagged returns",
      value: String(summary.flaggedReturns),
      change: `${summary.averageRiskScore} avg risk score`,
      tone: "attention",
    },
  ];

  const rows = orders.slice(0, 8).map((order) => [
    order.name,
    <BlockStack key={`${order.id}-customer`} gap="050">
      <Text as="span" variant="bodyMd">
        {order.customer}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {order.financialStatus} / {order.fulfillmentStatus}
      </Text>
    </BlockStack>,
    moneyFormatter.format(order.value),
    <RiskMeter key={`${order.id}-risk`} order={order} />,
    <BlockStack key={`${order.id}-action`} gap="100">
      <Text as="span" variant="bodyMd">
        {order.recommendation}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {order.factors.join(", ")}
      </Text>
    </BlockStack>,
    <DecisionControls key={`${order.id}-decision`} order={order} />,
  ]);

  return (
    <Page
      title="ReturnGuard AI"
      subtitle="Operational return-risk control center for your Shopify store"
      primaryAction={
        topRiskOrder
          ? {
              content: "Open highest risk order",
              url: topRiskOrder.adminPath,
              target: "_blank",
            }
          : { content: "Waiting for orders", disabled: true }
      }
      secondaryActions={[
        { content: "View queue", url: "/app/returns" },
        { content: "Export CSV", url: "/app/export/csv" },
      ]}
    >
      <TitleBar title="ReturnGuard AI" />
      <BlockStack gap="500">
        {error ? (
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {needsProtectedDataAccess
                  ? "Order details need approval"
                  : "Shopify data did not load"}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {error}
              </Text>
              {needsProtectedDataAccess ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Detected orders: {summary.detectedOrders}. Enable Protected
                  Customer Data access in the Shopify Partner Dashboard, then
                  reinstall the app so Shopify grants order details to this
                  access token.
                </Text>
              ) : null}
            </BlockStack>
          </Card>
        ) : null}

        <InlineGrid columns={{ xs: 1, md: 5 }} gap="400">
          {riskCards.map((card) => (
            <Card key={card.label}>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {card.label}
                  </Text>
                  <Badge
                    tone={card.tone as "success" | "attention" | "critical"}
                    toneAndProgressLabelOverride=" "
                  >
                    Live
                  </Badge>
                </InlineStack>
                <Text as="p" variant="heading2xl">
                  {card.value}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {card.change}
                </Text>
              </BlockStack>
            </Card>
          ))}
        </InlineGrid>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      Live return-risk queue
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Recent orders ranked by refund risk, customer context, and
                      operational status.
                    </Text>
                  </BlockStack>
                  <Button url="/app/returns" variant="primary">
                    Open full queue
                  </Button>
                </InlineStack>

                {orders.length ? (
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "numeric",
                      "text",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "Order",
                      "Customer",
                      "Value",
                      "Risk",
                      "Recommendation",
                      "Decision",
                    ]}
                    rows={rows}
                    increasedTableDensity
                  />
                ) : (
                  <Box
                    padding="600"
                    background="bg-surface-active"
                    borderRadius="200"
                  >
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        No recent orders found
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {summary.detectedOrders
                          ? `${summary.detectedOrders} order found, but details are locked until Protected Customer Data access is enabled.`
                          : "Create a test order in Shopify, then refresh this page to see ReturnGuard score it."}
                      </Text>
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Signal confidence
                  </Text>
                  <Text as="p" variant="headingXl">
                    {summary.confidence}%
                  </Text>
                  <ProgressBar progress={summary.confidence} tone="success" />
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Calculated from order value, payment status, fulfillment
                    status, and customer order history.
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Active playbooks
                  </Text>
                  {playbooks.map((playbook) => (
                    <Box
                      key={playbook}
                      padding="300"
                      background="bg-surface-active"
                      borderRadius="200"
                    >
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone="success" toneAndProgressLabelOverride=" ">
                          On
                        </Badge>
                        <Text as="span" variant="bodyMd">
                          {playbook}
                        </Text>
                      </InlineStack>
                    </Box>
                  ))}
                  <Button url="/app/playbooks">Manage playbooks</Button>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    Recent actions
                  </Text>
                  {recentActions.slice(0, 5).map((action) => (
                    <InlineStack key={action.id} align="space-between">
                      <Text as="span" variant="bodySm">
                        {action.orderName}
                      </Text>
                      <Badge
                        tone={getDecisionTone(action.decision)}
                        toneAndProgressLabelOverride=" "
                      >
                        {getDecisionLabel(action.decision)}
                      </Badge>
                    </InlineStack>
                  ))}
                  {!recentActions.length ? (
                    <Text as="p" variant="bodySm" tone="subdued">
                      No moderation actions yet.
                    </Text>
                  ) : null}
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

function RiskMeter({ order }: { order: RiskOrder }) {
  return (
    <InlineStack gap="200" align="start">
      <Badge
        tone={
          order.risk > 80
            ? "critical"
            : order.risk >= 60
              ? "attention"
              : "success"
        }
        toneAndProgressLabelOverride=" "
      >
        {String(order.risk)}
      </Badge>
      <Box minWidth="120px">
        <ProgressBar
          progress={order.risk}
          size="small"
          tone={
            order.risk > 80
              ? "critical"
              : order.risk >= 60
                ? "highlight"
                : "success"
          }
        />
      </Box>
    </InlineStack>
  );
}

function DecisionControls({ order }: { order: RiskOrder }) {
  const fetcher = useFetcher<typeof action>();
  const isSaving = fetcher.state !== "idle";
  const currentDecision =
    fetcher.formData?.get("decision")?.toString() || order.savedDecision;

  return (
    <BlockStack gap="200">
      <InlineStack gap="200">
        <DecisionButton
          decision="approved"
          label="Approve"
          order={order}
          pressed={currentDecision === "approved"}
          loading={isSaving && fetcher.formData?.get("decision") === "approved"}
          tone="success"
          fetcher={fetcher}
        />
        <DecisionButton
          decision="review"
          label="Review"
          order={order}
          pressed={currentDecision === "review"}
          loading={isSaving && fetcher.formData?.get("decision") === "review"}
          fetcher={fetcher}
        />
        <DecisionButton
          decision="hold"
          label="Hold"
          order={order}
          pressed={currentDecision === "hold"}
          loading={isSaving && fetcher.formData?.get("decision") === "hold"}
          tone="critical"
          fetcher={fetcher}
        />
      </InlineStack>
      {currentDecision ? (
        <Badge
          tone={getDecisionTone(currentDecision)}
          toneAndProgressLabelOverride=" "
        >
          {getDecisionLabel(currentDecision)}
        </Badge>
      ) : (
        <Text as="span" variant="bodySm" tone="subdued">
          No decision yet
        </Text>
      )}
    </BlockStack>
  );
}

function DecisionButton({
  decision,
  fetcher,
  label,
  loading,
  order,
  pressed,
  tone,
}: {
  decision: string;
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
  label: string;
  loading: boolean;
  order: RiskOrder;
  pressed: boolean;
  tone?: "critical" | "success";
}) {
  return (
    <fetcher.Form method="post">
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="orderName" value={order.name} />
      <input type="hidden" name="risk" value={order.risk} />
      <input type="hidden" name="decision" value={decision} />
      <Button
        submit
        loading={loading}
        pressed={pressed}
        size="micro"
        tone={tone}
        variant={pressed ? "primary" : "secondary"}
      >
        {label}
      </Button>
    </fetcher.Form>
  );
}
