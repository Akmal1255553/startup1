import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineStack,
  Layout,
  Page,
  Pagination,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useCallback, useMemo, useState } from "react";

import {
  ProductDetailsDrawer,
} from "../components/product-intelligence/product-drawer";
import {
  ProductSummaryCards,
  ReturnReasonsChart,
} from "../components/product-intelligence/summary-cards";
import { getDateLocale } from "../i18n/date-locale";
import { useI18n } from "../i18n/i18n-context";
import { getMoneyFormatter } from "../models/return-risk";
import type { ProductReturnRow, ProductSortField } from "../models/product-intelligence.types";
import {
  emptyProductIntelligencePage,
  loadProductIntelligence,
} from "../models/product-intelligence.server";
import { resolveLocale } from "../i18n/resolver.server";
import { authenticate } from "../shopify.server";
import type { Insight } from "../models/ai-insights.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const locale = await resolveLocale(request, {
    authenticatedShop: session.shop,
    sessionLocale: session.locale ?? null,
  });
  const url = new URL(request.url);

  const data = await loadProductIntelligence(admin, session.shop, locale, {
    page: Number(url.searchParams.get("page")) || 1,
    pageSize: Number(url.searchParams.get("pageSize")) || 25,
    sort: (url.searchParams.get("sort") as ProductSortField | null) ?? "returnRate",
    sortDirection:
      url.searchParams.get("dir") === "asc" ? "asc" : "desc",
    query: url.searchParams.get("q") ?? "",
  }).catch((error) => {
    console.error("[ReturnGuard] product intelligence loader failed", error);
    return emptyProductIntelligencePage();
  });

  return { ...data, locale };
};

