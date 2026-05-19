import type { Locale } from "../../types";
import { pickByLocale } from "../../pick-locale";
import { AUDIT_COPY } from "../../translations/audit";

export type AuditCopy = {
  title: string;
  subtitle: string;
  gatedTitle: string;
  gatedBody: string;
  searchLabel: string;
  searchPlaceholder: string;
  filterDecision: string;
  filterAll: string;
  filterApproved: string;
  filterReview: string;
  filterHold: string;
  eventsFound: (total: number) => string;
  colSubject: string;
  colDecision: string;
  colRisk: string;
  colCreated: string;
  rowReturnLevel: string;
  rowOrderLevel: string;
  empty: string;
  pageOf: (page: number, total: number) => string;
  delete: string;
  deleteConfirm: string;
  errorGated: string;
};

const en: AuditCopy = {
  title: "Audit Log",
  subtitle:
    "Decision history for refund moderation, bulk actions, and review changes",
  gatedTitle: "Audit Log is a Growth feature",
  gatedBody:
    "Upgrade to Growth or Scale to unlock the full decision history with search, filters, and removable events.",
  searchLabel: "Search audit log",
  searchPlaceholder: "Search order, return, or id",
  filterDecision: "Decision",
  filterAll: "All decisions",
  filterApproved: "Approved",
  filterReview: "Review",
  filterHold: "Hold",
  eventsFound: (total) =>
    `${total} audit event${total === 1 ? "" : "s"} found.`,
  colSubject: "Subject",
  colDecision: "Decision",
  colRisk: "Risk",
  colCreated: "Created",
  rowReturnLevel: "Return-level action",
  rowOrderLevel: "Order-level action",
  empty: "No audit events match these filters.",
  pageOf: (page, total) => `Page ${page} of ${total}`,
  delete: "Delete",
  deleteConfirm: "Delete this audit event?",
  errorGated: "Audit log is available on the Growth and Scale plans.",
};

const ru: AuditCopy = {
  title: "Журнал аудита",
  subtitle:
    "История решений по возвратам, массовым действиям и изменениям статусов",
  gatedTitle: "Журнал аудита — функция Growth",
  gatedBody:
    "Перейдите на Growth или Scale, чтобы открыть полную историю с поиском, фильтрами и удалением событий.",
  searchLabel: "Поиск в журнале",
  searchPlaceholder: "Заказ, возврат или ID",
  filterDecision: "Решение",
  filterAll: "Все решения",
  filterApproved: "Одобрено",
  filterReview: "Проверка",
  filterHold: "Удержание",
  eventsFound: (total) => {
    const n = total % 10;
    const mod100 = total % 100;
    let word = "событий";
    if (mod100 < 11 || mod100 > 14) {
      if (n === 1) word = "событие";
      else if (n >= 2 && n <= 4) word = "события";
    }
    return `Найдено ${total} ${word}.`;
  },
  colSubject: "Объект",
  colDecision: "Решение",
  colRisk: "Риск",
  colCreated: "Создано",
  rowReturnLevel: "Действие по возврату",
  rowOrderLevel: "Действие по заказу",
  empty: "Нет событий по этим фильтрам.",
  pageOf: (page, total) => `Страница ${page} из ${total}`,
  delete: "Удалить",
  deleteConfirm: "Удалить это событие аудита?",
  errorGated: "Журнал аудита доступен на тарифах Growth и Scale.",
};

export function getAuditCopy(locale: Locale): AuditCopy {
  return pickByLocale(AUDIT_COPY, locale);
}
