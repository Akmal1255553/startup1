import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  Text,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { authenticate } from "../shopify.server";
import { useI18n } from "../i18n/i18n-context";
import { describePlanContext } from "../i18n/messages/app/common";
import { resolveLocale } from "../i18n/resolver.server";
import {
  emptyAnalyticsSummary,
  loadAnalytics,
  type AnalyticsSummary,
  type PeriodAnalytics,
} from "../models/analytics.server";
import { loadAiInsights } from "../models/ai-insights.server";
import type { Insight, InsightSeverity } from "../models/ai-insights";
import { Sparkline } from "../components/sparkline";
import { loadCapabilities } from "../models/plan-gating.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing, admin } = await authenticate.admin(request);
  const locale = await resolveLocale(request, {
    authenticatedShop: session.shop,
    sessionLocale: session.locale ?? null,
  });
  let analyticsError = false;
  const [capabilities, analytics, insights] = await Promise.all([
    loadCapabilities(billing, session.shop, admin),
    loadAnalytics(session.shop).catch((error) => {
      console.error("[ReturnGuard] analytics failed", error);
      analyticsError = true;
      return emptyAnalyticsSummary();
    }),
    loadAiInsights(session.shop, locale).catch((error) => {
      console.error("[ReturnGuard] insights failed", error);
      return [];
    }),
  ]);
  return { analytics, insights, capabilities, analyticsError };
};

export default function AnalyticsPage() {
  const { analytics, insights, capabilities, analyticsError } =
    useLoaderData<typeof loader>();
  const {
    pages: { analytics: a, common: c },
    dashboard: d,
  } = useI18n();
  const canSee30Days = capabilities.analyticsPeriodDays >= 30;
  const breakdownPeriod = canSee30Days
    ? analytics.last30Days
    : analytics.last7Days;
  const rangeLabel = canSee30Days ? a.rangeShort30 : a.rangeShort7;

  return (
    <Page
      title={a.title}
      subtitle={a.subtitle}
      backAction={{ content: c.backDashboard, url: "/app" }}
    >
      <TitleBar title={a.title} />
      <BlockStack gap="500">
        {analyticsError ? (
          <Banner title={d.errorTitleGeneric} tone="warning">
            <p>
              Unable to load analytics right now. Please refresh the page or try
              again in a moment.
            </p>
          </Banner>
        ) : null}
        {!canSee30Days ? (
          <Banner
            title={a.gatedTitle}
            tone="info"
            action={{ content: c.openBilling, url: "/app/billing" }}
          >
            <p>
              {describePlanContext(
                c,
                capabilities.planLabel,
                capabilities.hasActivePlan,
              )}{" "}
              {a.gatedBody(capabilities.analyticsPeriodDays)}
            </p>
          </Banner>
        ) : null}

        <TodaySection
          analytics={analytics}
          canSee30Days={canSee30Days}
          copy={a}
          liveLabel={c.live}
        />

        <AiInsightsCard insights={insights} copy={a} />

        <Layout>
          <Layout.Section>
            <PeriodCard
              title={a.period7}
              tone="success"
              period={analytics.last7Days}
              copy={a}
            />
          </Layout.Section>
          {canSee30Days ? (
            <Layout.Section>
              <PeriodCard
                title={a.period30}
                tone="info"
                period={analytics.last30Days}
                copy={a}
              />
            </Layout.Section>
          ) : null}
        </Layout>

        <DecisionBreakdownCard
          period={breakdownPeriod}
          rangeLabel={rangeLabel}
          copy={a}
        />
      </BlockStack>
    </Page>
  );
}

