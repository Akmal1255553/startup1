import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  DataTable,
  Divider,
  InlineStack,
  Pagination,
  Page,
  Select,
  TextField,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useEffect, useMemo, useState } from "react";

import { authenticate } from "../shopify.server";
import {
  loadReturnRiskData,
  saveBulkReturnDecisions,
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
  const intent = String(formData.get("intent") || "single");
  if (intent === "bulk") {
    return saveBulkReturnDecisions(session.shop, formData);
  }
  return saveReturnDecision(session.shop, formData);
};

export default function ReturnsQueuePage() {
  const { orders, summary, settings, error, recentActions } =
    useLoaderData<typeof loader>();
  const moneyFormatter = getMoneyFormatter(summary.currencyCode);
  const [queryValue, setQueryValue] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortValue, setSortValue] = useState("risk_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pageSize = 10;

  const filteredOrders = useMemo(
    () => applyFilters(orders, selectedFilter, queryValue, settings),
    [orders, queryValue, selectedFilter, settings],
  );
  const sortedOrders = useMemo(
    () => applySort(filteredOrders, sortValue),
    [filteredOrders, sortValue],
  );
  const pageCount = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const pagedOrders = sortedOrders.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const rows = pagedOrders.map((order) => [
    <BlockStack key={`${order.id}-order`} gap="050">
      <InlineStack gap="200" blockAlign="center">
        <Checkbox
          label=""
          checked={selectedIds.includes(order.id)}
          onChange={(next) =>
            setSelectedIds((current) =>
              next
                ? [...current, order.id]
                : current.filter((id) => id !== order.id),
            )
          }
        />
        <Button url={order.adminPath} target="_blank" variant="plain">
          {order.name}
        </Button>
      </InlineStack>
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
    <BlockStack key={`${order.id}-reason`} gap="100">
      <Text as="span" variant="bodyMd">
        {order.recommendation}
      </Text>
      <Text as="span" variant="bodySm" tone="subdued">
        {order.factors.slice(0, 2).join(", ")}
      </Text>
    </BlockStack>,
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
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <TextField
                label="Search queue"
                labelHidden
                placeholder="Search by order, customer, email"
                autoComplete="off"
                value={queryValue}
                onChange={(value) => {
                  setQueryValue(value);
                  setCurrentPage(1);
                }}
              />
              <InlineStack gap="200">
                <Select
                  label="Filter"
                  labelHidden
                  options={[
                    { label: "All", value: "all" },
                    { label: "Hold", value: "hold" },
                    { label: "Review", value: "review" },
                    { label: "Approved", value: "approved" },
                    { label: "Undecided", value: "undecided" },
                  ]}
                  value={selectedFilter}
                  onChange={(value) => {
                    setSelectedFilter(value);
                    setCurrentPage(1);
                  }}
                />
                <Select
                  label="Sort"
                  labelHidden
                  options={[
                    { label: "Risk high to low", value: "risk_desc" },
                    { label: "Risk low to high", value: "risk_asc" },
                    { label: "Value high to low", value: "value_desc" },
                    { label: "Newest first", value: "created_desc" },
                    { label: "Oldest first", value: "created_asc" },
                  ]}
                  value={sortValue}
                  onChange={setSortValue}
                />
              </InlineStack>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Review workload
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Showing {pagedOrders.length} of {sortedOrders.length} filtered
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
            <Divider />
            <InlineStack align="space-between" blockAlign="center">
              <BulkDecisionControls selectedIds={selectedIds} />
              <Pagination
                hasPrevious={safePage > 1}
                onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                hasNext={safePage < pageCount}
                onNext={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              />
            </InlineStack>
          </BlockStack>
        </Card>
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              Recent decision history
            </Text>
            {recentActions.length ? (
              recentActions.map((action) => (
                <InlineStack key={action.id} align="space-between">
                  <Text as="p" variant="bodyMd">
                    {action.orderName}
                  </Text>
                  <InlineStack gap="200">
                    {action.previousDecision ? (
                      <Badge tone="attention" toneAndProgressLabelOverride=" ">
                        {getDecisionLabel(action.previousDecision)}
                      </Badge>
                    ) : null}
                    <Badge tone={getDecisionTone(action.decision)} toneAndProgressLabelOverride=" ">
                      {getDecisionLabel(action.decision)}
                    </Badge>
                  </InlineStack>
                </InlineStack>
              ))
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                No decision history yet.
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

function applyFilters(
  orders: RiskOrder[],
  filter: string,
  query: string,
  settings: { reviewRiskThreshold: number; holdRiskThreshold: number },
) {
  const lowered = query.trim().toLowerCase();
  const searched = lowered
    ? orders.filter((order) =>
        `${order.name} ${order.customer} ${order.email || ""}`
          .toLowerCase()
          .includes(lowered),
      )
    : orders;

  if (filter === "hold") {
    return searched.filter((order) => order.risk >= settings.holdRiskThreshold);
  }

  if (filter === "review") {
    return searched.filter(
      (order) =>
        order.risk >= settings.reviewRiskThreshold &&
        order.risk < settings.holdRiskThreshold,
    );
  }

  if (filter === "approved") {
    return searched.filter((order) => order.savedDecision === "approved");
  }

  if (filter === "undecided") {
    return searched.filter((order) => !order.savedDecision);
  }

  return searched;
}

function applySort(orders: RiskOrder[], sort: string) {
  const cloned = [...orders];
  if (sort === "risk_asc") return cloned.sort((a, b) => a.risk - b.risk);
  if (sort === "value_desc") return cloned.sort((a, b) => b.value - a.value);
  if (sort === "created_asc") {
    return cloned.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }
  if (sort === "created_desc") {
    return cloned.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  return cloned.sort((a, b) => b.risk - a.risk);
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
  const shopify = useAppBridge();
  const isSaving = fetcher.state !== "idle";
  const currentDecision =
    fetcher.formData?.get("decision")?.toString() || order.savedDecision;

  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      shopify.toast.show("Decision saved");
    }
  }, [fetcher.data, shopify.toast]);

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
      {order.appliedPlaybooks.length ? (
        <Text as="span" variant="bodySm" tone="subdued">
          Playbook: {order.appliedPlaybooks.join(", ")}
        </Text>
      ) : null}
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
      <input type="hidden" name="intent" value="single" />
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

function BulkDecisionControls({ selectedIds }: { selectedIds: string[] }) {
  if (!selectedIds.length) {
    return (
      <Text as="p" variant="bodySm" tone="subdued">
        Select rows to run bulk decisions.
      </Text>
    );
  }

  return (
    <InlineStack gap="200">
      <BulkForm selectedIds={selectedIds} decision="approved" label="Bulk approve" />
      <BulkForm selectedIds={selectedIds} decision="review" label="Bulk review" />
      <BulkForm
        selectedIds={selectedIds}
        decision="hold"
        label="Bulk hold"
        tone="critical"
        confirmMessage="Apply HOLD to selected orders?"
      />
    </InlineStack>
  );
}

function BulkForm({
  confirmMessage,
  decision,
  label,
  selectedIds,
  tone,
}: {
  confirmMessage?: string;
  decision: "approved" | "review" | "hold";
  label: string;
  selectedIds: string[];
  tone?: "critical";
}) {
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      const count =
        "count" in fetcher.data && typeof fetcher.data.count === "number"
          ? fetcher.data.count
          : null;
      shopify.toast.show(
        count ? `Updated ${count} orders` : "Bulk action applied",
      );
    }
  }, [fetcher.data, shopify.toast]);

  return (
    <fetcher.Form
      method="post"
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="intent" value="bulk" />
      <input type="hidden" name="decision" value={decision} />
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="orderIds" value={id} />
      ))}
      <Button submit size="micro" tone={tone}>
        {label}
      </Button>
    </fetcher.Form>
  );
}
