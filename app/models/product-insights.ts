import type { Locale } from "../i18n/types";
import { getProductInsightsCopy } from "../i18n/messages/product-insights-copy";
import type { Insight } from "./ai-insights";
import { buildReasonAnalysis } from "./product-reason-analysis";
import type {
  ProductReturnRow,
  ReturnReasonAnalysis,
} from "./product-intelligence.types";

export function buildProductInsights(
  products: ProductReturnRow[],
  reasonAnalysis: ReturnReasonAnalysis,
  locale: Locale,
): Insight[] {
  const copy = getProductInsightsCopy(locale);
  const insights: Insight[] = [];

  if (!products.length) {
    return [
      {
        id: "product-no-data",
        severity: "info",
        title: copy.noDataTitle,
        message: copy.noDataMessage,
        cta: { label: copy.noDataCta, url: "/app/returns" },
      },
    ];
  }

  const withReturns = products.filter((product) => product.returnsCount > 0);
  if (!withReturns.length) {
    return [
      {
        id: "product-no-returns",
        severity: "success",
        title: copy.noReturnsTitle,
        message: copy.noReturnsMessage,
      },
    ];
  }

  const topProduct = [...withReturns].sort(
    (a, b) => b.returnsCount - a.returnsCount,
  )[0];
  const totalReturns = withReturns.reduce(
    (sum, product) => sum + product.returnsCount,
    0,
  );
  const share = Math.round((topProduct.returnsCount / totalReturns) * 100);

  if (share >= 10) {
    insights.push({
      id: "top-return-driver",
      severity: share >= 25 ? "critical" : "attention",
      title: copy.topDriverTitle,
      message: copy.topDriverMessage(topProduct.productTitle, share),
      cta: { label: copy.openIntelligence, url: "/app/product-intelligence" },
    });
  }

  const dominantReason = dominantReasonCategory(reasonAnalysis);
  if (dominantReason && reasonAnalysis.total > 0) {
    const pct = Math.round(
      (reasonAnalysis[dominantReason].count / reasonAnalysis.total) * 100,
    );
    if (pct >= 40) {
      insights.push({
        id: "dominant-reason",
        severity: "attention",
        title: copy.dominantReasonTitle,
        message: copy.dominantReasonMessage(
          copy.reasonLabels[dominantReason],
          pct,
        ),
        cta: {
          label: copy.openIntelligence,
          url: "/app/product-intelligence",
        },
      });
    }
  }

  const costlyProduct = [...withReturns].sort(
    (a, b) => b.revenueLost - a.revenueLost,
  )[0];
  if (costlyProduct.revenueLost >= 100) {
    insights.push({
      id: "costly-product",
      severity: "critical",
      title: copy.costlyProductTitle,
      message: copy.costlyProductMessage(
        costlyProduct.productTitle,
        costlyProduct.revenueLost,
        costlyProduct.currencyCode,
      ),
      cta: { label: copy.openIntelligence, url: "/app/product-intelligence" },
    });
  }

  return insights.slice(0, 6);
}

export function buildProductInsightCards(
  products: ProductReturnRow[],
  locale: Locale,
) {
  return buildProductInsights(
    products,
    buildReasonAnalysis(products.filter((product) => product.returnsCount > 0)),
    locale,
  );
}

function dominantReasonCategory(
  analysis: ReturnReasonAnalysis,
):
  | "sizing"
  | "damaged"
  | "notAsDescribed"
  | "changedMind"
  | "lateDelivery"
  | "other"
  | null {
  const entries = [
    ["sizing", analysis.sizing.count],
    ["damaged", analysis.damaged.count],
    ["notAsDescribed", analysis.notAsDescribed.count],
    ["changedMind", analysis.changedMind.count],
    ["lateDelivery", analysis.lateDelivery.count],
    ["other", analysis.other.count],
  ] as const;

  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  if (!sorted[0] || sorted[0][1] === 0) return null;
  return sorted[0][0];
}