function AiInsightsCard({
  insights,
  copy,
}: {
  insights: Insight[];
  copy: ReturnType<typeof useI18n>["pages"]["analytics"];
}) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                {copy.insightsBadge}
              </Badge>
              <Text as="h2" variant="headingMd">
                {copy.insightsTitle}
              </Text>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              {copy.insightsSubtitle}
            </Text>
          </BlockStack>
        </InlineStack>

        <BlockStack gap="200">
          {insights.map((insight) => (
            <InsightRow key={insight.id} insight={insight} />
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  return (
    <Box
      padding="300"
      background={insightBackground(insight.severity)}
      borderRadius="200"
    >
      <BlockStack gap="200">
        <InlineStack gap="200" blockAlign="center">
          <Badge
            tone={mapSeverityToTone(insight.severity)}
            toneAndProgressLabelOverride=" "
          >
            {insight.severity.toUpperCase()}
          </Badge>
          <Text as="h3" variant="headingSm">
            {insight.title}
          </Text>
        </InlineStack>
        <Text as="p" variant="bodyMd">
          {insight.message}
        </Text>
        {insight.cta ? (
          <InlineStack>
            <Button url={insight.cta.url} variant="plain">
              {insight.cta.label}
            </Button>
          </InlineStack>
        ) : null}
      </BlockStack>
    </Box>
  );
}

function mapSeverityToTone(
  severity: InsightSeverity,
): "success" | "info" | "attention" | "critical" {
  return severity;
}

function insightBackground(
  severity: InsightSeverity,
):
  | "bg-surface-success"
  | "bg-surface-info"
  | "bg-surface-warning"
  | "bg-surface-critical" {
  switch (severity) {
    case "success":
      return "bg-surface-success";
    case "critical":
      return "bg-surface-critical";
    case "attention":
      return "bg-surface-warning";
    default:
      return "bg-surface-info";
  }
}

function TodaySection({
  analytics,
  canSee30Days,
  copy,
  liveLabel,
}: {
  analytics: AnalyticsSummary;
  canSee30Days: boolean;
  copy: ReturnType<typeof useI18n>["pages"]["analytics"];
  liveLabel: string;
}) {
  const { today, totalEvents } = analytics;
  const columns = canSee30Days ? 4 : 3;

  return (
    <InlineGrid columns={{ xs: 1, md: columns }} gap="400">
      <SummaryTile
        label={copy.today}
        value={String(today.total)}
        hint={copy.todayHint(today.approved, today.review, today.hold)}
        tone="info"
        liveLabel={liveLabel}
      />
      <SummaryTile
        label={copy.last7}
        value={String(analytics.last7Days.totals.total)}
        hint={copy.last7Hint(analytics.last7Days.approvalRate)}
        tone="success"
        liveLabel={liveLabel}
      />
      {canSee30Days ? (
        <SummaryTile
          label={copy.last30}
          value={String(analytics.last30Days.totals.total)}
          hint={copy.last30Hint(analytics.last30Days.flaggedRate)}
          tone="attention"
          liveLabel={liveLabel}
        />
      ) : null}
      <SummaryTile
        label={copy.audit}
        value={String(
          canSee30Days ? totalEvents : analytics.last7Days.totals.total,
        )}
        hint={canSee30Days ? copy.auditHint30 : copy.auditHint7}
        tone="info"
        liveLabel={liveLabel}
      />
    </InlineGrid>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  tone,
  liveLabel,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "success" | "attention" | "critical" | "info";
  liveLabel: string;
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">
            {label}
          </Text>
          <Badge tone={tone} toneAndProgressLabelOverride=" ">
            {liveLabel}
          </Badge>
        </InlineStack>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {hint}
        </Text>
      </BlockStack>
    </Card>
  );
}

function PeriodCard({
  title,
  tone,
  period,
  copy,
}: {
  title: string;
  tone: "success" | "info";
  period: PeriodAnalytics;
  copy: ReturnType<typeof useI18n>["pages"]["analytics"];
}) {
  const totalSeries = period.daily.map((day) => day.total);
  const approvedSeries = period.daily.map((day) => day.approved);
  const flaggedSeries = period.daily.map((day) => day.review + day.hold);

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          <Badge tone={tone} toneAndProgressLabelOverride=" ">
            {copy.actionsBadge(period.totals.total)}
          </Badge>
        </InlineStack>

        <Box>
          <Text as="p" variant="bodySm" tone="subdued">
            {copy.chartLabel}
          </Text>
          <Box paddingBlockStart="100">
            <Sparkline
              values={totalSeries}
              tone={tone}
              ariaLabel={`${title} ${copy.chartLabel}`}
            />
          </Box>
        </Box>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
          <MiniSeries
            label={copy.approved}
            tone="success"
            values={approvedSeries}
            total={period.totals.approved}
          />
          <MiniSeries
            label={copy.flagged}
            tone="critical"
            values={flaggedSeries}
            total={period.totals.review + period.totals.hold}
          />
        </InlineGrid>

        <ApprovalRateRow
          approvalRate={period.approvalRate}
          flaggedRate={period.flaggedRate}
          copy={copy}
        />
      </BlockStack>
    </Card>
  );
}

function MiniSeries({
  label,
  tone,
  values,
  total,
}: {
  label: string;
  tone: "success" | "critical";
  values: number[];
  total: number;
}) {
  return (
    <BlockStack gap="100">
      <InlineStack align="space-between" blockAlign="baseline">
        <Text as="span" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <Text as="span" variant="headingMd">
          {total}
        </Text>
      </InlineStack>
      <Sparkline
        values={values}
        tone={tone}
        height={28}
        ariaLabel={label}
      />
    </BlockStack>
  );
}

function ApprovalRateRow({
  approvalRate,
  flaggedRate,
  copy,
}: {
  approvalRate: number;
  flaggedRate: number;
  copy: ReturnType<typeof useI18n>["pages"]["analytics"];
}) {
  return (
    <BlockStack gap="200">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" variant="bodySm">
          {copy.approvalRate}
        </Text>
        <Text as="span" variant="bodyMd">
          {approvalRate}%
        </Text>
      </InlineStack>
      <ProgressBar progress={approvalRate} tone="success" size="small" />

      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" variant="bodySm">
          {copy.flaggedRate}
        </Text>
        <Text as="span" variant="bodyMd">
          {flaggedRate}%
        </Text>
      </InlineStack>
      <ProgressBar progress={flaggedRate} tone="critical" size="small" />
    </BlockStack>
  );
}

function DecisionBreakdownCard({
  period,
  rangeLabel,
  copy,
}: {
  period: PeriodAnalytics;
  rangeLabel: string;
  copy: ReturnType<typeof useI18n>["pages"]["analytics"];
}) {
  const totals = period.totals;
  const items: Array<{
    label: string;
    value: number;
    tone: "success" | "attention" | "critical" | "info";
  }> = [
    { label: copy.breakdownApproved, value: totals.approved, tone: "success" },
    { label: copy.breakdownReview, value: totals.review, tone: "attention" },
    { label: copy.breakdownHold, value: totals.hold, tone: "critical" },
    { label: copy.breakdownReset, value: totals.reset, tone: "info" },
  ];

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          {copy.breakdownTitle(rangeLabel)}
        </Text>
        <InlineGrid columns={{ xs: 2, md: 4 }} gap="300">
          {items.map((item) => (
            <BlockStack key={item.label} gap="100">
              <InlineStack gap="200" blockAlign="center">
                <Badge tone={item.tone} toneAndProgressLabelOverride=" ">
                  {item.label}
                </Badge>
              </InlineStack>
              <Text as="p" variant="heading2xl">
                {item.value}
              </Text>
              <ProgressBar
                progress={percent(item.value, totals.total)}
                tone={item.tone === "critical" ? "critical" : "success"}
                size="small"
              />
            </BlockStack>
          ))}
        </InlineGrid>
        {totals.total === 0 ? (
          <Box
            padding="400"
            background="bg-surface-active"
            borderRadius="200"
          >
            <Text as="p" variant="bodyMd" tone="subdued">
              {copy.breakdownEmpty(rangeLabel)}
            </Text>
          </Box>
        ) : null}
      </BlockStack>
    </Card>
  );
}

function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
