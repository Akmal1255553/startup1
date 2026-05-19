import type { AuditCopy } from "../messages/app/audit";
import type { Locale } from "../types";

function eventsFoundEn(total: number): string {
  return `${total} audit event${total === 1 ? "" : "s"} found.`;
}

function eventsFoundRu(total: number): string {
  const n = total % 10;
  const mod100 = total % 100;
  let word = "событий";
  if (mod100 < 11 || mod100 > 14) {
    if (n === 1) word = "событие";
    else if (n >= 2 && n <= 4) word = "события";
  }
  return `Найдено ${total} ${word}.`;
}

function eventsFoundEs(total: number): string {
  return `${total} evento${total === 1 ? "" : "s"} de auditoría encontrado${total === 1 ? "" : "s"}.`;
}

function eventsFoundDe(total: number): string {
  return `${total} Audit-Ereignis${total === 1 ? "" : "se"} gefunden.`;
}

function eventsFoundFr(total: number): string {
  return `${total} événement${total === 1 ? "" : "s"} d'audit trouvé${total === 1 ? "" : "s"}.`;
}

function eventsFoundPtBR(total: number): string {
  return `${total} evento${total === 1 ? "" : "s"} de auditoria encontrado${total === 1 ? "" : "s"}.`;
}

function eventsFoundJa(total: number): string {
  return `監査イベントを${total}件見つけました。`;
}

function eventsFoundIt(total: number): string {
  return `${total} event${total === 1 ? "o" : "i"} di audit trovati.`;
}

function eventsFoundNl(total: number): string {
  return `${total} auditgebeurtenis${total === 1 ? "" : "sen"} gevonden.`;
}

function eventsFoundKo(total: number): string {
  return `감사 이벤트 ${total}건을 찾았습니다.`;
}

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
  eventsFound: eventsFoundEn,
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
  eventsFound: eventsFoundRu,
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

const es: AuditCopy = {
  title: "Registro de auditoría",
  subtitle:
    "Historial de decisiones de moderación de reembolsos, acciones masivas y cambios de revisión",
  gatedTitle: "El registro de auditoría es una función Growth",
  gatedBody:
    "Pase a Growth o Scale para desbloquear el historial completo con búsqueda, filtros y eventos eliminables.",
  searchLabel: "Buscar en el registro",
  searchPlaceholder: "Pedido, devolución o ID",
  filterDecision: "Decisión",
  filterAll: "Todas las decisiones",
  filterApproved: "Aprobado",
  filterReview: "Revisión",
  filterHold: "Retención",
  eventsFound: eventsFoundEs,
  colSubject: "Asunto",
  colDecision: "Decisión",
  colRisk: "Riesgo",
  colCreated: "Creado",
  rowReturnLevel: "Acción a nivel de devolución",
  rowOrderLevel: "Acción a nivel de pedido",
  empty: "Ningún evento coincide con estos filtros.",
  pageOf: (page, total) => `Página ${page} de ${total}`,
  delete: "Eliminar",
  deleteConfirm: "¿Eliminar este evento de auditoría?",
  errorGated: "El registro de auditoría está en los planes Growth y Scale.",
};

const de: AuditCopy = {
  title: "Audit-Protokoll",
  subtitle:
    "Entscheidungshistorie für Erstattungsmoderation, Massenaktionen und Statusänderungen",
  gatedTitle: "Audit-Protokoll ist eine Growth-Funktion",
  gatedBody:
    "Upgrade auf Growth oder Scale für vollständige Historie mit Suche, Filtern und löschbaren Ereignissen.",
  searchLabel: "Audit-Protokoll durchsuchen",
  searchPlaceholder: "Bestellung, Retoure oder ID",
  filterDecision: "Entscheidung",
  filterAll: "Alle Entscheidungen",
  filterApproved: "Genehmigt",
  filterReview: "Prüfung",
  filterHold: "Hold",
  eventsFound: eventsFoundDe,
  colSubject: "Betreff",
  colDecision: "Entscheidung",
  colRisk: "Risiko",
  colCreated: "Erstellt",
  rowReturnLevel: "Aktion auf Retourenebene",
  rowOrderLevel: "Aktion auf Bestellungsebene",
  empty: "Keine Audit-Ereignisse passen zu diesen Filtern.",
  pageOf: (page, total) => `Seite ${page} von ${total}`,
  delete: "Löschen",
  deleteConfirm: "Dieses Audit-Ereignis löschen?",
  errorGated: "Audit-Protokoll ist in Growth und Scale verfügbar.",
};

