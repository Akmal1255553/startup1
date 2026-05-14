import type { Locale } from "../types";

export type DashboardMessages = {
  pageTitle: string;
  pageSubtitle: string;
  primaryOpenHighestRisk: string;
  primaryWaitingOrders: string;
  secondaryViewQueue: string;
  secondaryExportCsvUpgrade: string;
  secondaryExportCsv: string;
  secondaryExportCsvPreparing: string;
  bannerFinishSetup: string;
  bannerOpenSetup: string;
  bannerHide: string;
  bannerSetupBody: (pct: number) => string;
  errorTitleProtected: string;
  errorTitleGeneric: string;
  errorProtectedBody: (detectedOrders: number) => string;
  cardEstimatedMargin: string;
  cardManualReview: string;
  cardRefundHolds: string;
  cardApprovalRatio: string;
  cardFlaggedReturns: string;
  cardBadgeLive: string;
  cardMarginCaptionFlagged: (
    gmv: string,
    marginPct: number,
    orders: number,
  ) => string;
  cardMarginCaptionNone: (orders: number) => string;
  cardReviewCaption: (reviewLow: number, holdHighMinus1: number) => string;
  cardHoldCaption: (holdThreshold: number) => string;
  cardApprovalCaption: (totalReturns: number) => string;
  cardFlaggedCaption: (avgRisk: number) => string;
  queueTitle: string;
  queueSubtitle: string;
  queueOpenFull: string;
  thOrder: string;
  thCustomer: string;
  thValue: string;
  thRisk: string;
  thGuidance: string;
  thDecision: string;
  queueEmptyTitle: string;
  queueEmptyLocked: (detected: number) => string;
  queueEmptyHint: string;
  placedOn: string;
  signalTitle: string;
  signalSub1: (
    avg: number,
    spread: number,
    analyzed: number,
  ) => string;
  signalSub2: string;
  analysisTitle: string;
  analysisBadgeAi: string;
  analysisOpenAnalytics: string;
  playbooksTitle: string;
  playbooksManage: string;
  playbooksOn: string;
  recentTitle: string;
  recentEmpty: string;
  btnApprove: string;
  btnReview: string;
  btnHold: string;
  noDecisionYet: string;
  decisionApproved: string;
  decisionReview: string;
  decisionHold: string;
  playbook1: string;
  playbook2: string;
  playbook3: string;
};

const en: DashboardMessages = {
  pageTitle: "ReturnGuard AI",
  pageSubtitle:
    "Operational return-risk control center for your Shopify store",
  primaryOpenHighestRisk: "Open highest risk order",
  primaryWaitingOrders: "Waiting for orders",
  secondaryViewQueue: "View queue",
  secondaryExportCsvUpgrade: "Export CSV (upgrade)",
  secondaryExportCsv: "Export CSV",
  secondaryExportCsvPreparing: "Preparing CSV…",
  bannerFinishSetup: "Finish setting up ReturnGuard",
  bannerOpenSetup: "Open setup",
  bannerHide: "Hide",
  bannerSetupBody: (pct) =>
    `Setup is ${pct}% complete. Finish a couple more steps so ReturnGuard can start auto-scoring your returns.`,
  errorTitleProtected: "Order details need approval",
  errorTitleGeneric: "Shopify data did not load",
  errorProtectedBody: (detectedOrders) =>
    `Detected orders: ${detectedOrders}. Enable Protected Customer Data access in the Shopify Partner Dashboard, then reinstall the app so Shopify grants order details to this access token.`,
  cardEstimatedMargin: "Estimated margin protected",
  cardManualReview: "Manual review queue",
  cardRefundHolds: "Refund holds",
  cardApprovalRatio: "Approval ratio",
  cardFlaggedReturns: "Flagged returns",
  cardBadgeLive: "Live",
  cardMarginCaptionFlagged: (gmv, marginPct, orders) =>
    `${gmv} in review+hold risk band · × ${marginPct}% margin estimate · ${orders} orders in view`,
  cardMarginCaptionNone: (orders) =>
    `${orders} recent orders in view — none in the review risk band yet`,
  cardReviewCaption: (reviewLow, holdHighMinus1) =>
    `Risk ${reviewLow}-${holdHighMinus1}`,
  cardHoldCaption: (holdThreshold) => `Risk ${holdThreshold}+`,
  cardApprovalCaption: (totalReturns) => `${totalReturns} total returns`,
  cardFlaggedCaption: (avgRisk) => `${avgRisk} avg risk score`,
  queueTitle: "Live return-risk queue",
  queueSubtitle:
    "Recent orders ranked by refund risk, customer context, and operational status.",
  queueOpenFull: "Open full queue",
  thOrder: "Order",
  thCustomer: "Customer",
  thValue: "Value",
  thRisk: "Risk",
  thGuidance: "Recommendation & context",
  thDecision: "Decision",
  queueEmptyTitle: "No recent orders found",
  queueEmptyLocked: (detected) =>
    `${detected} order found, but details are locked until Protected Customer Data access is enabled.`,
  queueEmptyHint:
    "Create a test order in Shopify, then refresh this page to see ReturnGuard score it.",
  placedOn: "Placed",
  signalTitle: "Signal confidence",
  signalSub1: (avg, spread, analyzed) =>
    `Avg risk ${avg} · spread ±${spread} · ${analyzed} orders analyzed`,
  signalSub2:
    "Confidence drops as risk spread widens — more agreement across orders means higher confidence in the call.",
  analysisTitle: "ReturnGuard analysis",
  analysisBadgeAi: "AI",
  analysisOpenAnalytics: "Open analytics",
  playbooksTitle: "Active playbooks",
  playbooksManage: "Manage playbooks",
  playbooksOn: "On",
  recentTitle: "Recent actions",
  recentEmpty: "No moderation actions yet.",
  btnApprove: "Approve",
  btnReview: "Review",
  btnHold: "Hold",
  noDecisionYet: "No decision yet",
  decisionApproved: "Approved",
  decisionReview: "Needs review",
  decisionHold: "Refund held",
  playbook1: "Flag high-value refund requests",
  playbook2: "Pause refunds above the hold threshold",
  playbook3: "Auto-approve low-risk paid and fulfilled orders",
};

