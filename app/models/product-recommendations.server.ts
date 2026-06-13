import type {
  ProductRecommendation,
  ProductReturnRow,
  ReasonBreakdown,
} from "./product-intelligence.types";

type RecommendationCopy = {
  sizingTitle: string;
  sizingMessage: string;
  notAsDescribedTitle: string;
  notAsDescribedMessage: string;
  damagedTitle: string;
  damagedMessage: string;
  underperformingTitle: string;
  underperformingMessage: (title: string, delta: number) => string;
};

export function buildProductRecommendations(
  products: ProductReturnRow[],
  storeAverageReturnRate: number,
  copy: RecommendationCopy,
): ProductRecommendation[] {
  const recommendations: ProductRecommendation[] = [];

  for (const product of products) {
    if (product.returnsCount === 0) continue;

    const reasonPercents = toReasonPercents(product.reasonBreakdown);
    recommendations.push(
      ...rulesForProduct(product, reasonPercents, storeAverageReturnRate, copy),
    );
  }

  return dedupeRecommendations(recommendations).slice(0, 12);
}

function rulesForProduct(
  product: ProductReturnRow,
  reasonPercents: Record<keyof ReasonBreakdown, number>,
  storeAverageReturnRate: number,
  copy: RecommendationCopy,
): ProductRecommendation[] {
  const items: ProductRecommendation[] = [];

  if (reasonPercents.sizing > 30) {
    items.push({
      id: `${product.productId}-sizing`,
      productId: product.productId,
      productTitle: product.productTitle,
      severity: "attention",
      title: copy.sizingTitle,
      message: copy.sizingMessage,
    });
  }

  if (reasonPercents.notAsDescribed > 20) {
    items.push({
      id: `${product.productId}-not-as-described`,
      productId: product.productId,
      productTitle: product.productTitle,
      severity: "attention",
      title: copy.notAsDescribedTitle,
      message: copy.notAsDescribedMessage,
    });
  }

  if (reasonPercents.damaged > 15) {
    items.push({
      id: `${product.productId}-damaged`,
      productId: product.productId,
      productTitle: product.productTitle,
      severity: "critical",
      title: copy.damagedTitle,
      message: copy.damagedMessage,
    });
  }

  if (
    storeAverageReturnRate > 0 &&
    product.returnRate >= storeAverageReturnRate * 1.5
  ) {
    const delta = Math.round(
      ((product.returnRate - storeAverageReturnRate) /
        storeAverageReturnRate) *
        100,
    );
    items.push({
      id: `${product.productId}-underperforming`,
      productId: product.productId,
      productTitle: product.productTitle,
      severity: "critical",
      title: copy.underperformingTitle,
      message: copy.underperformingMessage(product.productTitle, delta),
    });
  }

  return items;
}

function toReasonPercents(
  breakdown: ReasonBreakdown,
): Record<keyof ReasonBreakdown, number> {
  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  if (!total) {
    return {
      sizing: 0,
      damaged: 0,
      notAsDescribed: 0,
      changedMind: 0,
      lateDelivery: 0,
      other: 0,
    };
  }

  return {
    sizing: Math.round((breakdown.sizing / total) * 100),
    damaged: Math.round((breakdown.damaged / total) * 100),
    notAsDescribed: Math.round((breakdown.notAsDescribed / total) * 100),
    changedMind: Math.round((breakdown.changedMind / total) * 100),
    lateDelivery: Math.round((breakdown.lateDelivery / total) * 100),
    other: Math.round((breakdown.other / total) * 100),
  };
}

function dedupeRecommendations(
  items: ProductRecommendation[],
): ProductRecommendation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
