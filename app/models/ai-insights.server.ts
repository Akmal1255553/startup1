import prisma from "../db.server";
import {
  formatInsightDate,
  getInsightCopy,
} from "../i18n/messages/ai-insights-copy";
import type { Locale } from "../i18n/types";
import type { Insight } from "./ai-insights";

export type { Insight, InsightSeverity } from "./ai-insights";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Generate insights from local moderation data — pure statistics,
 * zero external API calls.
 */
export async function loadAiInsights(
  shop: string,
  locale: Locale = "en",
): Promise<Insight[]> {
  const copy = getInsightCopy(locale);
  const now = new Date();
  const startOfToday = startOfDay(now);
  const start30Days = new Date(startOfToday.getTime() - 29 * DAY_MS);

  const events = await prisma.returnDecisionEvent.findMany({
    where: { shop, createdAt: { gte: start30Days } },
    select: { decision: true, previousDecision: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (events.length === 0) {
    return [
      {
        id: "no-data",
        severity: "info",
        title: copy.noDataTitle,
        message: copy.noDataMessage,
        cta: { label: copy.noDataCta, url: "/app/returns" },
      },
    ];
  }

  const insights: Insight[] = [];
  const startOfThisWeek = new Date(startOfToday.getTime() - 6 * DAY_MS);
  const startOfLastWeek = new Date(startOfToday.getTime() - 13 * DAY_MS);

  const thisWeek = events.filter((event) => event.createdAt >= startOfThisWeek);
  const lastWeek = events.filter(
    (event) =>
      event.createdAt >= startOfLastWeek && event.createdAt < startOfThisWeek,
  );

  insights.push(...buildVolumeTrend(thisWeek.length, lastWeek.length, copy));
  insights.push(...buildApprovalShift(thisWeek, lastWeek, copy));
  insights.push(...buildResetSignal(thisWeek, copy));
  insights.push(
    ...buildVolumeAnomaly(events, startOfToday, locale, copy),
  );
  insights.push(...buildHoldConcentration(thisWeek, copy));

  return insights.length
    ? insights
    : [
        {
          id: "all-clear",
          severity: "success",
          title: copy.allClearTitle,
          message: copy.allClearMessage,
        },
      ];
}

function buildVolumeTrend(
  thisWeek: number,
  lastWeek: number,
  copy: ReturnType<typeof getInsightCopy>,
): Insight[] {
  if (lastWeek === 0 && thisWeek === 0) return [];
  if (lastWeek === 0) {
    return [
      {
        id: "trend-first-week",
        severity: "info",
        title: copy.firstWeekTitle,
        message: copy.firstWeekMessage(thisWeek),
      },
    ];
  }

  const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  if (Math.abs(change) < 15) return [];

  return [
    {
      id: "trend-volume",
      severity: change > 0 ? "attention" : "success",
      title:
        change > 0
          ? copy.trendUpTitle(change)
          : copy.trendDownTitle(Math.abs(change)),
      message:
        change > 0
          ? copy.trendUpMessage(thisWeek, lastWeek)
          : copy.trendDownMessage(lastWeek, thisWeek),
      cta: { label: copy.trendCta, url: "/app/playbooks" },
    },
  ];
}

function buildApprovalShift(
  thisWeek: { decision: string }[],
  lastWeek: { decision: string }[],
  copy: ReturnType<typeof getInsightCopy>,
): Insight[] {
  const thisRate = approvalRate(thisWeek);
  const lastRate = approvalRate(lastWeek);
  if (thisRate === null || lastRate === null) return [];

  const delta = thisRate - lastRate;
  if (Math.abs(delta) < 10) return [];

  return [
    {
      id: "approval-shift",
      severity: delta < 0 ? "critical" : "success",
      title:
        delta < 0
          ? copy.approvalDropTitle(Math.abs(delta))
          : copy.approvalRiseTitle(delta),
      message:
        delta < 0
          ? copy.approvalDropMessage(thisRate, lastRate)
          : copy.approvalRiseMessage(thisRate, lastRate),
      cta: { label: copy.approvalCta, url: "/app/settings" },
    },
  ];
}

function buildResetSignal(
  events: { decision: string }[],
  copy: ReturnType<typeof getInsightCopy>,
): Insight[] {
  const resets = events.filter((event) => event.decision === "reset").length;
  if (resets < 3) return [];

  const ratio = Math.round((resets / Math.max(1, events.length)) * 100);
  if (ratio < 10) return [];

  return [
    {
      id: "reset-signal",
      severity: "attention",
      title: copy.resetTitle,
      message: copy.resetMessage(resets, ratio),
      cta: { label: copy.resetCta, url: "/app/settings" },
    },
  ];
}

function buildVolumeAnomaly(
  events: { createdAt: Date }[],
  startOfToday: Date,
  locale: Locale,
  copy: ReturnType<typeof getInsightCopy>,
): Insight[] {
  if (events.length < 14) return [];

  const buckets = new Map<string, number>();
  for (let offset = 0; offset < 30; offset++) {
    const date = new Date(startOfToday.getTime() - (29 - offset) * DAY_MS);
    buckets.set(formatDate(date), 0);
  }
  for (const event of events) {
    const key = formatDate(event.createdAt);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const counts = Array.from(buckets.values());
  const avg = counts.reduce((sum, n) => sum + n, 0) / counts.length;
  if (avg < 1) return [];

  for (let i = counts.length - 1; i >= counts.length - 7; i--) {
    if (i < 0) break;
    const value = counts[i];
    if (value >= avg * 2 && value >= 5) {
      const date = new Date(
        startOfToday.getTime() - (counts.length - 1 - i) * DAY_MS,
      );
      return [
        {
          id: "anomaly-day",
          severity: "critical",
          title: copy.anomalyTitle,
          message: copy.anomalyMessage(
            value,
            formatInsightDate(date, locale),
            Math.round((value / avg) * 10) / 10,
            Math.round(avg),
          ),
          cta: { label: copy.anomalyCta, url: "/app/analytics" },
        },
      ];
    }
  }

  return [];
}

function buildHoldConcentration(
  events: { decision: string }[],
  copy: ReturnType<typeof getInsightCopy>,
): Insight[] {
  if (events.length < 10) return [];
  const holds = events.filter((event) => event.decision === "hold").length;
  if (holds === 0) return [];
  const ratio = Math.round((holds / events.length) * 100);
  if (ratio < 35) return [];

  return [
    {
      id: "hold-concentration",
      severity: "attention",
      title: copy.holdTitle,
      message: copy.holdMessage(ratio),
      cta: { label: copy.holdCta, url: "/app/playbooks" },
    },
  ];
}

function approvalRate(events: { decision: string }[]): number | null {
  const decisive = events.filter(
    (event) =>
      event.decision === "approved" ||
      event.decision === "review" ||
      event.decision === "hold",
  );
  if (!decisive.length) return null;
  const approved = decisive.filter(
    (event) => event.decision === "approved",
  ).length;
  return Math.round((approved / decisive.length) * 100);
}

function startOfDay(input: Date): Date {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(input: Date): string {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