const ru: DashboardMessages = {
  pageTitle: "ReturnGuard AI",
  pageSubtitle:
    "Операционный центр контроля риска возвратов для вашего магазина Shopify",
  primaryOpenHighestRisk: "Открыть заказ с максимальным риском",
  primaryWaitingOrders: "Ожидаем заказы",
  secondaryViewQueue: "Очередь",
  secondaryExportCsvUpgrade: "Экспорт CSV (апгрейд)",
  secondaryExportCsv: "Экспорт CSV",
  secondaryExportCsvPreparing: "Готовим CSV…",
  bannerFinishSetup: "Завершите настройку ReturnGuard",
  bannerOpenSetup: "К настройке",
  bannerHide: "Скрыть",
  bannerSetupBody: (pct) =>
    `Настройка выполнена на ${pct}%. Завершите ещё пару шагов, чтобы ReturnGuard начал автоматически оценивать возвраты.`,
  errorTitleProtected: "Нужен доступ к данным заказов",
  errorTitleGeneric: "Данные Shopify не загрузились",
  errorProtectedBody: (detectedOrders) =>
    `Обнаружено заказов: ${detectedOrders}. Включите доступ Protected Customer Data в Partner Dashboard и переустановите приложение, чтобы Shopify выдал токену детали заказов.`,
  cardEstimatedMargin: "Оценка защищённой маржи",
  cardManualReview: "Очередь ручной проверки",
  cardRefundHolds: "Удержания возвратов",
  cardApprovalRatio: "Доля одобрений",
  cardFlaggedReturns: "Помеченные возвраты",
  cardBadgeLive: "Онлайн",
  cardMarginCaptionFlagged: (gmv, marginPct, orders) =>
    `${gmv} в зоне риска review+hold · × ${marginPct}% оценка маржи · ${orders} заказов в выборке`,
  cardMarginCaptionNone: (orders) =>
    `${orders} недавних заказов в выборке — пока ни одного в зоне review`,
  cardReviewCaption: (reviewLow, holdHighMinus1) =>
    `Риск ${reviewLow}–${holdHighMinus1}`,
  cardHoldCaption: (holdThreshold) => `Риск ${holdThreshold}+`,
  cardApprovalCaption: (totalReturns) => `Всего возвратов: ${totalReturns}`,
  cardFlaggedCaption: (avgRisk) => `Средний риск: ${avgRisk}`,
  queueTitle: "Живая очередь риска возвратов",
  queueSubtitle:
    "Недавние заказы по риску возврата, контексту клиента и операционному статусу.",
  queueOpenFull: "Полная очередь",
  thOrder: "Заказ",
  thCustomer: "Клиент",
  thValue: "Сумма",
  thRisk: "Риск",
  thGuidance: "Рекомендация и контекст",
  thDecision: "Решение",
  queueEmptyTitle: "Недавних заказов не найдено",
  queueEmptyLocked: (detected) =>
    `Найден ${detected} заказ, но детали скрыты, пока не включён доступ Protected Customer Data.`,
  queueEmptyHint:
    "Создайте тестовый заказ в Shopify и обновите страницу — ReturnGuard оценит его.",
  placedOn: "Оформлен",
  signalTitle: "Уверенность сигнала",
  signalSub1: (avg, spread, analyzed) =>
    `Сред. риск ${avg} · разброс ±${spread} · проанализировано заказов: ${analyzed}`,
  signalSub2:
    "Уверенность падает при росте разброса риска — чем согласованнее оценки, тем выше уверенность.",
  analysisTitle: "Аналитика ReturnGuard",
  analysisBadgeAi: "ИИ",
  analysisOpenAnalytics: "Открыть аналитику",
  playbooksTitle: "Активные сценарии",
  playbooksManage: "Управление сценариями",
  playbooksOn: "Вкл",
  recentTitle: "Недавние действия",
  recentEmpty: "Пока нет действий модерации.",
  btnApprove: "Одобрить",
  btnReview: "Проверить",
  btnHold: "Удержать",
  noDecisionYet: "Решения ещё нет",
  decisionApproved: "Одобрено",
  decisionReview: "На проверке",
  decisionHold: "Возврат удержан",
  playbook1: "Помечать крупные запросы на возврат",
  playbook2: "Пауза возвратов выше порога удержания",
  playbook3: "Авто-одобрение низкорисковых оплаченных и выполненных заказов",
};

export function getDashboardMessages(locale: Locale): DashboardMessages {
  if (locale === "ru") return ru;
  return en;
}

export function decisionLabelFromDashboard(
  d: DashboardMessages,
  decision: string,
): string {
  if (decision === "approved") return d.decisionApproved;
  if (decision === "hold") return d.decisionHold;
  return d.decisionReview;
}
