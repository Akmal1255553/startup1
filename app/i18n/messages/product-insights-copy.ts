import type { Locale } from "../types";
import { pickByLocale } from "../pick-locale";

export type ProductInsightsCopy = {
  noDataTitle: string;
  noDataMessage: string;
  noDataCta: string;
  noReturnsTitle: string;
  noReturnsMessage: string;
  topDriverTitle: string;
  topDriverMessage: (productTitle: string, share: number) => string;
  dominantReasonTitle: string;
  dominantReasonMessage: (reason: string, pct: number) => string;
  costlyProductTitle: string;
  costlyProductMessage: (
    productTitle: string,
    amount: number,
    currencyCode: string,
  ) => string;
  openIntelligence: string;
  reasonLabels: {
    sizing: string;
    damaged: string;
    notAsDescribed: string;
    changedMind: string;
    lateDelivery: string;
    other: string;
  };
  widgetTitle: string;
  widgetSubtitle: string;
  widgetOpen: string;
  widgetEmpty: string;
  widgetThProduct: string;
  widgetThReturnRate: string;
  widgetThRevenueLost: string;
  widgetThRiskScore: string;
};

const en: ProductInsightsCopy = {
  noDataTitle: "No product return data yet",
  noDataMessage:
    "Once returns are processed, product-level insights will appear here.",
  noDataCta: "Open returns queue",
  noReturnsTitle: "No product returns detected",
  noReturnsMessage: "Your catalog looks healthy — no product returns in the analysis window.",
  topDriverTitle: "Top return driver",
  topDriverMessage: (productTitle, share) =>
    `Product ${productTitle} generates ${share}% of all store returns.`,
  dominantReasonTitle: "Dominant return reason",
  dominantReasonMessage: (reason, pct) =>
    `${pct}% of returns are caused by ${reason.toLowerCase()}.`,
  costlyProductTitle: "High-cost return product",
  costlyProductMessage: (productTitle, amount, currencyCode) =>
    `${productTitle} costs approximately ${formatMoney(amount, currencyCode)} per month in return losses.`,
  openIntelligence: "Open product intelligence",
  reasonLabels: {
    sizing: "sizing issues",
    damaged: "damaged items",
    notAsDescribed: "not-as-described issues",
    changedMind: "changed mind",
    lateDelivery: "late delivery",
    other: "other reasons",
  },
  widgetTitle: "Top products causing returns",
  widgetSubtitle: "Highest-impact products in your return catalog",
  widgetOpen: "View all product intelligence",
  widgetEmpty: "No product return data available yet.",
  widgetThProduct: "Product",
  widgetThReturnRate: "Return rate",
  widgetThRevenueLost: "Revenue lost",
  widgetThRiskScore: "Risk score",
};

const ru: ProductInsightsCopy = {
  ...en,
  noDataTitle: "Пока нет данных по возвратам товаров",
  noDataMessage:
    "После обработки возвратов здесь появятся инсайты по товарам.",
  noDataCta: "Открыть очередь возвратов",
  noReturnsTitle: "Возвраты по товарам не обнаружены",
  noReturnsMessage: "Каталог выглядит здоровым — возвратов за период нет.",
  topDriverTitle: "Главный источник возвратов",
  topDriverMessage: (productTitle, share) =>
    `Товар ${productTitle} даёт ${share}% всех возвратов магазина.`,
  dominantReasonTitle: "Основная причина возвратов",
  dominantReasonMessage: (reason, pct) =>
    `${pct}% возвратов связаны с ${reason}.`,
  costlyProductTitle: "Дорогой возвратный товар",
  costlyProductMessage: (productTitle, amount, currencyCode) =>
    `${productTitle} обходится примерно в ${formatMoney(amount, currencyCode)} в месяц из-за возвратов.`,
  openIntelligence: "Открыть аналитику товаров",
  reasonLabels: {
    sizing: "проблемами с размером",
    damaged: "повреждениями",
    notAsDescribed: "несоответствием описанию",
    changedMind: "передумыванием",
    lateDelivery: "поздней доставкой",
    other: "другими причинами",
  },
  widgetTitle: "Топ товаров по возвратам",
  widgetSubtitle: "Товары с наибольшим влиянием на возвраты",
  widgetOpen: "Вся аналитика по товарам",
  widgetEmpty: "Данных о возвратах по товарам пока нет.",
};

const PRODUCT_INSIGHTS_COPY: Record<Locale, ProductInsightsCopy> = {
  en,
  ru,
  es: en,
  de: en,
  fr: en,
  "pt-BR": en,
  ja: en,
  it: en,
  nl: en,
  ko: en,
};

export function getProductInsightsCopy(locale: Locale): ProductInsightsCopy {
  return pickByLocale(PRODUCT_INSIGHTS_COPY, locale);
}

function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount)}`;
  }
}
