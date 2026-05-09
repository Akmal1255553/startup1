import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Badge,
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
import {
  loadAnalytics,
  type AnalyticsSummary,
  type PeriodAnalytics,
} from "../models/analytics.server";
import {
  loadAiInsights,
  type Insight,
  type InsightSeverity,
} from "../models/ai-insights.server";
import { Sparkline } from "../components/sparkline";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [analytics, insights] = await Promise.all([
    loadAnalytics(session.shop),
    loadAiInsights(session.shop),
  ]);
  return { analytics, insights };
};

export default function AnalyticsPage() {
  const { analytics, insights } = useLoaderData<typeof loader>();

  return (
    <Page
      title="Analytics"
      subtitle="Moderation activity, approval rate, and trends"
      backAction={{ content: "Dashboard", url: "/app" }}
    >
      <TitleBar title="Analytics" />
      <BlockStack gap="500">
        <TodaySection analytics={analytics} />

        <AiInsightsCard insights={insights} />

        <Layout>
          <Layout.Section>
            <PeriodCard
              title="Last 7 days"
              tone="success"
              period={analytics.last7Days}
            />
          </Layout.Section>
          <Layout.Section>
            <PeriodCard
              title="Last 30 days"
              tone="info"
              period={analytics.last30Days}
            />
          </Layout.Section>
        </Layout>

        <DecisionBreakdownCard period={analytics.last30Days} />
      </BlockStack>
    </Page>
  );
}

function AiInsightsCard({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <InlineStack gap="200" blockAlign="center">
              <Badge tone="info" toneAndProgressLabelOverride=" ">
                AI Insights
              </Badge>
              <Text as="h2" variant="headingMd">
                What we noticed for you
              </Text>
            </InlineStack>
            <Text as="p" variant="bodySm" tone="subdued">
              Generated locally from your moderation history — no data leaves
              your store.
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

function TodaySection({ analytics }: { analytics: AnalyticsSummary }) {
  const { today, totalEvents } = analytics;

  return (
    <InlineGrid columns={{ xs: 1, md: 4 }} gap="400">
      <SummaryTile
        label="Today's actions"
        value={String(today.total)}
        hint={`${today.approved} approved · ${today.review} review · ${today.hold} hold`}
        tone="info"
      />
      <SummaryTile
        label="Last 7 days"
        value={String(analytics.last7Days.totals.total)}
        hint={`${analytics.last7Days.approvalRate}% approval rate`}
        tone="success"
      />
      <SummaryTile
        label="Last 30 days"
        value={String(analytics.last30Days.totals.total)}
        hint={`${analytics.last30Days.flaggedRate}% flagged for review or hold`}
        tone="attention"
      />
      <SummaryTile
        label="Lifetime audit events"
        value={String(totalEvents)}
        hint="Across the last 30 days of audit log"
        tone="info"
      />
    </InlineGrid>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "success" | "attention" | "critical" | "info";
}) {
  return (
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text as="p" variant="bodyMd" tone="subdued">
            {label}
          </Text>
          <Badge tone={tone} toneAndProgressLabelOverride=" ">
            Live
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
}: {
  title: string;
  tone: "success" | "info";
  period: PeriodAnalytics;
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
            {`${period.totals.total} actions`}
          </Badge>
        </InlineStack>

        <Box>
          <Text as="p" variant="bodySm" tone="subdued">
            Total moderation actions per day
          </Text>
          <Box paddingBlockStart="100">
            <Sparkline
              values={totalSeries}
              tone={tone}
              ariaLabel={`${title} total actions per day`}
            />
          </Box>
        </Box>

        <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
          <MiniSeries
            label="Approved"
            tone="success"
            values={approvedSeries}
            total={period.totals.approved}
          />
          <MiniSeries
            label="Flagged (review + hold)"
            tone="critical"
            values={flaggedSeries}
            total={period.totals.review + period.totals.hold}
          />
        </InlineGrid>

        <ApprovalRateRow approvalRate={period.approvalRate} flaggedRate={period.flaggedRate} />
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
      <Sparkline values={values} tone={tone} height={28} ariaLabel={`${label} per day`} />
    </BlockStack>
  );
}

function ApprovalRateRow({
  approvalRate,
  flaggedRate,
}: {
  approvalRate: number;
  flaggedRate: number;
}) {
  return (
    <BlockStack gap="200">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" variant="bodySm">
          Approval rate
        </Text>
        <Text as="span" variant="bodyMd">
          {approvalRate}%
        </Text>
      </InlineStack>
      <ProgressBar progress={approvalRate} tone="success" size="small" />

      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" variant="bodySm">
          Flagged rate
        </Text>
        <Text as="span" variant="bodyMd">
          {flaggedRate}%
        </Text>
      </InlineStack>
      <ProgressBar progress={flaggedRate} tone="critical" size="small" />
    </BlockStack>
  );
}

function DecisionBreakdownCard({ period }: { period: PeriodAnalytics }) {
  const totals = period.totals;
  const items: Array<{
    label: string;
    value: number;
    tone: "success" | "attention" | "critical" | "info";
  }> = [
    { label: "Approved", value: totals.approved, tone: "success" },
    { label: "Manual review", value: totals.review, tone: "attention" },
    { label: "Hold", value: totals.hold, tone: "critical" },
    { label: "Reset", value: totals.reset, tone: "info" },
  ];

  return (
    <Card>
      <BlockStack gap="300">
        <Text as="h2" variant="headingMd">
          Decision breakdown · last 30 days
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
              No moderation events in the last 30 days. Make a decision in the
              Returns Queue to start populating analytics.
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
