import type { Locale } from "../../types";
import { pickByLocale } from "../../pick-locale";
import { RETURNS_COPY } from "../../translations/returns";

export type ReturnsCopy = {
  title: string;
  subtitle: string;
  riskSettings: string;
  errorLoad: string;
  searchLabel: string;
  searchPlaceholder: string;
  filteredBy: (q: string) => string;
  clear: string;
  filter: string;
  filterAll: string;
  filterHold: string;
  filterReview: string;
  filterApproved: string;
  filterUndecided: string;
  sort: string;
  sortRiskDesc: string;
  sortRiskAsc: string;
  sortValueDesc: string;
  sortCreatedDesc: string;
  sortCreatedAsc: string;
  workloadTitle: string;
  workloadSubtitle: (shown: number, source: number) => string;
  noReturnsNote: string;
  needsAction: (n: number) => string;
  colReturn: string;
  colCustomer: string;
  colValue: string;
  colRisk: string;
  colRecommendation: string;
  colDecision: string;
  emptyFiltered: string;
  emptyPage: string;
  returnFallback: string;
  returnOpened: (date: string, qty: number) => string;
  lifetimeOrders: (n: number) => string;
  viewDetails: string;
  noDecision: string;
  playbook: (names: string) => string;
  approve: string;
  review: string;
  hold: string;
  bulkApprove: string;
  bulkReview: string;
  bulkHold: string;
  bulkLocked: string;
  selectPrompt: string;
  bulkConfirmHold: string;
  historyTitle: string;
  historyCount: (n: number) => string;
  historyEmpty: string;
  historyDelete: string;
  historyDeleteConfirm: string;
  modalRisk: string;
  modalSuggested: (rec: string) => string;
  modalRiskBadge: (n: number) => string;
  modalCustomer: string;
  modalOrder: string;
  modalAnalysis: string;
  modalFactors: string;
  modalNoFactors: string;
  modalOpenAdmin: string;
  modalPlaybooks: (names: string) => string;
  loadingHistory: string;
  noHistory: string;
  otherReturn: string;
  riskLabel: (n: number) => string;
  freeBannerTitle: string;
  freeBannerBody: (max: number) => string;
  comparePlans: string;
  bulkBannerTitle: string;
  bulkBannerBody: string;
  toastSaved: string;
  toastHistoryRemoved: string;
  toastBulk: (n: number) => string;
  errorBulkGated: string;
  errorHistoryGated: string;
  queueFactorReturn: (name: string, status: string, qty: number) => string;
  queueFactorNoReturn: string;
  detailName: string;
  detailEmail: string;
  detailLifetimeOrders: string;
  detailAccountAge: string;
  detailOrderValue: string;
  detailPayment: string;
  detailFulfillment: string;
  detailOpened: string;
  detailReturnStatus: string;
  detailReturnQuantity: string;
  accountAgeUnknown: string;
  accountAgeToday: string;
  accountAgeDays: (days: number) => string;
  emailNotShared: string;
  modalPreviousDecisions: string;
  modalAiBadge: string;
  returnTriageTitle: (orderName: string) => string;
  historyDeleteAria: string;
  toastBulkApplied: string;
  historyNoEntries: string;
};

