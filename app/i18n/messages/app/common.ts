import type { Locale } from "../../types";

export type AppCommonCopy = {
  backDashboard: string;
  openBilling: string;
  openQueue: string;
  upgradePlan: string;
  exportCsv: string;
  exportCsvPreparing: string;
  exportCsvUpgrade: string;
  live: string;
  search: string;
  pageSize: string;
  perPage: (n: number) => string;
  decisionApproved: string;
  decisionReview: string;
  decisionHold: string;
  planContextFree: string;
  planContextPaid: (plan: string) => string;
  planLabelFree: string;
};

const en: AppCommonCopy = {
  backDashboard: "Dashboard",
  openBilling: "Open billing",
  openQueue: "Open queue",
  upgradePlan: "Upgrade plan",
  exportCsv: "Export CSV",
  exportCsvPreparing: "Preparing CSV…",
  exportCsvUpgrade: "Export CSV (upgrade)",
  live: "Live",
  search: "Search",
  pageSize: "Page size",
  perPage: (n) => `${n} per page`,
  decisionApproved: "Approved",
  decisionReview: "Needs review",
  decisionHold: "Refund held",
  planContextFree: "You're on the Free plan.",
  planContextPaid: (plan) => `You're on the ${plan} plan.`,
  planLabelFree: "Free",
};

const ru: AppCommonCopy = {
  backDashboard: "Панель",
  openBilling: "Оплата",
  openQueue: "Очередь",
  upgradePlan: "Сменить тариф",
  exportCsv: "Экспорт CSV",
  exportCsvPreparing: "Готовим CSV…",
  exportCsvUpgrade: "Экспорт CSV (апгрейд)",
  live: "Онлайн",
  search: "Поиск",
  pageSize: "На странице",
  perPage: (n) => `${n} на странице`,
  decisionApproved: "Одобрено",
  decisionReview: "На проверке",
  decisionHold: "Возврат удержан",
  planContextFree: "У вас тариф Free.",
  planContextPaid: (plan) => `У вас тариф ${plan}.`,
  planLabelFree: "Free",
};

export function getAppCommonCopy(locale: Locale): AppCommonCopy {
  return locale === "ru" ? ru : en;
}

export function decisionLabel(
  copy: AppCommonCopy,
  decision: string,
): string {
  if (decision === "approved") return copy.decisionApproved;
  if (decision === "hold") return copy.decisionHold;
  return copy.decisionReview;
}

export function describePlanContext(
  copy: AppCommonCopy,
  planLabel: string,
  hasActivePlan: boolean,
): string {
  if (!hasActivePlan) return copy.planContextFree;
  return copy.planContextPaid(planLabel);
}
