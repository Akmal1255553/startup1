import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Text,
} from "@shopify/polaris";

import type { ProductReturnRow } from "../../models/product-intelligence.types";

export function TopReturnProductsWidget({
  products,
  moneyFormatter,
  copy,
}: {
  products: ProductReturnRow[];
  moneyFormatter: Intl.NumberFormat;
  copy: {
    widgetTitle: string;
    widgetSubtitle: string;
    widgetOpen: string;
    widgetEmpty: string;
    thProduct: string;
    thReturnRate: string;
    thRevenueLost: string;
    thRiskScore: string;
  };
}) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text as="h2" variant="headingMd">
              {copy.widgetTitle}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {copy.widgetSubtitle}
            </Text>
          </BlockStack>
          <Badge tone="attention" toneAndProgressLabelOverride=" ">
            Top 5
          </Badge>
        </InlineStack>

        {products.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">{copy.thProduct}</th>
                <th align="right">{copy.thReturnRate}</th>
                <th align="right">{copy.thRevenueLost}</th>
                <th align="right">{copy.thRiskScore}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.productId}>
                  <td>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {product.productTitle}
                    </Text>
                  </td>
                  <td align="right">{product.returnRate}%</td>
                  <td align="right">
                    {moneyFormatter.format(product.revenueLost)}
                  </td>
                  <td align="right">{product.riskScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Box padding="400" background="bg-surface-active" borderRadius="200">
            <Text as="p" variant="bodySm" tone="subdued">
              {copy.widgetEmpty}
            </Text>
          </Box>
        )}

        <Button url="/app/product-intelligence" variant="plain">
          {copy.widgetOpen}
        </Button>
      </BlockStack>
    </Card>
  );
}
