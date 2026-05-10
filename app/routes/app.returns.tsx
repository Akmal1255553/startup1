import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
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
  deleteDecisionEvent,
  saveBulkReturnDecisions,
  saveReturnDecision,
} from "../models/return-risk.server";
import {
  loadReturnsQueuePage,
  type ReturnsQueueParams,
} from "../models/returns-queue.server";
import {
  getDecisionLabel,
  getDecisionTone,
  getMoneyFormatter,
  type RiskOrder,
} from "../models/return-risk";
import {
  readSafeFormData,
  toActionFailure,
} from "../lib/validation.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const params: ReturnsQueueParams = {
    cursor: url.searchParams.get("cursor"),
    direction: parseDirection(url.searchParams.get("direction")),
    query: url.searchParams.get("q"),
    pageSize: Number(url.searchParams.get("pageSize")) || null,
  };

  return loadReturnsQueuePage(admin, session.shop, params);
};

function parseDirection(
  value: string | null,
): "next" | "prev" | null {
  if (value === "next" || value === "prev") return value;
  return null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  let formData: FormData;
  try {
    formData = await readSafeFormData(request);
  } catch (error) {
    return toActionFailure(error);
  }

  const intent = String(formData.get("intent") || "single");
  try {
    if (intent === "bulk") {
      return await saveBulkReturnDecisions(session.shop, formData);
    }
    if (intent === "delete-event") {
      return await deleteDecisionEvent(session.shop, formData);
    }
    return await saveReturnDecision(session.shop, formData);
  } catch (error) {
    return toActionFailure(error);
  }
};

