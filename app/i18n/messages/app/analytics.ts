import type { Locale } from "../../types";

export type AnalyticsCopy = {
  title: string;
  subtitle: string;
  gatedTitle: string;
  gatedBody: (days: number) => string;
  today: string;
  todayHint: (approved: number, review: number, hold: number) => string;
  last7: string;
  last30: string;
  audit: string;
  last7Hint: (rate: number) => string;
  last30Hint: (rate: number) => string;
  auditHint30: string;
  auditHint7: string;
  insightsBadge: string;
  insightsTitle: string;
  insightsSubtitle: string;
  period7: string;
  period30: string;
  actionsBadge: (n: number) => string;
  chartLabel: string;
  approved: string;
  flagged: string;
  approvalRate: string;
  flaggedRate: string;
  breakdownTitle: (range: string) => string;
  breakdownApproved: string;
  breakdownReview: string;
  breakdownHold: string;
  breakdownReset: string;
  breakdownEmpty: (range: string) => string;
  rangeShort7: string;
  rangeShort30: string;
};

const en: AnalyticsCopy = {
  title: "Analytics",
  subtitle: "Moderation activity, approval rate, and trends",
  gatedTitle: "30-day and 90-day analytics are gated",
  gatedBody: (days) =>
    `Charts are limited to the last ${days} days on your current plan.`,
  today: "Today's actions",
  todayHint: (a, r, h) => `${a} approved · ${r} review · ${h} hold`,
  last7: "Last 7 days",
  last30: "Last 30 days",
  audit: "Audit trail",
  last7Hint: (rate) => `${rate}% approval rate`,
  last30Hint: (rate) => `${rate}% flagged for review or hold`,
  auditHint30: "30-day event window on Growth",
  auditHint7: "7-day window on Starter",
  insightsBadge: "AI Insights",
  insightsTitle: "What we noticed for you",
  insightsSubtitle:
    "Generated locally from your moderation history — no external AI calls.",
  period7: "Last 7 days",
  period30: "Last 30 days",
  actionsBadge: (n) => `${n} actions`,
  chartLabel: "Total moderation actions per day",
  approved: "Approved",
  flagged: "Flagged (review + hold)",
  approvalRate: "Approval rate",
  flaggedRate: "Flagged rate",
  breakdownTitle: (range) => `Decision breakdown · last ${range}`,
  breakdownApproved: "Approved",
  breakdownReview: "Review",
  breakdownHold: "Hold",
  breakdownReset: "Reset",
  breakdownEmpty: (range) =>
    `No moderation events in the last ${range} on this store yet.`,
  rangeShort7: "7 days",
  rangeShort30: "30 days",
};

const ru: AnalyticsCopy = {
  title: "Аналитика",
  subtitle: "Активность модерации, доля одобрений и тренды",
  gatedTitle: "Расширенная аналитика на платных тарифах",
  gatedBody: (days) =>
    `На текущем тарифе графики ограничены последними ${days} днями.`,
  today: "Сегодня",
  todayHint: (a, r, h) => `${a} одобр. · ${r} проверка · ${h} удерж.`,
  last7: "7 дней",
  last30: "30 дней",
  audit: "Журнал",
  last7Hint: (rate) => `${rate}% одобрено`,
  last30Hint: (rate) => `${rate}% на проверке или удержании`,
  auditHint30: "Окно 30 дней на Growth",
  auditHint7: "Окно 7 дней на Starter",
  insightsBadge: "ИИ-инсайты",
  insightsTitle: "На что обратить внимание",
  insightsSubtitle:
    "Сформировано локально из истории модерации — без внешних ИИ-запросов.",
  period7: "7 дней",
  period30: "30 дней",
  actionsBadge: (n) => `${n} действий`,
  chartLabel: "Действия модерации по дням",
  approved: "Одобрено",
  flagged: "Помечено (проверка + удержание)",
  approvalRate: "Доля одобрений",
  flaggedRate: "Доля помеченных",
  breakdownTitle: (range) => `Разбивка решений · ${range}`,
  breakdownApproved: "Одобрено",
  breakdownReview: "Проверка",
  breakdownHold: "Удержание",
  breakdownReset: "Сброс",
  breakdownEmpty: (range) =>
    `За ${range} пока нет событий модерации в этом магазине.`,
  rangeShort7: "7 дней",
  rangeShort30: "30 дней",
};

export function getAnalyticsCopy(locale: Locale): AnalyticsCopy {
  return locale === "ru" ? ru : en;
}
