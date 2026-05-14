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
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  DataTable,
  Divider,
  InlineStack,
  List,
  Modal,
  Pagination,
  Page,
  Select,
  Spinner,
  TextField,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { loadCapabilities } from "../models/plan-gating.server";
import { describePlanContext, type PlanCapabilities } from "../billing/capabilities";
import { actionFailure } from "../lib/action-result";
import type { loader as detailLoader } from "./app.returns.detail";
import { useCsvExport } from "../hooks/use-csv-export";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
  const url = new URL(request.url);
  const requestedPageSize = Number(url.searchParams.get("pageSize")) || null;
  const clampedPageSize = requestedPageSize
    ? Math.min(requestedPageSize, capabilities.maxQueuePageSize)
    : null;
  const params: ReturnsQueueParams = {
    cursor: url.searchParams.get("cursor"),
    direction: parseDirection(url.searchParams.get("direction")),
    query: url.searchParams.get("q"),
    pageSize: clampedPageSize,
  };

  const page = await loadReturnsQueuePage(admin, session.shop, params);
  return { ...page, capabilities };
};

function parseDirection(
  value: string | null,
): "next" | "prev" | null {
  if (value === "next" || value === "prev") return value;
  return null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
  let formData: FormData;
  try {
    formData = await readSafeFormData(request);
  } catch (error) {
    return toActionFailure(error);
  }

  const intent = String(formData.get("intent") || "single");
  try {
    if (intent === "bulk") {
      if (!capabilities.canBulkAct) {
        return actionFailure(
          "Bulk moderation is available on the Growth and Scale plans. Open Billing to upgrade.",
        );
      }
      return await saveBulkReturnDecisions(session.shop, formData);
    }
    if (intent === "delete-event") {
      if (!capabilities.canUseAuditLog) {
        return actionFailure(
          "Decision history is available on the Growth and Scale plans.",
        );
      }
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
    hasExpandedReturns,
    capabilities,
  } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const moneyFormatter = getMoneyFormatter(summary.currencyCode);
  const csvExport = useCsvExport();

  const [searchValue, setSearchValue] = useState(searchQuery);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortValue, setSortValue] = useState("risk_desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailRow, setDetailRow] = useState<RiskOrder | null>(null);
  const detailFetcher = useFetcher<typeof detailLoader>();
  const isDetailLoading = detailFetcher.state !== "idle";

  const openDetail = useCallback(
    (order: RiskOrder) => {
      setDetailRow(order);
      const params = new URLSearchParams({ orderId: order.orderId });
      if (order.returnId) params.set("returnId", order.returnId);
      detailFetcher.load(`/app/returns/detail?${params.toString()}`);
    },
    [detailFetcher],
  );

  const closeDetail = useCallback(() => {
    setDetailRow(null);
  }, []);

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
          <Box>
            <Button variant="plain" onClick={() => openDetail(order)}>
              View details
            </Button>
          </Box>
        </BlockStack>,
        <DecisionControls key={`${order.id}-decision`} order={order} />,
      ]),
    [sortedOrders, selectedIdSet, moneyFormatter, openDetail],
  );

  return (
    <Page
      title="Returns Queue"
      subtitle="A focused workspace for reviewing refund risk before margin leaves the store"
      primaryAction={
        !capabilities.canExportCsv || csvExport.needsUpgrade
          ? { content: "Export CSV (upgrade)", url: "/app/billing" }
          : {
              content: csvExport.isExporting ? "Preparing CSV…" : "Export CSV",
              onAction: csvExport.exportCsv,
              loading: csvExport.isExporting,
              disabled: csvExport.isExporting,
            }
      }
      secondaryActions={[{ content: "Risk settings", url: "/app/settings" }]}
    >
      <TitleBar title="Returns Queue" />
      <BlockStack gap="500">
        <PlanBanner capabilities={capabilities} />
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
                  options={getPageSizeOptions(capabilities.maxQueuePageSize)}
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
                  Showing {sortedOrders.length} queue row
                  {sortedOrders.length === 1 ? "" : "s"} from {sourceOrderCount}{" "}
                  Shopify order
                  {sourceOrderCount === 1 ? "" : "s"} on this page.
                  {!hasExpandedReturns && sortedOrders.length
                    ? " No Return records loaded for these orders — triage is shown at order level (refresh after creating a Return in Admin)."
                    : null}
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
                    ? "No rows on this page match the local filter."
                    : "No orders on this page. Clear the search, change page size, or use pagination — data is refreshed from Shopify on each navigation."}
                </Text>
              </Box>
            )}
            <Divider />
            <InlineStack align="space-between" blockAlign="center">
              <BulkDecisionControls
                selectedRows={selectedRows}
                capabilities={capabilities}
              />
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
      <ReturnDetailModal
        row={detailRow}
        events={detailFetcher.data?.events ?? []}
        isLoading={isDetailLoading}
        moneyFormatter={moneyFormatter}
        onClose={closeDetail}
      />
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

