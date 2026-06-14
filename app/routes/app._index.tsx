import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useMemo, type ReactNode } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { getDateLocale } from "../i18n/date-locale";
import { useI18n } from "../i18n/i18n-context";
import { resolveLocale } from "../i18n/resolver.server";
import { decisionLabelFromDashboard } from "../i18n/messages/dashboard";
import {
  loadReturnRiskData,
  saveReturnDecision,
} from "../models/return-risk.server";
import {
  getDecisionTone,
  getMoneyFormatter,
  type RiskOrder,
} from "../models/return-risk";
import { getOnboardingProgress } from "../models/onboarding.server";
import { loadAiInsights } from "../models/ai-insights.server";
import { loadTopReturnProducts } from "../models/product-intelligence.server";
import { buildProductInsightCards } from "../models/product-insights";
import { TopReturnProductsWidget } from "../components/product-intelligence/top-products-widget";
import { getProductInsightsCopy } from "../i18n/messages/product-insights-copy";
import { useCsvExport } from "../hooks/use-csv-export";
import styles from "../styles/dashboard-index.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const locale = await resolveLocale(request, {
    authenticatedShop: session.shop,
    sessionLocale: session.locale ?? null,
  });

  const [data, onboarding, aiInsights, topReturnProducts] = await Promise.all([
    loadReturnRiskData(admin, session.shop, locale),
    getOnboardingProgress(session.shop).catch((error) => {
      console.error("[ReturnGuard] onboarding progress failed", error);
      return {
        shop: session.shop,
        welcomeAcknowledged: false,
        scopesVerified: false,
        playbookSeeded: false,
        settingsTuned: false,
        completed: false,
        dismissed: false,
        nextStep: "welcome" as const,
        percent: 0,
      };
    }),
    loadAiInsights(session.shop, locale).catch((error) => {
      console.error("[ReturnGuard] ai insights failed", error);
      return [];
    }),
    loadTopReturnProducts(admin, session.shop, 5).catch((error) => {
      console.error("[ReturnGuard] top return products failed", error);
      return [];
    }),
  ]);

  return {
    ...data,
    onboarding,
    aiInsights,
    topReturnProducts,
    productCurrencyCode:
      topReturnProducts[0]?.currencyCode ?? data.summary.currencyCode,
    locale,
  };
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
    onboarding,
    aiInsights: aiInsightsFromLoader,
    topReturnProducts,
    productCurrencyCode,
  } = useLoaderData<typeof loader>();
  const { locale, dashboard: d } = useI18n();
  const productWidgetCopy = useMemo(
    () => getProductInsightsCopy(locale),
    [locale],
  );
  const aiInsights = useMemo(() => {
    const productInsights = buildProductInsightCards(topReturnProducts, locale);
    return [...productInsights, ...aiInsightsFromLoader].slice(0, 6);
  }, [topReturnProducts, aiInsightsFromLoader, locale]);
  const { exportCsv, isExporting, needsUpgrade } = useCsvExport();
  const topRiskOrder = [...orders].sort((a, b) => b.risk - a.risk)[0];
  const dateLocale = getDateLocale(locale);
  const moneyFormatter = getMoneyFormatter(summary.currencyCode, dateLocale);
  const playbooks = [d.playbook1, d.playbook2, d.playbook3];

  const marginEstimatePct = Math.round(
    settings.protectedMarginMultiplier * 100,
  );

  type RiskCardTone = "success" | "attention" | "critical";

  const riskCards: {
    label: string;
    value: string;
    change: ReactNode;
    tone: RiskCardTone;
  }[] = [
    {
      label: d.cardEstimatedMargin,
      value: moneyFormatter.format(summary.protectedMargin),
      change:
        summary.flaggedGmvTotal > 0 ? (
          <BlockStack gap="050">
            <Text as="span" variant="bodySm" tone="subdued">
              {d.cardMarginCaptionFlagged(
                moneyFormatter.format(summary.flaggedGmvTotal),
                marginEstimatePct,
                summary.analyzedOrders,
              )}
            </Text>
          </BlockStack>
        ) : (
          <Text as="span" variant="bodySm" tone="subdued">
            {d.cardMarginCaptionNone(summary.analyzedOrders)}
          </Text>
        ),
      tone: "success",
    },
    {
      label: d.cardManualReview,
      value: String(summary.reviewCount),
      change: (
        <Text as="span" variant="bodySm" tone="subdued">
          {d.cardReviewCaption(
            settings.reviewRiskThreshold,
            settings.holdRiskThreshold - 1,
          )}
        </Text>
      ),
      tone: "attention",
    },
    {
      label: d.cardRefundHolds,
      value: String(summary.holdCount),
      change: (
        <Text as="span" variant="bodySm" tone="subdued">
          {d.cardHoldCaption(settings.holdRiskThreshold)}
        </Text>
      ),
      tone: "critical",
    },
    {
      label: d.cardApprovalRatio,
      value: `${summary.approvalRatio}%`,
      change: (
        <Text as="span" variant="bodySm" tone="subdued">
          {d.cardApprovalCaption(summary.totalReturns)}
        </Text>
      ),
      tone: "success",
    },
    {
      label: d.cardFlaggedReturns,
      value: String(summary.flaggedReturns),
      change: (
        <Text as="span" variant="bodySm" tone="subdued">
          {d.cardFlaggedCaption(summary.averageRiskScore)}
        </Text>
      ),
      tone: "attention",
    },
  ];

  const queueOrders = orders.slice(0, 8);

  return (
    <Page
      title={d.pageTitle}
      subtitle={d.pageSubtitle}
      primaryAction={
        topRiskOrder
          ? {
              content: d.primaryOpenHighestRisk,
              url: topRiskOrder.adminPath,
              target: "_blank",
            }
          : { content: d.primaryWaitingOrders, disabled: true }
      }
      secondaryActions={[
        { content: d.secondaryViewQueue, url: "/app/returns" },
        // Run the export through `useCsvExport` so the request happens
        // inside the embedded admin session and we trigger a real
        // browser download from a Blob — opening /app/export/csv in a
        // new tab loses the session and bounces to login instead.
        needsUpgrade
          ? { content: d.secondaryExportCsvUpgrade, url: "/app/billing" }
          : {
              content: isExporting
                ? d.secondaryExportCsvPreparing
                : d.secondaryExportCsv,
              onAction: exportCsv,
              loading: isExporting,
              disabled: isExporting,
            },
      ]}
    >
      <TitleBar title={d.pageTitle} />
      <BlockStack gap="500">
        {!onboarding.completed && !onboarding.dismissed ? (
          <Banner
            title={d.bannerFinishSetup}
            tone="info"
            action={{ content: d.bannerOpenSetup, url: "/app/onboarding" }}
            secondaryAction={{
              content: d.bannerHide,
              url: "/app/onboarding?intent=dismiss",
            }}
          >
            <BlockStack gap="100">
              <Text as="p" variant="bodyMd">
                {d.bannerSetupBody(onboarding.percent)}
              </Text>
              <Box>
                <ProgressBar progress={onboarding.percent} tone="primary" />
              </Box>
            </BlockStack>
          </Banner>
        ) : null}

        {error ? (
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                {needsProtectedDataAccess
                  ? d.errorTitleProtected
                  : d.errorTitleGeneric}
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                {error}
              </Text>
              {needsProtectedDataAccess ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {d.errorProtectedBody(summary.detectedOrders)}
                </Text>
              ) : null}
            </BlockStack>
          </Card>
        ) : null}

        <div className={styles.metricGrid}>
          {riskCards.map((card) => (
            <div key={card.label} className={styles.metricCell}>
              <Card padding="0">
                <div className={styles.metricCardFlex}>
                  <Box padding="400" paddingBlockEnd="200">
                    <InlineStack
                      align="space-between"
                      blockAlign="start"
                      gap="200"
                    >
                      <Box maxWidth="75%">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {card.label}
                        </Text>
                      </Box>
                      <Badge
                        tone={
                          card.tone as "success" | "attention" | "critical"
                        }
                        toneAndProgressLabelOverride=" "
                      >
                        {d.cardBadgeLive}
                      </Badge>
                    </InlineStack>
                  </Box>
                  <div
                    className={styles.metricValueGrow}
                    style={{
                      paddingInline: "var(--p-space-400)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <Text as="p" variant="heading2xl">
                      {card.value}
                    </Text>
                  </div>
                  <Box padding="400" paddingBlockStart="200">
                    <div className={styles.metricCaption}>{card.change}</div>
                  </Box>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      {d.queueTitle}
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {d.queueSubtitle}
                    </Text>
                  </BlockStack>
                  <Button url="/app/returns" variant="primary">
                    {d.queueOpenFull}
                  </Button>
                </InlineStack>

                {orders.length ? (
                  <div className={styles.queueScroll}>
                    <table className={styles.queueTable}>
                      <thead>
                        <tr>
                          <th className={styles.colOrder}>{d.thOrder}</th>
                          <th>{d.thCustomer}</th>
                          <th className={styles.colValue}>{d.thValue}</th>
                          <th className={styles.colRisk}>{d.thRisk}</th>
                          <th className={styles.colGuidance}>
                            {d.thGuidance}
                          </th>
                          <th className={styles.colDecision}>{d.thDecision}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queueOrders.map((order) => (
                          <tr key={order.id}>
                            <td className={styles.colOrder}>
                              <Text as="span" variant="bodyMd" fontWeight="semibold">
                                {order.name}
                              </Text>
                            </td>
                            <td>
                              <BlockStack gap="050">
                                <Text as="span" variant="bodyMd">
                                  {order.customer}
                                </Text>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {order.financialStatus} /{" "}
                                  {order.fulfillmentStatus}
                                </Text>
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {d.placedOn}{" "}
                                  {new Date(order.createdAt).toLocaleDateString(
                                    dateLocale,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </Text>
                              </BlockStack>
                            </td>
                            <td className={styles.colValue}>
                              <Text as="span" variant="bodyMd">
                                {moneyFormatter.format(order.value)}
                              </Text>
                            </td>
                            <td className={styles.colRisk}>
                              <RiskMeter order={order} />
                            </td>
                            <td className={styles.colGuidance}>
                              <BlockStack gap="100">
                                <Text as="span" variant="bodyMd">
                                  {order.recommendation}
                                </Text>
                                <div className={styles.narrativeClamp}>
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    {order.narrative}
                                  </Text>
                                </div>
                              </BlockStack>
                            </td>
                            <td className={styles.colDecision}>
                              <DecisionControls order={order} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Box
                    padding="600"
                    background="bg-surface-active"
                    borderRadius="200"
                  >
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        {d.queueEmptyTitle}
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {summary.detectedOrders
                          ? d.queueEmptyLocked(summary.detectedOrders)
                          : d.queueEmptyHint}
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
                    {d.signalTitle}
                  </Text>
                  <Text as="p" variant="headingXl">
                    {summary.confidence}%
                  </Text>
                  <ProgressBar progress={summary.confidence} tone="success" />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {d.signalSub1(
                        summary.averageRiskScore,
                        summary.riskSpread,
                        summary.analyzedOrders,
                      )}
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {d.signalSub2}
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>

              {aiInsights.length ? (
                <Card>
                  <BlockStack gap="300">
                    <InlineStack
                      align="space-between"
                      blockAlign="center"
                      gap="200"
                    >
                      <Text as="h2" variant="headingMd">
                        {d.analysisTitle}
                      </Text>
                      <Badge tone="success" toneAndProgressLabelOverride=" ">
                        {d.analysisBadgeAi}
                      </Badge>
                    </InlineStack>
                    {aiInsights.slice(0, 3).map((insight) => (
                      <Box
                        key={insight.id}
                        padding="300"
                        background="bg-surface-active"
                        borderRadius="200"
                      >
                        <BlockStack gap="100">
                          <InlineStack
                            gap="200"
                            blockAlign="center"
                            align="space-between"
                          >
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {insight.title}
                            </Text>
                            <Badge
                              tone={insight.severity}
                              toneAndProgressLabelOverride=" "
                            >
                              {insight.severity}
                            </Badge>
                          </InlineStack>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {insight.message}
                          </Text>
                          {insight.cta ? (
                            <Box paddingBlockStart="100">
                              <Button url={insight.cta.url} variant="plain">
                                {insight.cta.label}
                              </Button>
                            </Box>
                          ) : null}
                        </BlockStack>
                      </Box>
                    ))}
                    <Button url="/app/analytics" variant="plain">
                      {d.analysisOpenAnalytics}
                    </Button>
                  </BlockStack>
                </Card>
              ) : null}

              <TopReturnProductsWidget
                products={topReturnProducts}
                moneyFormatter={getMoneyFormatter(
                  productCurrencyCode,
                  dateLocale,
                )}
                copy={{
                  widgetTitle: productWidgetCopy.widgetTitle,
                  widgetSubtitle: productWidgetCopy.widgetSubtitle,
                  widgetOpen: productWidgetCopy.widgetOpen,
                  widgetEmpty: productWidgetCopy.widgetEmpty,
                  thProduct: productWidgetCopy.widgetThProduct,
                  thReturnRate: productWidgetCopy.widgetThReturnRate,
                  thRevenueLost: productWidgetCopy.widgetThRevenueLost,
                  thRiskScore: productWidgetCopy.widgetThRiskScore,
                }}
              />

              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    {d.playbooksTitle}
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
                          {d.playbooksOn}
                        </Badge>
                        <Text as="span" variant="bodyMd">
                          {playbook}
                        </Text>
                      </InlineStack>
                    </Box>
                  ))}
                  <Button url="/app/playbooks">{d.playbooksManage}</Button>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd">
                    {d.recentTitle}
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
                        {decisionLabelFromDashboard(d, action.decision)}
                      </Badge>
                    </InlineStack>
                  ))}
                  {!recentActions.length ? (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {d.recentEmpty}
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
  const { dashboard: d } = useI18n();
  const isSaving = fetcher.state !== "idle";
  const currentDecision =
    fetcher.formData?.get("decision")?.toString() || order.savedDecision;

  return (
    <div className={styles.decisionInline}>
      <DecisionButton
        decision="approved"
        label={d.btnApprove}
        order={order}
        pressed={currentDecision === "approved"}
        loading={isSaving && fetcher.formData?.get("decision") === "approved"}
        tone="success"
        fetcher={fetcher}
      />
      <DecisionButton
        decision="review"
        label={d.btnReview}
        order={order}
        pressed={currentDecision === "review"}
        loading={isSaving && fetcher.formData?.get("decision") === "review"}
        fetcher={fetcher}
      />
      <DecisionButton
        decision="hold"
        label={d.btnHold}
        order={order}
        pressed={currentDecision === "hold"}
        loading={isSaving && fetcher.formData?.get("decision") === "hold"}
        tone="critical"
        fetcher={fetcher}
      />
      {currentDecision ? (
        <Badge
          tone={getDecisionTone(currentDecision)}
          toneAndProgressLabelOverride=" "
        >
          {decisionLabelFromDashboard(d, currentDecision)}
        </Badge>
      ) : (
        <Text as="span" variant="bodySm" tone="subdued">
          {d.noDecisionYet}
        </Text>
      )}
    </div>
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
