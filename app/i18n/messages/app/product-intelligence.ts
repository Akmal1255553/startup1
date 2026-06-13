import type { Locale } from "../../types";
import { pickByLocale } from "../../pick-locale";

export type ProductIntelligenceCopy = {
  title: string;
  subtitle: string;
  errorLoad: string;
  totalProducts: string;
  productsWithReturns: string;
  averageReturnRate: string;
  estimatedRevenueLost: string;
  estimatedRevenueSaved: string;
  revenueAtRisk: string;
  revenueRecoverable: string;
  searchPlaceholder: string;
  sortLabel: string;
  sortProductTitle: string;
  sortOrdersCount: string;
  sortReturnsCount: string;
  sortReturnRate: string;
  sortRevenueLost: string;
  sortRiskScore: string;
  thProduct: string;
  thSku: string;
  thOrders: string;
  thReturns: string;
  thReturnRate: string;
  thRevenueLost: string;
  thRisk: string;
  thRiskScore: string;
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  emptyTable: string;
  drawerTitle: string;
  drawerReturnRate: string;
  drawerRevenueLost: string;
  drawerTopReasons: string;
  drawerReturnTrend: string;
  drawerRiskScore: string;
  drawerRecommendations: string;
  reasonsTitle: string;
  reasonsSubtitle: string;
  reasonSizing: string;
  reasonDamaged: string;
  reasonNotAsDescribed: string;
  reasonChangedMind: string;
  reasonLateDelivery: string;
  reasonOther: string;
  recommendationsTitle: string;
  recommendationsSubtitle: string;
  insightsTitle: string;
  insightsSubtitle: string;
  recSizingTitle: string;
  recSizingMessage: string;
  recNotAsDescribedTitle: string;
  recNotAsDescribedMessage: string;
  recDamagedTitle: string;
  recDamagedMessage: string;
  recUnderperformingTitle: string;
  recUnderperformingMessage: (title: string, delta: number) => string;
  viewProduct: string;
  closeDrawer: string;
};

const en: ProductIntelligenceCopy = {
  title: "Product Return Intelligence",
  subtitle:
    "Identify high-return products, understand why customers return them, and take action",
  errorLoad: "Unable to load product return data right now.",
  totalProducts: "Total products",
  productsWithReturns: "Products with returns",
  averageReturnRate: "Average product return rate",
  estimatedRevenueLost: "Estimated revenue lost",
  estimatedRevenueSaved: "Estimated revenue saved",
  revenueAtRisk: "Revenue at risk",
  revenueRecoverable: "Potential revenue recoverable",
  searchPlaceholder: "Search by product name or SKU",
  sortLabel: "Sort by",
  sortProductTitle: "Product name",
  sortOrdersCount: "Orders count",
  sortReturnsCount: "Returns count",
  sortReturnRate: "Return rate",
  sortRevenueLost: "Revenue lost",
  sortRiskScore: "Risk score",
  thProduct: "Product",
  thSku: "SKU",
  thOrders: "Orders",
  thReturns: "Returns",
  thReturnRate: "Return rate",
  thRevenueLost: "Revenue lost",
  thRisk: "Risk",
  thRiskScore: "Risk score",
  riskLow: "Low",
  riskMedium: "Medium",
  riskHigh: "High",
  emptyTable: "No product return data found for this period.",
  drawerTitle: "Product details",
  drawerReturnRate: "Return rate",
  drawerRevenueLost: "Revenue lost",
  drawerTopReasons: "Top return reasons",
  drawerReturnTrend: "Return trend (30 days)",
  drawerRiskScore: "Product risk score",
  drawerRecommendations: "Recommendations",
  reasonsTitle: "Return reasons analysis",
  reasonsSubtitle: "Why customers are returning products across your catalog",
  reasonSizing: "Sizing issues",
  reasonDamaged: "Damaged item",
  reasonNotAsDescribed: "Not as described",
  reasonChangedMind: "Changed mind",
  reasonLateDelivery: "Late delivery",
  reasonOther: "Other",
  recommendationsTitle: "AI recommendations",
  recommendationsSubtitle:
    "Automated actions to reduce future returns based on your product data",
  insightsTitle: "Product insights",
  insightsSubtitle: "Key patterns detected across your return catalog",
  recSizingTitle: "Add sizing guidance",
  recSizingMessage: "Add a size guide and sizing recommendations.",
  recNotAsDescribedTitle: "Improve product accuracy",
  recNotAsDescribedMessage:
    "Improve product images and product description.",
  recDamagedTitle: "Review fulfillment quality",
  recDamagedMessage:
    "Review packaging process and shipping carrier quality.",
  recUnderperformingTitle: "Review underperforming product",
  recUnderperformingMessage: (title, delta) =>
    `${title} is significantly underperforming (${delta}% above store average) and should be reviewed.`,
  viewProduct: "View details",
  closeDrawer: "Close",
};

