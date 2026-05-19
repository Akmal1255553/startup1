import {
  PLAN_GROWTH,
  PLAN_SCALE,
  PLAN_STARTER,
  PLANS,
  type PlanDescriptor,
  type PlanId,
} from "../../../billing/plans";
import type { Locale } from "../../types";
import { pickByLocale } from "../../pick-locale";
import {
  BILLING_BASE,
  localizedPlansFor,
} from "../../translations/billing";

export type BillingCopy = {
  title: string;
  subtitle: string;
  testModeBadge: string;
  testModeBody: string;
  currentTitle: string;
  activePlan: (name: string, price: number) => string;
  freePlan: string;
  badgeActive: string;
  badgeFree: string;
  cancel: string;
  cancelConfirm: string;
  toastCancelled: string;
  freeBannerTitle: string;
  freeBannerBody: string;
  perMonth: string;
  trialDays: (n: number) => string;
  badgeCurrent: string;
  badgeSelecting: string;
  badgeRecommended: string;
  btnCurrent: string;
  btnConfirming: string;
  btnSwitch: string;
  btnTrial: string;
  errorUnknownPlan: string;
  errorUnexpected: string;
  errorMissingSub: string;
  errorCancelFailed: string;
  errorUnknownIntent: string;
  getPlans: () => PlanDescriptor[];
};

function localizedPlans(locale: Locale): PlanDescriptor[] {
  if (locale !== "ru") {
    return PLANS;
  }
  return [
    {
      id: PLAN_STARTER,
      name: "Starter",
      tagline: "Для новых магазинов с повышенными лимитами без автоматизации.",
      monthlyPrice: 9,
      currencyCode: "USD",
      trialDays: 21,
      features: [
        "До 250 оценённых возвратов / мес. (fair use)",
        "Большие страницы очереди (50 строк)",
        "Всё из Free",
        "Поддержка по email",
      ],
    },
    {
      id: PLAN_GROWTH,
      name: "Growth",
      tagline: "Для растущих команд: автоматизация и журнал аудита.",
      monthlyPrice: 29,
      currencyCode: "USD",
      trialDays: 21,
      recommended: true,
      features: [
        "До 2 000 оценённых возвратов / мес.",
        "Сценарии (одобрить / проверить / удержать)",
        "Полный журнал аудита",
        "Массовые действия",
        "Аналитика за 30 дней",
      ],
    },
    {
      id: PLAN_SCALE,
      name: "Scale",
      tagline: "Для высокого объёма и углублённой аналитики.",
      monthlyPrice: 79,
      currencyCode: "USD",
      trialDays: 21,
      features: [
        "Без лимита оценённых возвратов (fair use)",
        "Расширенная аналитика (90 дней)",
        "Приоритетная поддержка",
        "Гибкие веса риска",
        "Готовность к нескольким магазинам",
      ],
    },
  ];
}

const en: Omit<BillingCopy, "getPlans"> = {
  title: "Billing",
  subtitle:
    "Core return-risk tools are free forever. Upgrade for automation, audit log, and deeper analytics.",
  testModeBadge: "Test mode",
  testModeBody:
    "Shopify Billing is running in test mode — charges are simulated and won't bill real cards.",
  currentTitle: "Current subscription",
  activePlan: (name, price) => `${name} — $${price}/month`,
  freePlan: "No active subscription — you're on the Free plan.",
  badgeActive: "Active",
  badgeFree: "Free",
  cancel: "Cancel subscription",
  cancelConfirm: "Cancel current subscription?",
  toastCancelled: "Subscription cancelled",
  freeBannerTitle: "Free plan includes the essentials",
  freeBannerBody:
    "Risk scoring, returns queue, saving decisions, CSV export, and risk settings are included at no cost.",
  perMonth: "/ month",
  trialDays: (n) => `${n}-day free trial`,
  badgeCurrent: "Current plan",
  badgeSelecting: "Selecting…",
  badgeRecommended: "Recommended",
  btnCurrent: "Current plan",
  btnConfirming: "Confirming…",
  btnSwitch: "Switch to this plan",
  btnTrial: "Start 21-day trial",
  errorUnknownPlan: "Unknown plan.",
  errorUnexpected: "Unexpected billing state.",
  errorMissingSub: "Missing subscription id.",
  errorCancelFailed: "Could not cancel subscription.",
  errorUnknownIntent: "Unknown intent.",
};

const ru: Omit<BillingCopy, "getPlans"> = {
  title: "Оплата",
  subtitle:
    "Базовые инструменты бесплатны. Платные тарифы — автоматизация, аудит и аналитика.",
  testModeBadge: "Тестовый режим",
  testModeBody:
    "Биллинг Shopify в тестовом режиме — списания симулируются, карты не списываются.",
  currentTitle: "Текущая подписка",
  activePlan: (name, price) => `${name} — $${price}/мес.`,
  freePlan: "Нет активной подписки — тариф Free.",
  badgeActive: "Активна",
  badgeFree: "Free",
  cancel: "Отменить подписку",
  cancelConfirm: "Отменить текущую подписку?",
  toastCancelled: "Подписка отменена",
  freeBannerTitle: "В Free уже есть главное",
  freeBannerBody:
    "Скоринг, очередь, сохранение решений, экспорт CSV и настройки риска — бесплатно.",
  perMonth: "/ мес.",
  trialDays: (n) => `Пробный период ${n} дн.`,
  badgeCurrent: "Текущий тариф",
  badgeSelecting: "Подключение…",
  badgeRecommended: "Рекомендуем",
  btnCurrent: "Текущий тариф",
  btnConfirming: "Подтверждение…",
  btnSwitch: "Перейти на этот тариф",
  btnTrial: "Начать пробный период",
  errorUnknownPlan: "Неизвестный тариф.",
  errorUnexpected: "Неожиданное состояние биллинга.",
  errorMissingSub: "Нет ID подписки.",
  errorCancelFailed: "Не удалось отменить подписку.",
  errorUnknownIntent: "Неизвестное действие.",
};

export function getBillingCopy(locale: Locale): BillingCopy {
  return {
    ...pickByLocale(BILLING_BASE, locale),
    getPlans: () => localizedPlansFor(locale),
  };
}

export function localizePlanId(planId: PlanId | null, locale: Locale): string {
  const plans = localizedPlansFor(locale);
  const found = plans.find((p) => p.id === planId);
  return found?.name ?? planId ?? "Free";
}
