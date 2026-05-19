import type { Locale } from "../types";
import { pickByLocale } from "../pick-locale";
import { RISK_COPY } from "../translations/risk-engine";

export type RiskCopy = {
  guestCheckout: string;
  unknownPayment: string;
  unknownFulfillment: string;
  playbookMatched: (name: string) => string;
  recommendApprove: string;
  recommendReview: string;
  recommendHold: string;
  financialStatus: Record<string, string>;
  fulfillmentStatus: Record<string, string>;
  labels: {
    lowOrderValue: string;
    mediumOrderValue: string;
    highOrderValue: string;
    veryHighOrderValue: string;
    premiumOrderValue: string;
    extremeOrderValue: string;
    paymentCleared: string;
    paymentPartial: string;
    paymentPending: string;
    paymentUnpaid: string;
    paymentRefunded: string;
    paymentVoided: string;
    paymentUnclear: string;
    fulfillmentDone: string;
    fulfillmentPartial: string;
    fulfillmentNotDone: string;
    fulfillmentOnHold: string;
    fulfillmentInProgress: string;
    fulfillmentUnclear: string;
    guestNoHistory: string;
    firstTimeCustomer: string;
    earlyCustomer: string;
    regularCustomer: string;
    trustedCustomer: string;
    vipCustomer: string;
    accountAgeUnknown: string;
    accountNewWeek: string;
    accountYoungMonth: string;
    account1to3Months: string;
    account3to12Months: string;
    accountOverYear: string;
  };
  narrative: {
    valuePhrase: Record<string, string>;
    customerPhrase: Record<string, string>;
    paymentPhrase: Record<string, string>;
    fulfillmentPhrase: Record<string, string>;
    accountPhrase: Record<string, string>;
    lead: (
      valuePhrase: string,
      customerPhrase: string,
      paymentPhrase: string,
      fulfillmentPhrase: string,
    ) => string;
    playbookDetail: (names: string[]) => string;
    verdict: (recommendation: string) => string;
  };
};

const enLabels = {
  lowOrderValue: "Low order value",
  mediumOrderValue: "Medium order value",
  highOrderValue: "High order value",
  veryHighOrderValue: "Very high order value",
  premiumOrderValue: "Premium order value",
  extremeOrderValue: "Extreme order value",
  paymentCleared: "Payment cleared",
  paymentPartial: "Payment only partially settled",
  paymentPending: "Payment still pending",
  paymentUnpaid: "Order unpaid",
  paymentRefunded: "Already refunded — risk of double-refund",
  paymentVoided: "Payment voided",
  paymentUnclear: "Payment status unclear",
  fulfillmentDone: "Order fulfilled",
  fulfillmentPartial: "Order partially fulfilled",
  fulfillmentNotDone: "Order not fulfilled",
  fulfillmentOnHold: "Fulfillment on hold or scheduled",
  fulfillmentInProgress: "Fulfillment in progress",
  fulfillmentUnclear: "Fulfillment status unclear",
  guestNoHistory: "Guest checkout — no account history",
  firstTimeCustomer: "First-time customer",
  earlyCustomer: "Early-stage customer (2–4 prior orders)",
  regularCustomer: "Regular customer (5–9 prior orders)",
  trustedCustomer: "Trusted customer (10–19 prior orders)",
  vipCustomer: "VIP customer (20+ prior orders)",
  accountAgeUnknown: "Account age unknown",
  accountNewWeek: "Brand-new account (under a week old)",
  accountYoungMonth: "Young account (under a month)",
  account1to3Months: "Account 1–3 months old",
  account3to12Months: "Account 3–12 months old",
  accountOverYear: "Account over a year old",
};

const ruLabels: RiskCopy["labels"] = {
  lowOrderValue: "Низкая сумма заказа",
  mediumOrderValue: "Средняя сумма заказа",
  highOrderValue: "Высокая сумма заказа",
  veryHighOrderValue: "Очень высокая сумма",
  premiumOrderValue: "Премиальный заказ",
  extremeOrderValue: "Экстремально высокая сумма",
  paymentCleared: "Оплата получена",
  paymentPartial: "Оплата частично проведена",
  paymentPending: "Оплата в ожидании",
  paymentUnpaid: "Заказ не оплачен",
  paymentRefunded: "Уже возвращён — риск двойного возврата",
  paymentVoided: "Оплата аннулирована",
  paymentUnclear: "Статус оплаты неясен",
  fulfillmentDone: "Заказ выполнен",
  fulfillmentPartial: "Заказ частично выполнен",
  fulfillmentNotDone: "Заказ не выполнен",
  fulfillmentOnHold: "Выполнение на удержании или запланировано",
  fulfillmentInProgress: "Выполнение в процессе",
  fulfillmentUnclear: "Статус выполнения неясен",
  guestNoHistory: "Гостевой заказ — нет истории аккаунта",
  firstTimeCustomer: "Первый заказ клиента",
  earlyCustomer: "Новый клиент (2–4 заказа)",
  regularCustomer: "Постоянный клиент (5–9 заказов)",
  trustedCustomer: "Надёжный клиент (10–19 заказов)",
  vipCustomer: "VIP-клиент (20+ заказов)",
  accountAgeUnknown: "Возраст аккаунта неизвестен",
  accountNewWeek: "Новый аккаунт (меньше недели)",
  accountYoungMonth: "Молодой аккаунт (меньше месяца)",
  account1to3Months: "Аккаунт 1–3 месяца",
  account3to12Months: "Аккаунт 3–12 месяцев",
  accountOverYear: "Аккаунт старше года",
};