const en: ReturnsCopy = {
  title: "Returns Queue",
  subtitle:
    "A focused workspace for reviewing refund risk, saving decisions, and opening Shopify context.",
  riskSettings: "Risk settings",
  errorLoad: "Shopify data did not load",
  searchLabel: "Search queue",
  searchPlaceholder: "Search by order (#1001) or return name",
  filteredBy: (q) => `Filtered by Shopify search: "${q}"`,
  clear: "Clear",
  filter: "Filter",
  filterAll: "All on this page",
  filterHold: "Hold",
  filterReview: "Review",
  filterApproved: "Approved",
  filterUndecided: "Undecided",
  sort: "Sort",
  sortRiskDesc: "Risk (high → low)",
  sortRiskAsc: "Risk (low → high)",
  sortValueDesc: "Value (high → low)",
  sortCreatedDesc: "Newest first",
  sortCreatedAsc: "Oldest first",
  workloadTitle: "Review workload",
  workloadSubtitle: (shown, source) =>
    `Showing ${shown} queue row(s) from ${source} Shopify order(s) on this page.`,
  noReturnsNote:
    "No Return records loaded for these orders — rows show order-level risk until a return is opened in Shopify.",
  needsAction: (n) => `${n} needs action`,
  colReturn: "Return / order",
  colCustomer: "Customer",
  colValue: "Value",
  colRisk: "Risk",
  colRecommendation: "Recommendation",
  colDecision: "Decision",
  emptyFiltered: "No rows on this page match the local filter.",
  emptyPage: "No orders on this page. Clear the search or try another page.",
  returnFallback: "Return",
  returnOpened: (date, qty) => `Return opened ${date} · ${qty} unit(s)`,
  lifetimeOrders: (n) => `${n} lifetime orders`,
  viewDetails: "View details",
  noDecision: "No decision yet",
  playbook: (names) => `Playbook: ${names}`,
  approve: "Approve",
  review: "Review",
  hold: "Hold",
  bulkApprove: "Bulk approve",
  bulkReview: "Bulk review",
  bulkHold: "Bulk hold",
  bulkLocked: "Bulk actions are available on Growth and Scale.",
  selectPrompt: "Select returns to run bulk decisions.",
  bulkConfirmHold: "Apply HOLD to selected returns?",
  historyTitle: "Recent decision history",
  historyCount: (n) => `${n} entries`,
  historyEmpty: "No decision history yet.",
  historyDelete: "Delete",
  historyDeleteConfirm: "Remove this history entry?",
  modalRisk: "Risk overview",
  modalSuggested: (rec) => `Suggested action: ${rec}`,
  modalRiskBadge: (n) => `Risk ${n}`,
  modalCustomer: "Customer",
  modalOrder: "Order context",
  modalAnalysis: "ReturnGuard analysis",
  modalFactors: "Risk factors",
  modalNoFactors: "No risk factors recorded for this row.",
  modalOpenAdmin: "Open in Shopify Admin",
  modalPlaybooks: (names) => `Playbooks applied: ${names}`,
  loadingHistory: "Loading history…",
  noHistory: "No decisions logged for this order yet.",
  otherReturn: "(other return on same order)",
  riskLabel: (n) => `risk ${n}`,
  freeBannerTitle: "You're on the Free plan",
  freeBannerBody: (max) =>
    `Risk scoring, saving decisions, and CSV export are included. Queue pages up to ${max} rows.`,
  comparePlans: "Compare paid plans",
  bulkBannerTitle: "Bulk moderation locked",
  bulkBannerBody:
    "Bulk actions, automation playbooks, and the audit log unlock on Growth and Scale.",
  toastSaved: "Decision saved",
  toastHistoryRemoved: "History entry removed",
  toastBulk: (n) => `Updated ${n} return row(s)`,
  errorBulkGated:
    "Bulk moderation is available on the Growth and Scale plans. Open Billing to upgrade.",
  errorHistoryGated:
    "Decision history is available on the Growth and Scale plans.",
  queueFactorReturn: (name, status, qty) =>
    `Shopify return ${name} (${status}) · ${qty} unit(s)`,
  queueFactorNoReturn:
    "No open Shopify Return on this order — triage uses order-level risk.",
  detailName: "Name",
  detailEmail: "Email",
  detailLifetimeOrders: "Lifetime orders",
  detailAccountAge: "Account age",
  detailOrderValue: "Order value",
  detailPayment: "Payment",
  detailFulfillment: "Fulfillment",
  detailOpened: "Opened",
  detailReturnStatus: "Return status",
  detailReturnQuantity: "Return quantity",
  accountAgeUnknown: "Unknown account age",
  accountAgeToday: "Created today",
  accountAgeDays: (days) =>
    `${days} day${days === 1 ? "" : "s"} old account`,
  emailNotShared: "Not shared",
  modalPreviousDecisions: "Previous decisions on this order",
  modalAiBadge: "AI",
  returnTriageTitle: (orderName) => `Return triage · ${orderName}`,
  historyDeleteAria: "Delete history entry",
  toastBulkApplied: "Bulk action applied",
  historyNoEntries: "No entries",
};