const fr: AuditCopy = {
  title: "Journal d'audit",
  subtitle:
    "Historique des décisions de modération de remboursement, actions groupées et changements de revue",
  gatedTitle: "Le journal d'audit est une fonction Growth",
  gatedBody:
    "Passez à Growth ou Scale pour l'historique complet avec recherche, filtres et événements supprimables.",
  searchLabel: "Rechercher dans le journal",
  searchPlaceholder: "Commande, retour ou ID",
  filterDecision: "Décision",
  filterAll: "Toutes les décisions",
  filterApproved: "Approuvé",
  filterReview: "Revue",
  filterHold: "Retenue",
  eventsFound: eventsFoundFr,
  colSubject: "Sujet",
  colDecision: "Décision",
  colRisk: "Risque",
  colCreated: "Créé",
  rowReturnLevel: "Action au niveau retour",
  rowOrderLevel: "Action au niveau commande",
  empty: "Aucun événement ne correspond à ces filtres.",
  pageOf: (page, total) => `Page ${page} sur ${total}`,
  delete: "Supprimer",
  deleteConfirm: "Supprimer cet événement d'audit ?",
  errorGated: "Le journal d'audit est disponible sur Growth et Scale.",
};

const ptBR: AuditCopy = {
  title: "Registro de auditoria",
  subtitle:
    "Histórico de decisões de moderação de reembolso, ações em massa e alterações de revisão",
  gatedTitle: "Registro de auditoria é recurso do Growth",
  gatedBody:
    "Faça upgrade para Growth ou Scale para o histórico completo com busca, filtros e eventos removíveis.",
  searchLabel: "Buscar no registro",
  searchPlaceholder: "Pedido, devolução ou ID",
  filterDecision: "Decisão",
  filterAll: "Todas as decisões",
  filterApproved: "Aprovado",
  filterReview: "Revisão",
  filterHold: "Retenção",
  eventsFound: eventsFoundPtBR,
  colSubject: "Assunto",
  colDecision: "Decisão",
  colRisk: "Risco",
  colCreated: "Criado",
  rowReturnLevel: "Ação no nível da devolução",
  rowOrderLevel: "Ação no nível do pedido",
  empty: "Nenhum evento corresponde a estes filtros.",
  pageOf: (page, total) => `Página ${page} de ${total}`,
  delete: "Excluir",
  deleteConfirm: "Excluir este evento de auditoria?",
  errorGated: "O registro de auditoria está nos planos Growth e Scale.",
};

const ja: AuditCopy = {
  title: "監査ログ",
  subtitle: "返金モデレーション、一括操作、レビュー変更の決定履歴",
  gatedTitle: "監査ログはGrowth機能です",
  gatedBody:
    "GrowthまたはScaleにアップグレードして、検索・フィルター・削除可能な完全な履歴を利用します。",
  searchLabel: "監査ログを検索",
  searchPlaceholder: "注文、返品、またはID",
  filterDecision: "決定",
  filterAll: "すべての決定",
  filterApproved: "承認済み",
  filterReview: "レビュー",
  filterHold: "保留",
  eventsFound: eventsFoundJa,
  colSubject: "対象",
  colDecision: "決定",
  colRisk: "リスク",
  colCreated: "作成日",
  rowReturnLevel: "返品レベルの操作",
  rowOrderLevel: "注文レベルの操作",
  empty: "これらのフィルターに一致する監査イベントはありません。",
  pageOf: (page, total) => `${total}ページ中${page}ページ`,
  delete: "削除",
  deleteConfirm: "この監査イベントを削除しますか？",
  errorGated: "監査ログはGrowthとScaleプランで利用できます。",
};