const en: RiskCopy = {
  guestCheckout: "Guest checkout",
  unknownPayment: "Unknown payment",
  unknownFulfillment: "Unknown",
  playbookMatched: (name) => `Playbook matched: ${name}`,
  recommendApprove: "Approve automatically",
  recommendReview: "Manual review",
  recommendHold: "Hold refund",
  financialStatus: {
    paid: "Paid",
    partially_paid: "Partially paid",
    pending: "Pending",
    authorized: "Authorized",
    unpaid: "Unpaid",
    refunded: "Refunded",
    partially_refunded: "Partially refunded",
    voided: "Voided",
  },
  fulfillmentStatus: {
    fulfilled: "Fulfilled",
    partially_fulfilled: "Partially fulfilled",
    partial: "Partially fulfilled",
    unfulfilled: "Unfulfilled",
    on_hold: "On hold",
    scheduled: "Scheduled",
    in_progress: "In progress",
    open: "Open",
  },
  labels: enLabels,
  narrative: {
    valuePhrase: {
      low: "low-value",
      medium: "mid-value",
      high: "high-value",
      "very-high": "very high-value",
      premium: "premium-tier",
      extreme: "extreme-value",
    },
    customerPhrase: {
      ok: "from a trusted repeat customer",
      warn: "from a customer with limited order history",
      high: "from a new or guest customer",
      neutral: "from a regular customer",
    },
    paymentPhrase: {
      ok: "payment cleared",
      warn: "payment not fully settled",
      high: "payment unresolved",
    },
    fulfillmentPhrase: {
      ok: "order already fulfilled",
      warn: "fulfillment still in motion",
      high: "order not fulfilled",
    },
    accountPhrase: {
      ok: "long-standing account",
      warn: "newer account",
      high: "very new account",
      neutral: "",
    },
    lead: (valuePhrase, customerPhrase, paymentPhrase, fulfillmentPhrase) =>
      `${capitalize(valuePhrase)} order ${customerPhrase}: ${paymentPhrase}, ${fulfillmentPhrase}.`,
    playbookDetail: (names) =>
      names.length
        ? ` Matched playbook${names.length > 1 ? "s" : ""}: ${names.join(", ")}.`
        : "",
    verdict: (recommendation) =>
      ` ReturnGuard recommends: ${recommendation.toLowerCase()}.`,
  },
};

const ru: RiskCopy = {
  guestCheckout: "Гостевой заказ",
  unknownPayment: "Оплата неизвестна",
  unknownFulfillment: "Неизвестно",
  playbookMatched: (name) => `Сработал сценарий: ${name}`,
  recommendApprove: "Одобрить автоматически",
  recommendReview: "Ручная проверка",
  recommendHold: "Удержать возврат",
  financialStatus: {
    paid: "Оплачен",
    partially_paid: "Частично оплачен",
    pending: "Ожидает оплаты",
    authorized: "Авторизован",
    unpaid: "Не оплачен",
    refunded: "Возвращён",
    partially_refunded: "Частично возвращён",
    voided: "Аннулирован",
  },
  fulfillmentStatus: {
    fulfilled: "Выполнен",
    partially_fulfilled: "Частично выполнен",
    partial: "Частично выполнен",
    unfulfilled: "Не выполнен",
    on_hold: "На удержании",
    scheduled: "Запланирован",
    in_progress: "В обработке",
    open: "Открыт",
  },
  labels: ruLabels,
  narrative: {
    valuePhrase: {
      low: "низкой стоимости",
      medium: "средней стоимости",
      high: "высокой стоимости",
      "very-high": "очень высокой стоимости",
      premium: "премиального",
      extreme: "экстремально высокой стоимости",
    },
    customerPhrase: {
      ok: "от постоянного клиента",
      warn: "от клиента с короткой историей",
      high: "от нового или гостевого клиента",
      neutral: "от обычного клиента",
    },
    paymentPhrase: {
      ok: "оплата получена",
      warn: "оплата не полностью проведена",
      high: "оплата не завершена",
    },
    fulfillmentPhrase: {
      ok: "заказ уже выполнен",
      warn: "выполнение ещё в процессе",
      high: "заказ не выполнен",
    },
    accountPhrase: {
      ok: "давний аккаунт",
      warn: "новый аккаунт",
      high: "очень новый аккаунт",
      neutral: "",
    },
    lead: (valuePhrase, customerPhrase, paymentPhrase, fulfillmentPhrase) =>
      `Заказ ${valuePhrase} ${customerPhrase}: ${paymentPhrase}, ${fulfillmentPhrase}.`,
    playbookDetail: (names) =>
      names.length ? ` Сработали сценарии: ${names.join(", ")}.` : "",
    verdict: (recommendation) =>
      ` ReturnGuard рекомендует: ${recommendation.toLowerCase()}.`,
  },
};

function capitalize(text: string): string {
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

export function getRiskCopy(locale: Locale): RiskCopy {
  return pickByLocale(RISK_COPY, locale);
}

export function formatStatusDisplay(
  raw: string,
  copy: RiskCopy,
  kind: "financial" | "fulfillment",
): string {
  const token = raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  const map =
    kind === "financial" ? copy.financialStatus : copy.fulfillmentStatus;
  return map[token] ?? raw;
}
