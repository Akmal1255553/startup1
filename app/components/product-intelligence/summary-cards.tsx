import {
  Badge,
  BlockStack,
  Box,
  InlineGrid,
  InlineStack,
  ProgressBar,
  Text,
} from "@shopify/polaris";

import { Sparkline } from "../sparkline";
import type { ProductIntelligenceSummary } from "../../models/product-intelligence.types";

export function ProductSummaryCards({
  summary,
  moneyFormatter,
  copy,
  liveLabel,
}: {
  summary: ProductIntelligenceSummary;
  moneyFormatter: Intl.NumberFormat;
  copy: {
    totalProducts: string;
    productsWithReturns: string;
    averageReturnRate: string;
    estimatedRevenueLost: string;
    estimatedRevenueSaved: string;
    revenueAtRisk: string;
    revenueRecoverable: string;
  };
  liveLabel: string;
}) {
  const cards = [
    {
      label: copy.totalProducts,
      value: String(summary.totalProducts),
      tone: "info" as const,
    },
    {
      label: copy.productsWithReturns,
      value: String(summary.productsWithReturns),
      tone: "attention" as const,
    },
    {
      label: copy.averageReturnRate,
      value: `${summary.averageReturnRate}%`,
      tone: "critical" as const,
    },
    {
      label: copy.estimatedRevenueLost,
      value: moneyFormatter.format(summary.estimatedRevenueLost),
      tone: "critical" as const,
    },
    {
      label: copy.estimatedRevenueSaved,
      value: moneyFormatter.format(summary.estimatedRevenueSaved),
      tone: "success" as const,
    },
    {
      label: copy.revenueAtRisk,
      value: moneyFormatter.format(summary.revenueAtRisk),
      tone: "attention" as const,
    },
    {
      label: copy.revenueRecoverable,
      value: moneyFormatter.format(summary.revenueRecoverable),
      tone: "success" as const,
    },
  ];

  return (
    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
      {cards.map((card) => (
        <Box
          key={card.label}
          padding="400"
          background="bg-surface"
          borderRadius="200"
          borderWidth="025"
          borderColor="border"
        >
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text as="p" variant="bodyMd" tone="subdued">
                {card.label}
              </Text>
              <Badge tone={card.tone} toneAndProgressLabelOverride=" ">
                {liveLabel}
              </Badge>
            </InlineStack>
            <Text as="p" variant="heading2xl">
              {card.value}
            </Text>
          </BlockStack>
        </Box>
      ))}
    </InlineGrid>
  );
}

export function ReturnReasonsChart({
  summary,
  copy,
}: {
  summary: ProductIntelligenceSummary;
  copy: Record<
    | "reasonsTitle"
    | "reasonsSubtitle"
    | "reasonSizing"
    | "reasonDamaged"
    | "reasonNotAsDescribed"
    | "reasonChangedMind"
    | "reasonLateDelivery"
    | "reasonOther",
    string
  >;
}) {
  const items = [
    { key: "sizing", label: copy.reasonSizing, stat: summary.reasonAnalysis.sizing },
    { key: "damaged", label: copy.reasonDamaged, stat: summary.reasonAnalysis.damaged },
    {
      key: "notAsDescribed",
      label: copy.reasonNotAsDescribed,
      stat: summary.reasonAnalysis.notAsDescribed,
    },
    {
      key: "changedMind",
      label: copy.reasonChangedMind,
      stat: summary.reasonAnalysis.changedMind,
    },
    {
      key: "lateDelivery",
      label: copy.reasonLateDelivery,
      stat: summary.reasonAnalysis.lateDelivery,
    },
    { key: "other", label: copy.reasonOther, stat: summary.reasonAnalysis.other },
  ];

  const chartValues = items.map((item) => item.stat.count);
  const peak = Math.max(1, ...chartValues);

  return (
    <BlockStack gap="400">
      <BlockStack gap="100">
        <Text as="h2" variant="headingMd">
          {copy.reasonsTitle}
        </Text>
        <Text as="p" variant="bodySm" tone="subdued">
          {copy.reasonsSubtitle}
        </Text>
      </BlockStack>

      <Box paddingBlockEnd="200">
        <Sparkline
          values={chartValues}
          tone="critical"
          height={48}
          barWidth={10}
          ariaLabel={copy.reasonsTitle}
        />
      </Box>

      <InlineGrid columns={{ xs: 1, md: 2 }} gap="300">
        {items.map((item) => (
          <BlockStack key={item.key} gap="100">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="span" variant="bodyMd">
                {item.label}
              </Text>
              <Text as="span" variant="bodyMd" tone="subdued">
                {item.stat.count} · {item.stat.percentage}%
              </Text>
            </InlineStack>
            <ProgressBar
              progress={Math.round((item.stat.count / peak) * 100)}
              tone="critical"
              size="small"
            />
          </BlockStack>
        ))}
      </InlineGrid>
    </BlockStack>
  );
}