export default function ReturnsQueuePage() {
  const {
    orders,
    summary,
    settings,
    error,
    recentActions,
    pageInfo,
    searchQuery,
    pageSize,
    sourceOrderCount,
  } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const moneyFormatter = getMoneyFormatter(summary.currencyCode);

  const [searchValue, setSearchValue] = useState(searchQuery);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortValue, setSortValue] = useState("risk_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Keep local search input in sync if user navigates via cursor with same query.
  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  // Clear bulk selection on page change to avoid acting on hidden orders.
  useEffect(() => {
    setSelectedIds([]);
  }, [orders]);

  const filteredOrders = useMemo(
    () => applyFilters(orders, selectedFilter, settings),
    [orders, selectedFilter, settings],
  );
  const sortedOrders = useMemo(
    () => applySort(filteredOrders, sortValue),
    [filteredOrders, sortValue],
  );

  const selectedRows = useMemo(
    () => sortedOrders.filter((row) => selectedIds.includes(row.id)),
    [sortedOrders, selectedIds],
  );

  const navigateWithParams = (overrides: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    navigate(`?${next.toString()}`);
  };

  const handleSearchSubmit = () => {
    navigateWithParams({
      q: searchValue.trim() || null,
      cursor: null,
      direction: null,
    });
  };

  const handlePageSizeChange = (next: string) => {
    navigateWithParams({
      pageSize: next,
      cursor: null,
      direction: null,
    });
  };

  const handleNextPage = () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) return;
    navigateWithParams({
      cursor: pageInfo.endCursor,
      direction: "next",
    });
  };

  const handlePreviousPage = () => {
    if (!pageInfo.hasPreviousPage || !pageInfo.startCursor) return;
    navigateWithParams({
      cursor: pageInfo.startCursor,
      direction: "prev",
    });
  };

  // Memoizing the row builder avoids reconstructing the React element tree
  // on unrelated state changes (search input, sort dropdown, etc.).
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const rows = useMemo(
    () =>
      sortedOrders.map((order) => [
        <BlockStack key={`${order.id}-order`} gap="050">
          <InlineStack gap="200" blockAlign="start">
            <Checkbox
              label=""
              checked={selectedIdSet.has(order.id)}
              onChange={(next) =>
                setSelectedIds((current) =>
                  next
                    ? [...current, order.id]
                    : current.filter((id) => id !== order.id),
                )
              }
            />
            <BlockStack gap="050">
              <InlineStack gap="200" blockAlign="center">
                <Text as="p" variant="bodyMd">
                  <strong>{order.returnName ?? "Return"}</strong>
                  {order.returnStatus
                    ? ` · ${order.returnStatus
                        .split("_")
                        .join(" ")
                        .toLowerCase()}`
                    : ""}
                </Text>
              </InlineStack>
              <Button url={order.adminPath} target="_blank" variant="plain">
                {order.name}
              </Button>
            </BlockStack>
          </InlineStack>
          <Text as="span" variant="bodySm" tone="subdued">
            Return opened {new Date(order.createdAt).toLocaleDateString("en-US")}
            {typeof order.returnQuantity === "number"
              ? ` · ${order.returnQuantity} unit(s)`
              : ""}
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
      ]),
    [sortedOrders, selectedIdSet, moneyFormatter],
  );

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
              <Box minWidth="320px">
                <TextField
                  label="Search queue"
                  labelHidden
                  placeholder="Search by order (#1001) or return name"
                  autoComplete="off"
                  value={searchValue}
                  onChange={setSearchValue}
                  onBlur={handleSearchSubmit}
                  connectedRight={
                    <Button
                      onClick={handleSearchSubmit}
                      loading={isLoading && navigation.location?.search.includes("q=")}
                    >
                      Search
                    </Button>
                  }
                />
              </Box>
              <InlineStack gap="200">
                <Select
                  label="Filter"
                  labelHidden
                  options={[
                    { label: "All on this page", value: "all" },
                    { label: "Hold", value: "hold" },
                    { label: "Review", value: "review" },
                    { label: "Approved", value: "approved" },
                    { label: "Undecided", value: "undecided" },
                  ]}
                  value={selectedFilter}
                  onChange={setSelectedFilter}
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
                <Select
                  label="Page size"
                  labelHidden
                  options={[
                    { label: "10 per page", value: "10" },
                    { label: "25 per page", value: "25" },
                    { label: "50 per page", value: "50" },
                    { label: "100 per page", value: "100" },
                  ]}
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                />
              </InlineStack>
            </InlineStack>
            {searchQuery ? (
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  Filtered by Shopify search: "{searchQuery}"
                </Text>
                <Button
                  variant="plain"
                  onClick={() => {
                    setSearchValue("");
                    navigateWithParams({
                      q: null,
                      cursor: null,
                      direction: null,
                    });
                  }}
                >
                  Clear
                </Button>
              </InlineStack>
            ) : null}
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
                  Showing {sortedOrders.length} return
                  {sortedOrders.length === 1 ? "" : "s"} on this page (from{" "}
                  {sourceOrderCount} Shopify order
                  {sourceOrderCount === 1 ? "" : "s"}
                  {/* pagination counts orders */}
                  ).
                </Text>
              </BlockStack>
              <Badge tone="attention" toneAndProgressLabelOverride=" ">
                {`${summary.reviewCount + summary.holdCount} needs action`}
              </Badge>
            </InlineStack>

            {sortedOrders.length ? (
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
                  "Return · order",
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
                  {orders.length
                    ? "No returns on this page match the local filter."
                    : "No Shopify returns matched this query. Clear the search, try another page, or create/open a test return in Shopify Admin (Orders → Return items). Requires read_returns scope and a reinstall after scopes change."}
                </Text>
              </Box>
            )}
            <Divider />
            <InlineStack align="space-between" blockAlign="center">
              <BulkDecisionControls selectedRows={selectedRows} />
              <Pagination
                hasPrevious={pageInfo.hasPreviousPage}
                onPrevious={handlePreviousPage}
                hasNext={pageInfo.hasNextPage}
                onNext={handleNextPage}
              />
            </InlineStack>
          </BlockStack>
        </Card>
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingMd">
                Recent decision history
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {recentActions.length
                  ? `${recentActions.length} entries`
                  : "No entries"}
              </Text>
            </InlineStack>
            {recentActions.length ? (
              recentActions.map((entry) => (
                <DecisionHistoryRow key={entry.id} entry={entry} />
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
      <input type="hidden" name="orderId" value={order.orderId} />
      <input type="hidden" name="orderName" value={order.name} />
      <input type="hidden" name="returnId" value={order.returnId ?? ""} />
      <input type="hidden" name="returnName" value={order.returnName ?? ""} />
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

function BulkDecisionControls({ selectedRows }: { selectedRows: RiskOrder[] }) {
  if (!selectedRows.length) {
    return (
      <Text as="p" variant="bodySm" tone="subdued">
        Select returns to run bulk decisions.
      </Text>
    );
  }

  return (
    <InlineStack gap="200">
      <BulkForm
        selectedRows={selectedRows}
        decision="approved"
        label="Bulk approve"
      />
      <BulkForm selectedRows={selectedRows} decision="review" label="Bulk review" />
      <BulkForm
        selectedRows={selectedRows}
        decision="hold"
        label="Bulk hold"
        tone="critical"
        confirmMessage="Apply HOLD to selected returns?"
      />
    </InlineStack>
  );
}

function BulkForm({
  confirmMessage,
  decision,
  label,
  selectedRows,
  tone,
}: {
  confirmMessage?: string;
  decision: "approved" | "review" | "hold";
  label: string;
  selectedRows: RiskOrder[];
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
        count ? `Updated ${count} return row(s)` : "Bulk action applied",
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
      {selectedRows.map((row) => (
        <input key={row.id} type="hidden" name="bulkOrderIds" value={row.orderId} />
      ))}
      {selectedRows.map((row) => (
        <input key={`${row.id}-ret`} type="hidden" name="bulkReturnIds" value={row.returnId ?? ""} />
      ))}
      <Button submit size="micro" tone={tone}>
        {label}
      </Button>
    </fetcher.Form>
  );
}

type DecisionHistoryEntry = {
  id: string;
  orderName: string;
  decision: string;
  previousDecision: string | null;
  createdAt: string;
  risk: number | null;
};

function DecisionHistoryRow({ entry }: { entry: DecisionHistoryEntry }) {
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isDeleting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      shopify.toast.show("History entry removed");
    }
  }, [fetcher.data, shopify.toast]);

  return (
    <InlineStack align="space-between" blockAlign="center" gap="300">
      <BlockStack gap="050">
        <Text as="p" variant="bodyMd">
          {entry.orderName}
        </Text>
        <Text as="span" variant="bodySm" tone="subdued">
          {new Date(entry.createdAt).toLocaleString("en-US")}
        </Text>
      </BlockStack>
      <InlineStack gap="200" blockAlign="center">
        {entry.previousDecision ? (
          <Badge tone="attention" toneAndProgressLabelOverride=" ">
            {getDecisionLabel(entry.previousDecision)}
          </Badge>
        ) : null}
        <Badge
          tone={getDecisionTone(entry.decision)}
          toneAndProgressLabelOverride=" "
        >
          {getDecisionLabel(entry.decision)}
        </Badge>
        <fetcher.Form
          method="post"
          onSubmit={(event) => {
            if (!window.confirm("Remove this history entry?")) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="intent" value="delete-event" />
          <input type="hidden" name="eventId" value={entry.id} />
          <Button
            submit
            accessibilityLabel="Delete history entry"
            tone="critical"
            variant="tertiary"
            size="micro"
            loading={isDeleting}
          >
            Delete
          </Button>
        </fetcher.Form>
      </InlineStack>
    </InlineStack>
  );
}
