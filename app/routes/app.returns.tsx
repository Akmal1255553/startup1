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
import type { PlanCapabilities } from "../billing/capabilities";
import { actionFailure } from "../lib/action-result";
import { getDateLocale } from "../i18n/date-locale";
import { useI18n } from "../i18n/i18n-context";
import { describePlanContext } from "../i18n/messages/app/common";
import { getReturnsCopy } from "../i18n/messages/app/returns";
import { resolveLocale } from "../i18n/resolver.server";
import type { loader as detailLoader } from "./app.returns.detail";
import { useCsvExport } from "../hooks/use-csv-export";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const locale = await resolveLocale(request);
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

  const page = await loadReturnsQueuePage(admin, session.shop, params, locale);
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
  const locale = await resolveLocale(request);
  const copy = getReturnsCopy(locale);
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
        return actionFailure(copy.errorBulkGated);
      }
      return await saveBulkReturnDecisions(session.shop, formData);
    }
    if (intent === "delete-event") {
      if (!capabilities.canUseAuditLog) {
        return actionFailure(copy.errorHistoryGated);
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
  const {
    pages: { returns: r, common: c },
    locale,
  } = useI18n();
  const dateLocale = getDateLocale(locale);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const moneyFormatter = getMoneyFormatter(summary.currencyCode, dateLocale);
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
                  <strong>{order.returnName ?? r.returnFallback}</strong>
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
            {r.returnOpened(
              new Date(order.createdAt).toLocaleDateString(dateLocale),
              typeof order.returnQuantity === "number" ? order.returnQuantity : 0,
            )}
          </Text>
        </BlockStack>,
        <BlockStack key={`${order.id}-customer`} gap="050">
          <Text as="span" variant="bodyMd">
            {order.customer}
          </Text>
          <Text as="span" variant="bodySm" tone="subdued">
            {r.lifetimeOrders(order.customerOrders)}
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
              {r.viewDetails}
            </Button>
          </Box>
        </BlockStack>,
        <DecisionControls key={`${order.id}-decision`} order={order} />,
      ]),
    [sortedOrders, selectedIdSet, moneyFormatter, openDetail, r, dateLocale],
  );

  return (
    <Page
      title={r.title}
      subtitle={r.subtitle}
      primaryAction={
        !capabilities.canExportCsv || csvExport.needsUpgrade
          ? { content: c.exportCsvUpgrade, url: "/app/billing" }
          : {
              content: csvExport.isExporting
                ? c.exportCsvPreparing
                : c.exportCsv,
              onAction: csvExport.exportCsv,
              loading: csvExport.isExporting,
              disabled: csvExport.isExporting,
            }
      }
      secondaryActions={[{ content: r.riskSettings, url: "/app/settings" }]}
    >
      <TitleBar title={r.title} />
      <BlockStack gap="500">
        <PlanBanner capabilities={capabilities} />
        {error ? (
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {r.errorLoad}
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
                  label={r.searchLabel}
                  labelHidden
                  placeholder={r.searchPlaceholder}
                  autoComplete="off"
                  value={searchValue}
                  onChange={setSearchValue}
                  onBlur={handleSearchSubmit}
                  connectedRight={
                    <Button
                      onClick={handleSearchSubmit}
                      loading={isLoading && navigation.location?.search.includes("q=")}
                    >
                      {c.search}
                    </Button>
                  }
                />
              </Box>
              <InlineStack gap="200">
                <Select
                  label={r.filter}
                  labelHidden
                  options={[
                    { label: r.filterAll, value: "all" },
                    { label: r.filterHold, value: "hold" },
                    { label: r.filterReview, value: "review" },
                    { label: r.filterApproved, value: "approved" },
                    { label: r.filterUndecided, value: "undecided" },
                  ]}
                  value={selectedFilter}
                  onChange={setSelectedFilter}
                />
                <Select
                  label={r.sort}
                  labelHidden
                  options={[
                    { label: r.sortRiskDesc, value: "risk_desc" },
                    { label: r.sortRiskAsc, value: "risk_asc" },
                    { label: r.sortValueDesc, value: "value_desc" },
                    { label: r.sortCreatedDesc, value: "created_desc" },
                    { label: r.sortCreatedAsc, value: "created_asc" },
                  ]}
                  value={sortValue}
                  onChange={setSortValue}
                />
                <Select
                  label={c.pageSize}
                  labelHidden
                  options={getPageSizeOptions(
                    capabilities.maxQueuePageSize,
                    c,
                  )}
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                />
              </InlineStack>
            </InlineStack>
            {searchQuery ? (
              <InlineStack gap="200" blockAlign="center">
                <Text as="span" variant="bodySm" tone="subdued">
                  {r.filteredBy(searchQuery)}
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
                  {r.clear}
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
                  {r.workloadTitle}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {r.workloadSubtitle(sortedOrders.length, sourceOrderCount)}
                  {!hasExpandedReturns && sortedOrders.length
                    ? ` ${r.noReturnsNote}`
                    : null}
                </Text>
              </BlockStack>
              <Badge tone="attention" toneAndProgressLabelOverride=" ">
                {r.needsAction(summary.reviewCount + summary.holdCount)}
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
                  r.colReturn,
                  r.colCustomer,
                  r.colValue,
                  r.colRisk,
                  r.colRecommendation,
                  r.colDecision,
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
                  {orders.length ? r.emptyFiltered : r.emptyPage}
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
                {r.historyTitle}
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                {recentActions.length
                  ? r.historyCount(recentActions.length)
                  : r.historyNoEntries}
              </Text>
            </InlineStack>
            {recentActions.length ? (
              recentActions.map((entry) => (
                <DecisionHistoryRow key={entry.id} entry={entry} />
              ))
            ) : (
              <Text as="p" variant="bodyMd" tone="subdued">
                {r.historyEmpty}
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
  const {
    pages: { returns: r },
    locale,
  } = useI18n();
  const isSaving = fetcher.state !== "idle";
  const currentDecision =
    fetcher.formData?.get("decision")?.toString() || order.savedDecision;

  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      shopify.toast.show(r.toastSaved);
    }
  }, [fetcher.data, shopify.toast, r.toastSaved]);

  return (
    <BlockStack gap="200">
      <InlineStack gap="200">
        <DecisionButton
          decision="approved"
          label={r.approve}
          order={order}
          pressed={currentDecision === "approved"}
          loading={isSaving && fetcher.formData?.get("decision") === "approved"}
          tone="success"
          fetcher={fetcher}
        />
        <DecisionButton
          decision="review"
          label={r.review}
          order={order}
          pressed={currentDecision === "review"}
          loading={isSaving && fetcher.formData?.get("decision") === "review"}
          fetcher={fetcher}
        />
        <DecisionButton
          decision="hold"
          label={r.hold}
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
          {getDecisionLabel(currentDecision, locale)}
        </Badge>
      ) : (
        <Text as="span" variant="bodySm" tone="subdued">
          {r.noDecision}
        </Text>
      )}
      {order.appliedPlaybooks.length ? (
        <Text as="span" variant="bodySm" tone="subdued">
          {r.playbook(order.appliedPlaybooks.join(", "))}
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
  const {
    pages: { returns: r, common: c },
  } = useI18n();

  if (!capabilities.canBulkAct) {
    return (
      <InlineStack gap="200" blockAlign="center">
        <Text as="p" variant="bodySm" tone="subdued">
          {r.bulkLocked}
        </Text>
        <Button url="/app/billing" variant="plain">
          {c.upgradePlan}
        </Button>
      </InlineStack>
    );
  }

  if (!selectedRows.length) {
    return (
      <Text as="p" variant="bodySm" tone="subdued">
        {r.selectPrompt}
      </Text>
    );
  }

  return (
    <InlineStack gap="200">
      <BulkForm
        selectedRows={selectedRows}
        decision="approved"
        label={r.bulkApprove}
      />
      <BulkForm
        selectedRows={selectedRows}
        decision="review"
        label={r.bulkReview}
      />
      <BulkForm
        selectedRows={selectedRows}
        decision="hold"
        label={r.bulkHold}
        tone="critical"
        confirmMessage={r.bulkConfirmHold}
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
  const {
    pages: { returns: r },
  } = useI18n();
  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      const count =
        "count" in fetcher.data && typeof fetcher.data.count === "number"
          ? fetcher.data.count
          : null;
      shopify.toast.show(
        count ? r.toastBulk(count) : r.toastBulkApplied,
      );
    }
  }, [fetcher.data, shopify.toast, r.toastBulk, r.toastBulkApplied]);

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
  const {
    pages: { returns: r },
    locale,
  } = useI18n();
  const dateLocale = getDateLocale(locale);
  const isDeleting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data && "ok" in fetcher.data && fetcher.data.ok) {
      shopify.toast.show(r.toastHistoryRemoved);
    }
  }, [fetcher.data, shopify.toast, r.toastHistoryRemoved]);

  return (
    <InlineStack align="space-between" blockAlign="center" gap="300">
      <BlockStack gap="050">
        <Text as="p" variant="bodyMd">
          {entry.orderName}
        </Text>
        <Text as="span" variant="bodySm" tone="subdued">
          {new Date(entry.createdAt).toLocaleString(dateLocale)}
        </Text>
      </BlockStack>
      <InlineStack gap="200" blockAlign="center">
        {entry.previousDecision ? (
          <Badge tone="attention" toneAndProgressLabelOverride=" ">
            {getDecisionLabel(entry.previousDecision, locale)}
          </Badge>
        ) : null}
        <Badge
          tone={getDecisionTone(entry.decision)}
          toneAndProgressLabelOverride=" "
        >
          {getDecisionLabel(entry.decision, locale)}
        </Badge>
        <fetcher.Form
          method="post"
          onSubmit={(event) => {
            if (!window.confirm(r.historyDeleteConfirm)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="intent" value="delete-event" />
          <input type="hidden" name="eventId" value={entry.id} />
          <Button
            submit
            accessibilityLabel={r.historyDeleteAria}
            tone="critical"
            variant="tertiary"
            size="micro"
            loading={isDeleting}
          >
            {r.historyDelete}
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
  const {
    pages: { returns: r },
    locale,
  } = useI18n();
  const dateLocale = getDateLocale(locale);

  if (!row) {
    return (
      <Modal open={false} onClose={onClose} title="">
        <Modal.Section>{null}</Modal.Section>
      </Modal>
    );
  }

  const accountAgeLabel =
    row.accountAgeDays === null
      ? r.accountAgeUnknown
      : row.accountAgeDays === 0
        ? r.accountAgeToday
        : r.accountAgeDays(row.accountAgeDays);

  const riskTone: "critical" | "attention" | "success" =
    row.risk > 80 ? "critical" : row.risk >= 60 ? "attention" : "success";

  const title = row.returnName
    ? `${row.returnName} · ${row.name}`
    : r.returnTriageTitle(row.name);

  return (
    <Modal open onClose={onClose} title={title} size="large">
      <Modal.Section>
        <BlockStack gap="500">
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="start">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    {r.modalRisk}
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    {r.modalSuggested(row.recommendation)}
                  </Text>
                </BlockStack>
                <InlineStack gap="200" blockAlign="center">
                  <Badge tone={riskTone} toneAndProgressLabelOverride=" ">
                    {r.modalRiskBadge(row.risk)}
                  </Badge>
                  {row.savedDecision ? (
                    <Badge
                      tone={getDecisionTone(row.savedDecision)}
                      toneAndProgressLabelOverride=" "
                    >
                      {getDecisionLabel(row.savedDecision, locale)}
                    </Badge>
                  ) : (
                    <Badge tone="attention" toneAndProgressLabelOverride=" ">
                      {r.noDecision}
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
                {r.modalCustomer}
              </Text>
              <InlineStack gap="400" wrap>
                <DetailMetric label={r.detailName} value={row.customer} />
                <DetailMetric
                  label={r.detailEmail}
                  value={row.email ?? r.emailNotShared}
                />
                <DetailMetric
                  label={r.detailLifetimeOrders}
                  value={String(row.customerOrders)}
                />
                <DetailMetric label={r.detailAccountAge} value={accountAgeLabel} />
              </InlineStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">
                {r.modalOrder}
              </Text>
              <InlineStack gap="400" wrap>
                <DetailMetric
                  label={r.detailOrderValue}
                  value={moneyFormatter.format(row.value)}
                />
                <DetailMetric label={r.detailPayment} value={row.financialStatus} />
                <DetailMetric
                  label={r.detailFulfillment}
                  value={row.fulfillmentStatus}
                />
                <DetailMetric
                  label={r.detailOpened}
                  value={new Date(row.createdAt).toLocaleString(dateLocale)}
                />
                {row.returnStatus ? (
                  <DetailMetric
                    label={r.detailReturnStatus}
                    value={row.returnStatus.split("_").join(" ").toLowerCase()}
                  />
                ) : null}
                {typeof row.returnQuantity === "number" ? (
                  <DetailMetric
                    label={r.detailReturnQuantity}
                    value={String(row.returnQuantity)}
                  />
                ) : null}
              </InlineStack>
              <Box>
                <Button url={row.adminPath} target="_blank" variant="plain">
                  {r.modalOpenAdmin}
                </Button>
              </Box>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" gap="200">
                <Text as="h3" variant="headingSm">
                  {r.modalAnalysis}
                </Text>
                <Badge tone="success" toneAndProgressLabelOverride=" ">
                  {r.modalAiBadge}
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
                {r.modalFactors}
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
                  {r.modalNoFactors}
                </Text>
              )}
              {row.appliedPlaybooks.length ? (
                <Box paddingBlockStart="200">
                  <Text as="span" variant="bodySm" tone="subdued">
                    {r.modalPlaybooks(row.appliedPlaybooks.join(", "))}
                  </Text>
                </Box>
              ) : null}
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingSm">
                  {r.modalPreviousDecisions}
                </Text>
                {isLoading ? <Spinner size="small" /> : null}
              </InlineStack>
              {events.length ? (
                <List type="bullet">
                  {events.map((event) => (
                    <List.Item key={event.id}>
                      <InlineStack gap="200" blockAlign="center" wrap>
                        <Text as="span" variant="bodyMd">
                          {new Date(event.createdAt).toLocaleString(dateLocale)}
                        </Text>
                        {event.previousDecision ? (
                          <Badge
                            tone={getDecisionTone(event.previousDecision)}
                            toneAndProgressLabelOverride=" "
                          >
                            {getDecisionLabel(event.previousDecision, locale)}
                          </Badge>
                        ) : null}
                        <Text as="span" variant="bodySm" tone="subdued">
                          →
                        </Text>
                        <Badge
                          tone={getDecisionTone(event.decision)}
                          toneAndProgressLabelOverride=" "
                        >
                          {getDecisionLabel(event.decision, locale)}
                        </Badge>
                        {typeof event.risk === "number" ? (
                          <Text as="span" variant="bodySm" tone="subdued">
                            {r.riskLabel(event.risk)}
                          </Text>
                        ) : null}
                        {event.returnId && event.returnId !== row.returnId ? (
                          <Text as="span" variant="bodySm" tone="subdued">
                            {r.otherReturn}
                          </Text>
                        ) : null}
                      </InlineStack>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {isLoading ? r.loadingHistory : r.noHistory}
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
  const {
    pages: { returns: r, common: c },
  } = useI18n();

  if (capabilities.hasActivePlan && capabilities.canBulkAct) return null;

  if (!capabilities.hasActivePlan) {
    return (
      <Banner
        title={r.freeBannerTitle}
        tone="info"
        action={{ content: r.comparePlans, url: "/app/billing" }}
      >
        <p>{r.freeBannerBody(capabilities.maxQueuePageSize)}</p>
      </Banner>
    );
  }

  return (
    <Banner
      title={r.bulkBannerTitle}
      tone="info"
      action={{ content: c.upgradePlan, url: "/app/billing" }}
    >
      <p>
        {describePlanContext(
          c,
          capabilities.planLabel,
          capabilities.hasActivePlan,
        )}{" "}
        {r.bulkBannerBody}
      </p>
    </Banner>
  );
}

function getPageSizeOptions(
  maxQueuePageSize: number,
  common: ReturnType<typeof useI18n>["pages"]["common"],
) {
  return [10, 25, 50, 100]
    .filter((size) => size <= maxQueuePageSize)
    .map((size) => ({
      label: common.perPage(size),
      value: String(size),
    }));
}