export default function ProductIntelligencePage() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    pages: { productIntelligence: p, common: c },
    locale,
  } = useI18n();
  const dateLocale = getDateLocale(locale);
  const moneyFormatter = getMoneyFormatter(
    data.summary.currencyCode,
    dateLocale,
  );

  const [searchValue, setSearchValue] = useState(data.query);
  const [selectedProduct, setSelectedProduct] = useState<ProductReturnRow | null>(
    null,
  );

  const sortOptions = useMemo(
    () => [
      { label: p.sortReturnRate, value: "returnRate" },
      { label: p.sortReturnsCount, value: "returnsCount" },
      { label: p.sortRevenueLost, value: "revenueLost" },
      { label: p.sortRiskScore, value: "riskScore" },
      { label: p.sortProductTitle, value: "productTitle" },
      { label: p.sortOrdersCount, value: "ordersCount" },
    ],
    [p],
  );

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (!value) params.delete(key);
        else params.set(key, value);
      }
      navigate(`/app/product-intelligence?${params.toString()}`);
    },
    [navigate, searchParams],
  );

  const rows = data.products.map((product) => [
    <Button
      key={`${product.productId}-name`}
      variant="plain"
      onClick={() => setSelectedProduct(product)}
    >
      {product.productTitle}
    </Button>,
    product.sku ?? "—",
    String(product.ordersCount),
    String(product.returnsCount),
    `${product.returnRate}%`,
    moneyFormatter.format(product.revenueLost),
    <Badge
      key={`${product.productId}-risk`}
      tone={riskTone(product.riskLevel)}
      toneAndProgressLabelOverride=" "
    >
      {riskLabel(product.riskLevel, p)}
    </Badge>,
    String(product.riskScore),
  ]);

  return (
    <Page
      title={p.title}
      subtitle={p.subtitle}
      backAction={{ content: c.backDashboard, url: "/app" }}
    >
      <TitleBar title={p.title} />
      <BlockStack gap="500">
        {data.error ? (
          <Banner title={p.title} tone="warning">
            <p>{data.error}</p>
          </Banner>
        ) : null}

        <ProductSummaryCards
          summary={data.summary}
          moneyFormatter={moneyFormatter}
          copy={p}
          liveLabel={c.live}
        />

        <Layout>
          <Layout.Section>
            <Card>
              <ReturnReasonsChart summary={data.summary} copy={p} />
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    {p.insightsTitle}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {p.insightsSubtitle}
                  </Text>
                  {data.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    {p.recommendationsTitle}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {p.recommendationsSubtitle}
                  </Text>
                  {data.recommendations.slice(0, 6).map((item) => (
                    <Box
                      key={item.id}
                      padding="300"
                      background="bg-surface-active"
                      borderRadius="200"
                    >
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center">
                          <Badge
                            tone={item.severity}
                            toneAndProgressLabelOverride=" "
                          >
                            {item.severity}
                          </Badge>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {item.productTitle}
                          </Text>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {item.message}
                        </Text>
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>

        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center" gap="300">
              <Box minWidth="280px">
                <TextField
                  label={c.search}
                  labelHidden
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder={p.searchPlaceholder}
                  autoComplete="off"
                  connectedRight={
                    <Button
                      onClick={() =>
                        updateParams({ q: searchValue.trim(), page: "1" })
                      }
                    >
                      {c.search}
                    </Button>
                  }
                />
              </Box>
              <Select
                label={p.sortLabel}
                options={sortOptions}
                value={data.sort}
                onChange={(value) =>
                  updateParams({ sort: value, page: "1" })
                }
              />
            </InlineStack>

            {selectedProduct ? (
              <ProductDetailsDrawer
                product={selectedProduct}
                recommendations={data.recommendations}
                moneyFormatter={moneyFormatter}
                copy={p}
                onClose={() => setSelectedProduct(null)}
              />
            ) : null}

            {rows.length ? (
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "numeric",
                  "numeric",
                  "numeric",
                  "numeric",
                  "text",
                  "numeric",
                ]}
                headings={[
                  p.thProduct,
                  p.thSku,
                  p.thOrders,
                  p.thReturns,
                  p.thReturnRate,
                  p.thRevenueLost,
                  p.thRisk,
                  p.thRiskScore,
                ]}
                rows={rows}
                sortable={[true, false, true, true, true, true, false, true]}
                defaultSortDirection="descending"
                initialSortColumnIndex={4}
                onSort={(index, direction) => {
                  const fields: ProductSortField[] = [
                    "productTitle",
                    "productTitle",
                    "ordersCount",
                    "returnsCount",
                    "returnRate",
                    "revenueLost",
                    "riskScore",
                    "riskScore",
                  ];
                  updateParams({
                    sort: fields[index] ?? "returnRate",
                    dir: direction === "ascending" ? "asc" : "desc",
                    page: "1",
                  });
                }}
              />
            ) : (
              <Box padding="500" background="bg-surface-active" borderRadius="200">
                <Text as="p" variant="bodyMd" tone="subdued">
                  {p.emptyTable}
                </Text>
              </Box>
            )}

            {data.totalPages > 1 ? (
              <InlineStack align="center">
                <Pagination
                  hasPrevious={data.page > 1}
                  hasNext={data.page < data.totalPages}
                  onPrevious={() =>
                    updateParams({ page: String(data.page - 1) })
                  }
                  onNext={() => updateParams({ page: String(data.page + 1) })}
                  label={`${data.page} / ${data.totalPages}`}
                />
              </InlineStack>
            ) : null}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Box padding="300" background="bg-surface-active" borderRadius="200">
      <BlockStack gap="100">
        <InlineStack gap="200" blockAlign="center">
          <Badge tone={insight.severity} toneAndProgressLabelOverride=" ">
            {insight.severity}
          </Badge>
          <Text as="span" variant="bodyMd" fontWeight="semibold">
            {insight.title}
          </Text>
        </InlineStack>
        <Text as="p" variant="bodySm" tone="subdued">
          {insight.message}
        </Text>
      </BlockStack>
    </Box>
  );
}

function riskTone(
  level: ProductReturnRow["riskLevel"],
): "success" | "attention" | "critical" {
  if (level === "high") return "critical";
  if (level === "medium") return "attention";
  return "success";
}

function riskLabel(
  level: ProductReturnRow["riskLevel"],
  copy: { riskLow: string; riskMedium: string; riskHigh: string },
): string {
  if (level === "high") return copy.riskHigh;
  if (level === "medium") return copy.riskMedium;
  return copy.riskLow;
}
