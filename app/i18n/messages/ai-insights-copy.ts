import type { Locale } from "../types";

export type InsightCopy = {
  noDataTitle: string;
  noDataMessage: string;
  noDataCta: string;
  allClearTitle: string;
  allClearMessage: string;
  firstWeekTitle: string;
  firstWeekMessage: (count: number) => string;
  trendUpTitle: (pct: number) => string;
  trendDownTitle: (pct: number) => string;
  trendUpMessage: (thisWeek: number, lastWeek: number) => string;
  trendDownMessage: (lastWeek: number, thisWeek: number) => string;
  trendCta: string;
  approvalDropTitle: (pts: number) => string;
  approvalRiseTitle: (pts: number) => string;
  approvalDropMessage: (thisRate: number, lastRate: number) => string;
  approvalRiseMessage: (thisRate: number, lastRate: number) => string;
  approvalCta: string;
  resetTitle: string;
  resetMessage: (resets: number, ratio: number) => string;
  resetCta: string;
  anomalyTitle: string;
  anomalyMessage: (
    value: number,
    date: string,
    multiplier: number,
    avg: number,
  ) => string;
  anomalyCta: string;
  holdTitle: string;
  holdMessage: (ratio: number) => string;
  holdCta: string;
};

const en: InsightCopy = {
  noDataTitle: "Not enough data yet",
  noDataMessage:
    "Once your team starts moderating returns, insights about trends, anomalies, and recommended playbooks will appear here.",
  noDataCta: "Open queue",
  allClearTitle: "Operations look healthy",
  allClearMessage:
    "No anomalies, trend reversals, or unusual patterns detected in the last 30 days.",
  firstWeekTitle: "First moderation week",
  firstWeekMessage: (count) =>
    `Your team handled ${count} return decisions this week. Insights will sharpen with more history.`,
  trendUpTitle: (pct) => `Return moderation volume up ${pct}% week-over-week`,
  trendDownTitle: (pct) =>
    `Return moderation volume down ${pct}% week-over-week`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `Your team handled ${thisWeek} return decisions in the last 7 days, vs ${lastWeek} the week before. Consider adding playbooks to absorb the load.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Volume has dropped from ${lastWeek} to ${thisWeek} decisions over the last 7 days — either fewer disputes or your playbooks are auto-clearing more cases.`,
  trendCta: "Open playbooks",
  approvalDropTitle: (pts) => `Approval rate dropped ${pts} points`,
  approvalRiseTitle: (pts) => `Approval rate climbed ${pts} points`,
  approvalDropMessage: (thisRate, lastRate) =>
    `${thisRate}% of moderated returns were approved this week (was ${lastRate}% the week before). More cases are being held or sent for review — review your hold threshold.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `${thisRate}% of moderated returns were approved this week (was ${lastRate}% the week before). Either trust signals improved, or your playbooks are resolving more cases automatically.`,
  approvalCta: "Tune thresholds",
  resetTitle: "Frequent resets detected",
  resetMessage: (resets, ratio) =>
    `${resets} decisions were reset this week (${ratio}% of all actions). This may indicate your thresholds or playbooks need tuning to match real merchant intent.`,
  resetCta: "Review settings",
  anomalyTitle: "Unusual moderation spike",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} return decisions were processed on ${date} — ${multiplier}× your 30-day average of ${avg}/day. Check whether a single SKU or customer segment is driving this.`,
  anomalyCta: "Open analytics",
  holdTitle: "High hold concentration",
  holdMessage: (ratio) =>
    `${ratio}% of all actions this week were holds. If this is consistent with policy, consider creating a playbook to automate the pattern and free up support time.`,
  holdCta: "Create playbook",
};

const ru: InsightCopy = {
  noDataTitle: "Пока недостаточно данных",
  noDataMessage:
    "Когда команда начнёт модерировать возвраты, здесь появятся инсайты о трендах, аномалиях и рекомендуемых сценариях.",
  noDataCta: "Открыть очередь",
  allClearTitle: "Операции в норме",
  allClearMessage:
    "За последние 30 дней аномалий, резких изменений трендов или необычных паттернов не обнаружено.",
  firstWeekTitle: "Первая неделя модерации",
  firstWeekMessage: (count) =>
    `На этой неделе обработано ${count} решений по возвратам. С накоплением истории инсайты станут точнее.`,
  trendUpTitle: (pct) => `Объём модерации вырос на ${pct}% к прошлой неделе`,
  trendDownTitle: (pct) => `Объём модерации снизился на ${pct}% к прошлой неделе`,
  trendUpMessage: (thisWeek, lastWeek) =>
    `За 7 дней обработано ${thisWeek} решений, на прошлой неделе было ${lastWeek}. Рассмотрите добавление сценариев для разгрузки команды.`,
  trendDownMessage: (lastWeek, thisWeek) =>
    `Объём снизился с ${lastWeek} до ${thisWeek} решений за 7 дней — меньше споров или сценарии чаще закрывают кейсы автоматически.`,
  trendCta: "Открыть сценарии",
  approvalDropTitle: (pts) => `Доля одобрений снизилась на ${pts} п.п.`,
  approvalRiseTitle: (pts) => `Доля одобрений выросла на ${pts} п.п.`,
  approvalDropMessage: (thisRate, lastRate) =>
    `На этой неделе одобрено ${thisRate}% возвратов (было ${lastRate}%). Больше кейсов уходит на проверку или удержание — проверьте пороги.`,
  approvalRiseMessage: (thisRate, lastRate) =>
    `На этой неделе одобрено ${thisRate}% возвратов (было ${lastRate}%). Сигналы доверия улучшились или сценарии закрывают больше кейсов сами.`,
  approvalCta: "Настроить пороги",
  resetTitle: "Частые сбросы решений",
  resetMessage: (resets, ratio) =>
    `${resets} решений сброшено на этой неделе (${ratio}% всех действий). Возможно, пороги или сценарии не соответствуют вашей политике.`,
  resetCta: "Открыть настройки",
  anomalyTitle: "Необычный всплеск модерации",
  anomalyMessage: (value, date, multiplier, avg) =>
    `${value} решений обработано ${date} — в ${multiplier}× выше среднего за 30 дней (${avg}/день). Проверьте, не связан ли всплеск с одним SKU или сегментом клиентов.`,
  anomalyCta: "Открыть аналитику",
  holdTitle: "Много удержаний",
  holdMessage: (ratio) =>
    `${ratio}% действий на этой неделе — удержания. Если это соответствует политике, автоматизируйте паттерн сценарием, чтобы разгрузить поддержку.`,
  holdCta: "Создать сценарий",
};

export function getInsightCopy(locale: Locale): InsightCopy {
  return locale === "ru" ? ru : en;
}

export function formatInsightDate(input: Date, locale: Locale): string {
  return input.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  });
}