const ru: ReturnsCopy = {
  title: "Очередь возвратов",
  subtitle:
    "Рабочее место для проверки риска возвратов, сохранения решений и перехода в Shopify.",
  riskSettings: "Настройки риска",
  errorLoad: "Данные Shopify не загрузились",
  searchLabel: "Поиск в очереди",
  searchPlaceholder: "Заказ (#1001) или номер возврата",
  filteredBy: (q) => `Поиск Shopify: «${q}»`,
  clear: "Сбросить",
  filter: "Фильтр",
  filterAll: "Все на странице",
  filterHold: "Удержание",
  filterReview: "Проверка",
  filterApproved: "Одобрено",
  filterUndecided: "Без решения",
  sort: "Сортировка",
  sortRiskDesc: "Риск (выше → ниже)",
  sortRiskAsc: "Риск (ниже → выше)",
  sortValueDesc: "Сумма (выше → ниже)",
  sortCreatedDesc: "Сначала новые",
  sortCreatedAsc: "Сначала старые",
  workloadTitle: "Нагрузка на проверку",
  workloadSubtitle: (shown, source) =>
    `Показано ${shown} строк из ${source} заказов Shopify на этой странице.`,
  noReturnsNote:
    "Для этих заказов нет записей Return — показан риск на уровне заказа, пока возврат не открыт в Shopify.",
  needsAction: (n) => `${n} требуют действия`,
  colReturn: "Возврат / заказ",
  colCustomer: "Клиент",
  colValue: "Сумма",
  colRisk: "Риск",
  colRecommendation: "Рекомендация",
  colDecision: "Решение",
  emptyFiltered: "Нет строк по этому фильтру.",
  emptyPage: "Нет заказов на странице. Сбросьте поиск или откройте другую страницу.",
  returnFallback: "Возврат",
  returnOpened: (date, qty) => `Возврат открыт ${date} · ${qty} шт.`,
  lifetimeOrders: (n) => `${n} заказов всего`,
  viewDetails: "Подробнее",
  noDecision: "Решения ещё нет",
  playbook: (names) => `Сценарий: ${names}`,
  approve: "Одобрить",
  review: "Проверить",
  hold: "Удержать",
  bulkApprove: "Массово одобрить",
  bulkReview: "Массово на проверку",
  bulkHold: "Массово удержать",
  bulkLocked: "Массовые действия — на Growth и Scale.",
  selectPrompt: "Выберите возвраты для массового действия.",
  bulkConfirmHold: "Применить УДЕРЖАНИЕ к выбранным возвратам?",
  historyTitle: "Недавняя история решений",
  historyCount: (n) => `${n} записей`,
  historyEmpty: "Истории решений пока нет.",
  historyDelete: "Удалить",
  historyDeleteConfirm: "Удалить эту запись истории?",
  modalRisk: "Обзор риска",
  modalSuggested: (rec) => `Рекомендация: ${rec}`,
  modalRiskBadge: (n) => `Риск ${n}`,
  modalCustomer: "Клиент",
  modalOrder: "Контекст заказа",
  modalAnalysis: "Анализ ReturnGuard",
  modalFactors: "Факторы риска",
  modalNoFactors: "Факторы риска для этой строки не записаны.",
  modalOpenAdmin: "Открыть в Shopify Admin",
  modalPlaybooks: (names) => `Сценарии: ${names}`,
  loadingHistory: "Загрузка истории…",
  noHistory: "Для этого заказа решений пока нет.",
  otherReturn: "(другой возврат по заказу)",
  riskLabel: (n) => `риск ${n}`,
  freeBannerTitle: "У вас тариф Free",
  freeBannerBody: (max) =>
    `Скоринг, сохранение решений и CSV включены. До ${max} строк на странице очереди.`,
  comparePlans: "Сравнить платные тарифы",
  bulkBannerTitle: "Массовая модерация недоступна",
  bulkBannerBody:
    "Массовые действия, сценарии и журнал аудита — на Growth и Scale.",
  toastSaved: "Решение сохранено",
  toastHistoryRemoved: "Запись истории удалена",
  toastBulk: (n) => `Обновлено строк: ${n}`,
  errorBulkGated:
    "Массовая модерация на тарифах Growth и Scale. Откройте раздел «Оплата».",
  errorHistoryGated: "История решений на тарифах Growth и Scale.",
  queueFactorReturn: (name, status, qty) =>
    `Возврат Shopify ${name} (${status}) · ${qty} шт.`,
  queueFactorNoReturn:
    "Нет открытого Return по заказу — оценка на уровне заказа.",
  detailName: "Имя",
  detailEmail: "Email",
  detailLifetimeOrders: "Заказов всего",
  detailAccountAge: "Возраст аккаунта",
  detailOrderValue: "Сумма заказа",
  detailPayment: "Оплата",
  detailFulfillment: "Выполнение",
  detailOpened: "Открыт",
  detailReturnStatus: "Статус возврата",
  detailReturnQuantity: "Количество",
  accountAgeUnknown: "Возраст аккаунта неизвестен",
  accountAgeToday: "Создан сегодня",
  accountAgeDays: (days) => {
    const mod10 = days % 10;
    const mod100 = days % 100;
    let word = "дней";
    if (mod100 < 11 || mod100 > 14) {
      if (mod10 === 1) word = "день";
      else if (mod10 >= 2 && mod10 <= 4) word = "дня";
    }
    return `Аккаунту ${days} ${word}`;
  },
  emailNotShared: "Не указан",
  modalPreviousDecisions: "Предыдущие решения по заказу",
  modalAiBadge: "ИИ",
  returnTriageTitle: (orderName) => `Проверка возврата · ${orderName}`,
  historyDeleteAria: "Удалить запись истории",
  toastBulkApplied: "Массовое действие применено",
  historyNoEntries: "Нет записей",
};

export function getReturnsCopy(locale: Locale): ReturnsCopy {
  return pickByLocale(RETURNS_COPY, locale);
}
