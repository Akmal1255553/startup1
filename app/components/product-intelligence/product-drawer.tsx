import {
  Badge,
  BlockStack,
  Box,
  Button,
  InlineStack,
  ProgressBar,
  Text,
} from "@shopify/polaris";

import { Sparkline } from "../sparkline";
import { topReturnReasons } from "../../models/product-risk-score.server";
import type {
  ProductRecommendation,
  ProductReturnRow,
} from "../../models/product-intelligence.types";

export function ProductDetailsDrawer({
  product,
  recommendations,
  moneyFormatter,
  copy,
  onClose,
}: {
  product: ProductReturnRow | null;
  recommendations: ProductRecommendation[];
  moneyFormatter: Intl.NumberFormat;
  copy: {
    drawerTitle: string;
    drawerReturnRate: string;
    drawerRevenueLost: string;
    drawerTopReasons: string;
    drawerReturnTrend: string;
    drawerRiskScore: string;
    drawerRecommendations: string;
    closeDrawer: string;
    riskLow: string;
    riskMedium: string;
    riskHigh: string;
    reasonSizing: string;
    reasonDamaged: string;
    reasonNotAsDescribed: string;
    reasonChangedMind: string;
    reasonLateDelivery: string;
    reasonOther: string;
  };
  onClose: () => void;
}) {
  if (!product) return null;

  const reasonLabels: Record<string, string> = {
    sizing: copy.reasonSizing,
    damaged: copy.reasonDamaged,
    notAsDescribed: copy.reasonNotAsDescribed,
    changedMind: copy.reasonChangedMind,
    lateDelivery: copy.reasonLateDelivery,
    other: copy.reasonOther,
  };

  const topReasons = topReturnReasons(product.reasonBreakdown, 5);
  const productRecommendations = recommendations.filter(
    (item) => item.productId === product.productId,
  );

  return (
    <Box
      padding="400"
      background="bg-surface"
      borderRadius="200"
      borderWidth="025"
      borderColor="border"
    >
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {copy.drawerTitle}
            </Text>
            <Text as="p" variant="headingSm">
              {product.productTitle}
            </Text>
          </BlockStack>
          <Button onClick={onClose}>{copy.closeDrawer}</Button>
        </InlineStack>

        <InlineStack gap="400" wrap>
          <MetricPill
            label={copy.drawerReturnRate}
            value={`${product.returnRate}%`}
            tone={riskTone(product.riskLevel)}
          />
          <MetricPill
            label={copy.drawerRevenueLost}
            value={moneyFormatter.format(product.revenueLost)}
            tone="critical"
          />
          <MetricPill
            label={copy.drawerRiskScore}
            value={String(product.riskScore)}
            tone={riskTone(product.riskLevel)}
          />
        </InlineStack>

        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            {copy.drawerTopReasons}
          </Text>
          {topReasons.length ? (
            topReasons.map((reason) => (
              <InlineStack key={reason.category} align="space-between">
                <Text as="span" variant="bodyMd">
                  {reasonLabels[reason.category]}
                </Text>
                <Badge tone="info" toneAndProgressLabelOverride=" ">
                  {String(reason.count)}
                </Badge>
              </InlineStack>
            ))
          ) : (
            <Text as="p" variant="bodySm" tone="subdued">
              —
            </Text>
          )}
        </BlockStack>

        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            {copy.drawerReturnTrend}
          </Text>
          <Sparkline
            values={product.returnTrend.map((point) => point.count)}
            tone="attention"
            ariaLabel={copy.drawerReturnTrend}
          />
        </BlockStack>

        <BlockStack gap="200">
          <Text as="h3" variant="headingSm">
            {copy.drawerRecommendations}
          </Text>
          {productRecommendations.length ? (
            productRecommendations.map((item) => (
              <Box
                key={item.id}
                padding="300"
                background="bg-surface-active"
                borderRadius="200"
              >
                <BlockStack gap="100">
                  <InlineStack gap="200" blockAlign="center">
                    <Badge tone={item.severity} toneAndProgressLabelOverride=" ">
                      {item.severity}
                    </Badge>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {item.title}
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {item.message}
                  </Text>
                </BlockStack>
              </Box>
            ))
          ) : (
            <Text as="p" variant="bodySm" tone="subdued">
              —
            </Text>
          )}
        </BlockStack>

        <ProgressBar
          progress={product.riskScore}
          tone={
            product.riskLevel === "high"
              ? "critical"
              : product.riskLevel === "medium"
                ? "highlight"
                : "success"
          }
        />
      </BlockStack>
    </Box>
  );
}

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "attention" | "critical";
}) {
  return (
    <Box padding="300" background="bg-surface-active" borderRadius="200">
      <BlockStack gap="100">
        <Text as="span" variant="bodySm" tone="subdued">
          {label}
        </Text>
        <Text as="span" variant="headingMd">
          {value}
        </Text>
        <Badge tone={tone} toneAndProgressLabelOverride=" ">
          {label}
        </Badge>
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
