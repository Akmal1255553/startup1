import type { Locale } from "../../types";

export type SettingsCopy = {
  title: string;
  subtitle: string;
  lockedTitle: string;
  lockedBody: (plan: string) => string;
  savedBadge: string;
  savedMessage: string;
  errorPaidOnly: string;
  toastSaved: string;
  sectionThresholds: string;
  sectionWeights: string;
  reviewThreshold: string;
  reviewHelp: string;
  holdThreshold: string;
  holdHelp: string;
  mediumValue: string;
  highValue: string;
  newCustomer: string;
  repeatCustomer: string;
  unfulfilled: string;
  paymentReview: string;
  marginMultiplier: string;
  marginHelp: string;
  submit: string;
};

const en: SettingsCopy = {
  title: "Risk Settings",
  subtitle: "Tune ReturnGuard to match your refund policy and risk appetite",
  lockedTitle: "Risk settings can be saved only on a paid plan",
  lockedBody: (plan) =>
    `You're on ${plan}. Saving thresholds and weights requires Starter, Growth, or Scale.`,
  savedBadge: "Saved",
  savedMessage: "Risk settings were updated.",
  errorPaidOnly: "Risk settings can be saved only on a paid plan.",
  toastSaved: "Risk settings saved",
  sectionThresholds: "Decision thresholds",
  sectionWeights: "Risk signal weights",
  reviewThreshold: "Manual review risk threshold",
  reviewHelp: "Orders at or above this score are flagged for manual review.",
  holdThreshold: "Refund hold risk threshold",
  holdHelp: "Orders at or above this score should be held before refunding.",
  mediumValue: "Medium order value threshold",
  highValue: "High order value threshold",
  newCustomer: "New / guest customer risk delta",
  repeatCustomer: "Repeat customer risk delta",
  unfulfilled: "Unfulfilled order risk delta",
  paymentReview: "Payment-in-review risk delta",
  marginMultiplier: "Protected margin multiplier",
  marginHelp: "Used to estimate margin protected on the dashboard.",
  submit: "Save settings",
};

const ru: SettingsCopy = {
  title: "Настройки риска",
  subtitle: "Настройте ReturnGuard под политику возвратов и аппетит к риску",
  lockedTitle: "Сохранение настроек — на платном тарифе",
  lockedBody: (plan) =>
    `У вас ${plan}. Пороги и веса доступны на Starter, Growth или Scale.`,
  savedBadge: "Сохранено",
  savedMessage: "Настройки риска обновлены.",
  errorPaidOnly: "Сохранение доступно только на платном тарифе.",
  toastSaved: "Настройки сохранены",
  sectionThresholds: "Пороги решений",
  sectionWeights: "Веса сигналов риска",
  reviewThreshold: "Порог ручной проверки",
  reviewHelp: "Заказы с этим риском и выше — на ручную проверку.",
  holdThreshold: "Порог удержания возврата",
  holdHelp: "Заказы с этим риском и выше — удерживать до возврата средств.",
  mediumValue: "Порог средней суммы заказа",
  highValue: "Порог высокой суммы заказа",
  newCustomer: "Дельта риска: новый / гостевой клиент",
  repeatCustomer: "Дельта риска: повторный клиент",
  unfulfilled: "Дельта риска: невыполненный заказ",
  paymentReview: "Дельта риска: оплата на проверке",
  marginMultiplier: "Множитель защищённой маржи",
  marginHelp: "Используется для оценки маржи на панели.",
  submit: "Сохранить настройки",
};

export function getSettingsCopy(locale: Locale): SettingsCopy {
  return locale === "ru" ? ru : en;
}