const ru: ProductIntelligenceCopy = {
  ...en,
  title: "Аналитика возвратов по товарам",
  subtitle:
    "Найдите товары с высоким процентом возвратов, поймите причины и снизьте потери",
  errorLoad: "Не удалось загрузить данные о возвратах по товарам.",
  totalProducts: "Всего товаров",
  productsWithReturns: "Товары с возвратами",
  averageReturnRate: "Средний процент возвратов",
  estimatedRevenueLost: "Оценка потерь выручки",
  estimatedRevenueSaved: "Оценка сохранённой выручки",
  revenueAtRisk: "Выручка под риском",
  revenueRecoverable: "Потенциально восстановимая выручка",
  searchPlaceholder: "Поиск по названию или SKU",
  sortLabel: "Сортировка",
  sortProductTitle: "Название товара",
  sortOrdersCount: "Количество заказов",
  sortReturnsCount: "Количество возвратов",
  sortReturnRate: "Процент возвратов",
  sortRevenueLost: "Потери выручки",
  sortRiskScore: "Оценка риска",
  thProduct: "Товар",
  thSku: "SKU",
  thOrders: "Заказы",
  thReturns: "Возвраты",
  thReturnRate: "Процент возвратов",
  thRevenueLost: "Потери",
  thRisk: "Риск",
  thRiskScore: "Оценка риска",
  riskLow: "Низкий",
  riskMedium: "Средний",
  riskHigh: "Высокий",
  emptyTable: "За этот период нет данных о возвратах по товарам.",
  drawerTitle: "Детали товара",
  drawerReturnRate: "Процент возвратов",
  drawerRevenueLost: "Потери выручки",
  drawerTopReasons: "Основные причины возвратов",
  drawerReturnTrend: "Тренд возвратов (30 дней)",
  drawerRiskScore: "Оценка риска товара",
  drawerRecommendations: "Рекомендации",
  reasonsTitle: "Анализ причин возвратов",
  reasonsSubtitle: "Почему покупатели возвращают товары в вашем каталоге",
  reasonSizing: "Проблемы с размером",
  reasonDamaged: "Повреждённый товар",
  reasonNotAsDescribed: "Не соответствует описанию",
  reasonChangedMind: "Передумал",
  reasonLateDelivery: "Поздняя доставка",
  reasonOther: "Другое",
  recommendationsTitle: "ИИ-рекомендации",
  recommendationsSubtitle:
    "Автоматические действия для снижения будущих возвратов",
  insightsTitle: "Инсайты по товарам",
  insightsSubtitle: "Ключевые паттерны в ваших возвратах",
  recSizingTitle: "Добавьте таблицу размеров",
  recSizingMessage: "Добавьте таблицу размеров и рекомендации по выбору размера.",
  recNotAsDescribedTitle: "Улучшите описание товара",
  recNotAsDescribedMessage: "Улучшите фото и описание товара.",
  recDamagedTitle: "Проверьте качество упаковки",
  recDamagedMessage: "Проверьте упаковку и качество службы доставки.",
  recUnderperformingTitle: "Проверьте проблемный товар",
  recUnderperformingMessage: (title, delta) =>
    `${title} значительно отстаёт (${delta}% выше среднего по магазину) и требует проверки.`,
  viewProduct: "Подробнее",
  closeDrawer: "Закрыть",
};

const PRODUCT_INTELLIGENCE_COPY: Record<Locale, ProductIntelligenceCopy> = {
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

export function getProductIntelligenceCopy(
  locale: Locale,
): ProductIntelligenceCopy {
  return pickByLocale(PRODUCT_INTELLIGENCE_COPY, locale);
}
