import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineStack,
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  return loadReturnRiskData(admin, session.shop);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  return saveReturnDecision(session.shop, formData);
};

export default function ReturnsQueuePage() {
  const { orders, summary, settings, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";
  const moneyFormatter = getMoneyFormatter(summary.currencyCode);
  const filteredOrders = filterOrders(orders, activeFilter, settings);

  const rows = filteredOrders.map((order) => [
    <BlockStack key={`${order.id}-order`} gap="050">
      <Button url={order.adminPath} target="_blank" variant="plain">
        {order.name}
      </Button>
      <Text as="span" variant="bodySm" tone="subdued">
        {new Date(order.createdAt).toLocaleDateString("en-US")}
      </Text>
    </BlockStack>,
    <BlockStack key={`${order.id}-customer`} gap="050">
      <Text as="span" variant="bodyMd">
        {order.customer}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {order.customerOrders} lifetime orders
      </Text>
    </BlockStack>,
    moneyFormatter.format(order.value),
    <RiskMeter key={`${order.id}-risk`} order={order} />,
    order.recommendation,
    <DecisionControls key={`${order.id}-decision`} order={order} />,
  ]);

  return (
    <Page
      title="Returns Queue"
      subtitle="A focused workspace for reviewing refund risk before margin leaves the store"
      primaryAction={{ content: "Export CSV", url: "/app/export/csv" }}
      secondaryActions={[{ content: "Risk settings", url: "/app/settings" }]}
    >
      <TitleBar title="Returns Queue" />
      <BlockStack gap="500">
        {error ? (
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Shopify data did not load
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {error}
              </Text>
            </BlockStack>
          </Card>
        ) : null}

        <Card>
          <InlineStack gap="200" align="start">
            {[
              ["all", "All"],
              ["hold", "Hold"],
              ["review", "Review"],
              ["approved", "Approved"],
              ["undecided", "Undecided"],
            ].map(([key, label]) => (
              <Button
                key={key}
                pressed={activeFilter === key}
                onClick={() =>
                  setSearchParams(key === "all" ? {} : { filter: key })
                }
              >
                {label}
              </Button>
            ))}
          </InlineStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Review workload
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Showing {filteredOrders.length} of {orders.length} recent
                  Shopify orders.
                </Text>
              </BlockStack>
              <Badge tone="attention" toneAndProgressLabelOverride=" ">
                {`${summary.reviewCount + summary.holdCount} needs action`}
              </Badge>
            </InlineStack>

            {filteredOrders.length ? (
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
                <Text as="p" variant="bodyMd" tone="subdued">
                  No orders match this queue filter.
                </Text>
              </Box>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

function filterOrders(
  orders: RiskOrder[],
  filter: string,
  settings: { reviewRiskThreshold: number; holdRiskThreshold: number },
) {
  if (filter === "hold") {
    return orders.filter((order) => order.risk >= settings.holdRiskThreshold);
  }

  if (filter === "review") {
    return orders.filter(
      (order) =>
        order.risk >= settings.reviewRiskThreshold &&
        order.risk < settings.holdRiskThreshold,
    );
  }

  if (filter === "approved") {
    return orders.filter((order) => order.savedDecision === "approved");
  }

  if (filter === "undecided") {
    return orders.filter((order) => !order.savedDecision);
  }

  return orders;
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