function BulkDecisionControls({
  selectedRows,
  capabilities,
}: {
  selectedRows: RiskOrder[];
  capabilities: PlanCapabilities;
}) {
  if (!capabilities.canBulkAct) {
    return (
      <InlineStack gap="200" blockAlign="center">
        <Text as="p" variant="bodySm" tone="subdued">
          Bulk actions are available on Growth and Scale.
        </Text>
        <Button url="/app/billing" variant="plain">
          Upgrade plan
        </Button>
      </InlineStack>
    );
  }

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

type DetailEvent = {
  id: string;
  decision: string;
  previousDecision: string | null;
  risk: number | null;
  reason: string | null;
  createdAt: string;
  orderName: string | null;
  returnId: string | null;
};

function ReturnDetailModal({
  row,
  events,
  isLoading,
  moneyFormatter,
  onClose,
}: {
  row: RiskOrder | null;
  events: DetailEvent[];
  isLoading: boolean;
  moneyFormatter: Intl.NumberFormat;
  onClose: () => void;
}) {
  if (!row) {
    return (
      <Modal open={false} onClose={onClose} title="">
        <Modal.Section>{null}</Modal.Section>
      </Modal>
    );
  }

  const accountAgeLabel =
    row.accountAgeDays === null
      ? "Unknown account age"
      : row.accountAgeDays === 0
        ? "Created today"
        : `${row.accountAgeDays} day${row.accountAgeDays === 1 ? "" : "s"} old account`;

  const riskTone: "critical" | "attention" | "success" =
    row.risk > 80 ? "critical" : row.risk >= 60 ? "attention" : "success";

  const title = row.returnName
    ? `${row.returnName} · ${row.name}`
    : `Return triage · ${row.name}`;

  return (
    <Modal open onClose={onClose} title={title} size="large">
      <Modal.Section>
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="start">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Risk overview
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Suggested action: {row.recommendation}
                  </Text>
                </BlockStack>
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone={riskTone} toneAndProgressLabelOverride=" ">
                    {`Risk ${row.risk}`}
                  </Badge>
                  {row.savedDecision ? (
                    <Badge
                      tone={getDecisionTone(row.savedDecision)}
                      toneAndProgressLabelOverride=" "
                    >
                      {getDecisionLabel(row.savedDecision)}
                    </Badge>
                  ) : (
                    <Badge tone="attention" toneAndProgressLabelOverride=" ">
                      No decision yet
                    </Badge>
                  )}
                </InlineStack>
              </InlineStack>
              <Box>
                <ProgressBar
                  progress={row.risk}
                  size="small"
                  tone={
                    row.risk > 80
                      ? "critical"
                      : row.risk >= 60
                        ? "highlight"
                        : "success"
                  }
                />
              </Box>
              <DecisionControls order={row} />
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Customer
              </Text>
              <InlineStack gap="400" wrap>
                <DetailMetric label="Name" value={row.customer} />
                <DetailMetric label="Email" value={row.email ?? "Not shared"} />
                <DetailMetric
                  label="Lifetime orders"
                  value={String(row.customerOrders)}
                />
                <DetailMetric label="Account age" value={accountAgeLabel} />
              </InlineStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Order context
              </Text>
              <InlineStack gap="400" wrap>
                <DetailMetric
                  label="Order value"
                  value={moneyFormatter.format(row.value)}
                />
                <DetailMetric label="Payment" value={row.financialStatus} />
                <DetailMetric label="Fulfillment" value={row.fulfillmentStatus} />
                <DetailMetric
                  label="Opened"
                  value={new Date(row.createdAt).toLocaleString("en-US")}
                />
                {row.returnStatus ? (
                  <DetailMetric
                    label="Return status"
                    value={row.returnStatus.split("_").join(" ").toLowerCase()}
                  />
                ) : null}
                {typeof row.returnQuantity === "number" ? (
                  <DetailMetric
                    label="Return quantity"
                    value={`${row.returnQuantity} unit(s)`}
                  />
                ) : null}
              </InlineStack>
              <Box>
                <Button url={row.adminPath} target="_blank" variant="plain">
                  Open in Shopify Admin
                </Button>
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" gap="200">
                <Text as="h3" variant="headingSm">
                  ReturnGuard analysis
                </Text>
                <Badge tone="success" toneAndProgressLabelOverride=" ">
                  AI
                </Badge>
              </InlineStack>
              <Text as="p" variant="bodyMd">
                {row.narrative}
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                Risk factors
              </Text>
              {row.riskReasons.length ? (
                <BlockStack gap="200">
                  {row.riskReasons.map((reason, index) => (
                    <InlineStack
                      key={`${reason.label}-${index}`}
                      align="space-between"
                      blockAlign="center"
                      gap="200"
                    >
                      <InlineStack gap="200" blockAlign="center">
                        <Badge toneAndProgressLabelOverride=" ">
                          {reason.category}
                        </Badge>
                        <Text as="span" variant="bodyMd">
                          {reason.label}
                        </Text>
                      </InlineStack>
                      <Text
                        as="span"
                        variant="bodySm"
                        tone={reason.points > 0 ? "critical" : "subdued"}
                      >
                        {reason.points > 0 ? `+${reason.points}` : "0"}
                      </Text>
                    </InlineStack>
                  ))}
                </BlockStack>
              ) : (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No risk factors recorded for this row.
                </Text>
              )}
              {row.appliedPlaybooks.length ? (
                <Box paddingBlockStart="200">
                  <Text as="span" variant="bodySm" tone="subdued">
                    Playbooks applied: {row.appliedPlaybooks.join(", ")}
                  </Text>
                </Box>
              ) : null}
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">
                  Previous decisions on this order
                </Text>
                {isLoading ? <Spinner size="small" /> : null}
              </InlineStack>
              {events.length ? (
                <List type="bullet">
                  {events.map((event) => (
                    <List.Item key={event.id}>
                      <InlineStack gap="200" blockAlign="center" wrap>
                        <Text as="span" variant="bodyMd">
                          {new Date(event.createdAt).toLocaleString("en-US")}
                        </Text>
                        {event.previousDecision ? (
                          <Badge
                            tone={getDecisionTone(event.previousDecision)}
                            toneAndProgressLabelOverride=" "
                          >
                            {getDecisionLabel(event.previousDecision)}
                          </Badge>
                        ) : null}
                        <Text as="span" variant="bodySm" tone="subdued">
                          →
                        </Text>
                        <Badge
                          tone={getDecisionTone(event.decision)}
                          toneAndProgressLabelOverride=" "
                        >
                          {getDecisionLabel(event.decision)}
                        </Badge>
                        {typeof event.risk === "number" ? (
                          <Text as="span" variant="bodySm" tone="subdued">
                            risk {event.risk}
                          </Text>
                        ) : null}
                        {event.returnId && event.returnId !== row.returnId ? (
                          <Text as="span" variant="bodySm" tone="subdued">
                            (other return on same order)
                          </Text>
                        ) : null}
                      </InlineStack>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {isLoading
                    ? "Loading history…"
                    : "No decisions logged for this order yet."}
                </Text>
              )}
            </BlockStack>
          </Card>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <BlockStack gap="050">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Text as="span" variant="bodyMd">
        {value}
      </Text>
    </BlockStack>
  );
}

function PlanBanner({ capabilities }: { capabilities: PlanCapabilities }) {
  if (capabilities.hasActivePlan && capabilities.canBulkAct) return null;

  if (!capabilities.hasActivePlan) {
    return (
      <Banner
        title="You're on the Free plan"
        tone="info"
        action={{ content: "Compare paid plans", url: "/app/billing" }}
      >
        <p>
          Risk scoring, saving moderation decisions, CSV export, and risk
          settings are included at no cost (queue up to{" "}
          {capabilities.maxQueuePageSize} rows per page). Upgrade to Starter for
          larger pages, or Growth for automation playbooks, bulk actions, and
          the full audit log.
        </p>
      </Banner>
    );
  }

  return (
    <Banner
      title="Bulk moderation locked"
      tone="info"
      action={{ content: "Upgrade plan", url: "/app/billing" }}
    >
      <p>
        {describePlanContext(capabilities)} Bulk actions, automation playbooks,
        and the audit log are available on Growth and Scale.
      </p>
    </Banner>
  );
}

function getPageSizeOptions(maxQueuePageSize: number) {
  return [
    { label: "10 per page", value: "10" },
    { label: "25 per page", value: "25" },
    { label: "50 per page", value: "50" },
    { label: "100 per page", value: "100" },
  ].filter((option) => Number(option.value) <= maxQueuePageSize);
}
