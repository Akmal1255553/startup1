import type { Locale } from "../../types";

export type PlaybooksCopy = {
  title: string;
  subtitle: string;
  titleBar: string;
  gatedTitle: string;
  gatedBody: string;
  createTitle: string;
  fieldName: string;
  fieldAction: string;
  actionApprove: string;
  actionReview: string;
  actionHold: string;
  fieldMinValue: string;
  fieldRepeatReturns: string;
  fieldMinAccountAge: string;
  fieldDomains: string;
  fieldNotes: string;
  activeOnCreate: string;
  vipBypass: string;
  createSubmit: string;
  empty: string;
  statusActive: string;
  statusPaused: string;
  save: string;
  active: string;
  pause: string;
  activate: string;
  delete: string;
  deleteConfirm: string;
  errorGated: string;
  errorUnknownIntent: string;
};

const en: PlaybooksCopy = {
  title: "Playbooks",
  subtitle: "Automated moderation rules for returns and refund actions",
  titleBar: "ReturnGuard playbooks",
  gatedTitle: "Playbooks are a Growth feature",
  gatedBody:
    "Upgrade to Growth or Scale to create automated approve / review / hold rules.",
  createTitle: "Create playbook",
  fieldName: "Playbook name",
  fieldAction: "Automated action",
  actionApprove: "Auto-approve",
  actionReview: "Send to review",
  actionHold: "Hold refund",
  fieldMinValue: "Minimum order value (optional)",
  fieldRepeatReturns: "Minimum prior orders (optional)",
  fieldMinAccountAge: "Minimum account age in days (optional)",
  fieldDomains: "Suspicious email domains (comma-separated, optional)",
  fieldNotes: "Notes (optional)",
  activeOnCreate: "Active when created",
  vipBypass: "Bypass for VIP customers (20+ orders)",
  createSubmit: "Create playbook",
  empty: "No playbooks in the list yet. Create one to automate moderation.",
  statusActive: "Active",
  statusPaused: "Paused",
  save: "Save",
  active: "Active",
  pause: "Pause",
  activate: "Activate",
  delete: "Delete",
  deleteConfirm: "Delete this playbook?",
  errorGated:
    "Automation playbooks are available on the Growth and Scale plans.",
  errorUnknownIntent: "Unknown action intent.",
};

const ru: PlaybooksCopy = {
  title: "Сценарии",
  subtitle: "Автоматические правила модерации возвратов и возвратов средств",
  titleBar: "Сценарии ReturnGuard",
  gatedTitle: "Сценарии — функция Growth",
  gatedBody:
    "Перейдите на Growth или Scale, чтобы создавать правила одобрения / проверки / удержания.",
  createTitle: "Новый сценарий",
  fieldName: "Название",
  fieldAction: "Действие",
  actionApprove: "Авто-одобрение",
  actionReview: "На проверку",
  actionHold: "Удержать возврат",
  fieldMinValue: "Мин. сумма заказа (необяз.)",
  fieldRepeatReturns: "Мин. число прошлых заказов (необяз.)",
  fieldMinAccountAge: "Мин. возраст аккаунта, дней (необяз.)",
  fieldDomains: "Подозрительные домены email (через запятую)",
  fieldNotes: "Заметки (необяз.)",
  activeOnCreate: "Активен сразу",
  vipBypass: "Исключить VIP (20+ заказов)",
  createSubmit: "Создать сценарий",
  empty: "Сценариев пока нет. Создайте первый для автоматизации.",
  statusActive: "Активен",
  statusPaused: "Пауза",
  save: "Сохранить",
  active: "Активен",
  pause: "Пауза",
  activate: "Включить",
  delete: "Удалить",
  deleteConfirm: "Удалить этот сценарий?",
  errorGated: "Сценарии доступны на тарифах Growth и Scale.",
  errorUnknownIntent: "Неизвестное действие.",
};

export function getPlaybooksCopy(locale: Locale): PlaybooksCopy {
  return locale === "ru" ? ru : en;
}