const it: AuditCopy = {
  title: "Registro audit",
  subtitle:
    "Cronologia decisioni per moderazione rimborsi, azioni massive e modifiche revisione",
  gatedTitle: "Il registro audit è una funzione Growth",
  gatedBody:
    "Passa a Growth o Scale per la cronologia completa con ricerca, filtri ed eventi rimovibili.",
  searchLabel: "Cerca nel registro audit",
  searchPlaceholder: "Ordine, reso o ID",
  filterDecision: "Decisione",
  filterAll: "Tutte le decisioni",
  filterApproved: "Approvato",
  filterReview: "Revisione",
  filterHold: "Hold",
  eventsFound: eventsFoundIt,
  colSubject: "Oggetto",
  colDecision: "Decisione",
  colRisk: "Rischio",
  colCreated: "Creato",
  rowReturnLevel: "Azione a livello reso",
  rowOrderLevel: "Azione a livello ordine",
  empty: "Nessun evento audit corrisponde a questi filtri.",
  pageOf: (page, total) => `Pagina ${page} di ${total}`,
  delete: "Elimina",
  deleteConfirm: "Eliminare questo evento audit?",
  errorGated: "Il registro audit è disponibile su Growth e Scale.",
};

const nl: AuditCopy = {
  title: "Auditlog",
  subtitle:
    "Beslissingsgeschiedenis voor terugbetalingsmoderatie, bulkacties en statuswijzigingen",
  gatedTitle: "Auditlog is een Growth-functie",
  gatedBody:
    "Upgrade naar Growth of Scale voor volledige geschiedenis met zoeken, filters en verwijderbare gebeurtenissen.",
  searchLabel: "Auditlog doorzoeken",
  searchPlaceholder: "Bestelling, retour of ID",
  filterDecision: "Beslissing",
  filterAll: "Alle beslissingen",
  filterApproved: "Goedgekeurd",
  filterReview: "Beoordeling",
  filterHold: "Hold",
  eventsFound: eventsFoundNl,
  colSubject: "Onderwerp",
  colDecision: "Beslissing",
  colRisk: "Risico",
  colCreated: "Aangemaakt",
  rowReturnLevel: "Actie op retourniveau",
  rowOrderLevel: "Actie op bestelniveau",
  empty: "Geen auditgebeurtenissen komen overeen met deze filters.",
  pageOf: (page, total) => `Pagina ${page} van ${total}`,
  delete: "Verwijderen",
  deleteConfirm: "Dit auditgebeurtenis verwijderen?",
  errorGated: "Auditlog is beschikbaar op Growth en Scale.",
};

const ko: AuditCopy = {
  title: "감사 로그",
  subtitle: "환불 조정, 일괄 작업 및 검토 변경에 대한 결정 기록",
  gatedTitle: "감사 로그는 Growth 기능입니다",
  gatedBody:
    "Growth 또는 Scale로 업그레이드하여 검색, 필터 및 삭제 가능한 전체 기록을 이용하세요.",
  searchLabel: "감사 로그 검색",
  searchPlaceholder: "주문, 반품 또는 ID",
  filterDecision: "결정",
  filterAll: "모든 결정",
  filterApproved: "승인됨",
  filterReview: "검토",
  filterHold: "보류",
  eventsFound: eventsFoundKo,
  colSubject: "대상",
  colDecision: "결정",
  colRisk: "위험",
  colCreated: "생성됨",
  rowReturnLevel: "반품 수준 작업",
  rowOrderLevel: "주문 수준 작업",
  empty: "이 필터와 일치하는 감사 이벤트가 없습니다.",
  pageOf: (page, total) => `${total}페이지 중 ${page}페이지`,
  delete: "삭제",
  deleteConfirm: "이 감사 이벤트를 삭제할까요?",
  errorGated: "감사 로그는 Growth 및 Scale 플랜에서 이용할 수 있습니다.",
};

export const AUDIT_COPY: Record<Locale, AuditCopy> = {
  en,
  ru,
  es,
  de,
  fr,
  "pt-BR": ptBR,
  ja,
  it,
  nl,
  ko,
};
