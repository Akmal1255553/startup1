import prisma from "../db.server";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_DAYS_LONG = 30;
const PERIOD_DAYS_SHORT = 7;

type DecisionKind = "approved" | "review" | "hold" | "reset";

export type DailyBucket = {
  date: string;
  approved: number;
  review: number;
  hold: number;
  reset: number;
  total: number;
};

export type PeriodTotals = {
  approved: number;
  review: number;
  hold: number;
  reset: number;
  total: number;
};

export type PeriodAnalytics = {
  daily: DailyBucket[];
  totals: PeriodTotals;
  /** Percentage of approvals out of all decisive events (excludes resets). 0-100. */
  approvalRate: number;
  /** Percentage of holds + reviews out of decisive events (excludes resets). 0-100. */
  flaggedRate: number;
};

export type AnalyticsSummary = {
  last7Days: PeriodAnalytics;
  last30Days: PeriodAnalytics;
  today: PeriodTotals & { date: string };
  totalEvents: number;
};

/**
 * Compute moderation analytics from the ReturnDecisionEvent audit log.
 *
 * Single Prisma query returns 30 days of events; bucketing happens in memory
 * to avoid multiple DB roundtrips. The audit log is naturally bounded
 * (one event per moderation action), so 30 days is cheap on SQLite.
 */
export async function loadAnalytics(shop: string): Promise<AnalyticsSummary> {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const start30Days = new Date(startOfToday.getTime() - (PERIOD_DAYS_LONG - 1) * DAY_MS);

  const events = await prisma.returnDecisionEvent.findMany({
    where: { shop, createdAt: { gte: start30Days } },
    select: { decision: true, createdAt: true },
  });

  const dailyMap = new Map<string, DailyBucket>();
  for (let offset = 0; offset < PERIOD_DAYS_LONG; offset++) {
    const date = new Date(start30Days.getTime() + offset * DAY_MS);
    const key = formatDate(date);
    dailyMap.set(key, emptyBucket(key));
  }

  for (const event of events) {
    const key = formatDate(event.createdAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    const kind = normalizeDecision(event.decision);
    bucket[kind] += 1;
    bucket.total += 1;
  }

  const daily30 = Array.from(dailyMap.values());
  const daily7 = daily30.slice(-PERIOD_DAYS_SHORT);
  const todayKey = formatDate(startOfToday);
  const todayBucket = dailyMap.get(todayKey) || emptyBucket(todayKey);

  return {
    last7Days: buildPeriodAnalytics(daily7),
    last30Days: buildPeriodAnalytics(daily30),
    today: { ...todayBucket },
    totalEvents: daily30.reduce((sum, day) => sum + day.total, 0),
  };
}

function buildPeriodAnalytics(daily: DailyBucket[]): PeriodAnalytics {
  const totals = daily.reduce<PeriodTotals>(
    (acc, day) => ({
      approved: acc.approved + day.approved,
      review: acc.review + day.review,
      hold: acc.hold + day.hold,
      reset: acc.reset + day.reset,
      total: acc.total + day.total,
    }),
    { approved: 0, review: 0, hold: 0, reset: 0, total: 0 },
  );

  // "Decisive" events exclude resets so percentages reflect moderation
  // outcome rather than ops-cleanup actions.
  const decisive = totals.approved + totals.review + totals.hold;
  const approvalRate = decisive
    ? Math.round((totals.approved / decisive) * 100)
    : 0;
  const flaggedRate = decisive
    ? Math.round(((totals.review + totals.hold) / decisive) * 100)
    : 0;

  return { daily, totals, approvalRate, flaggedRate };
}

function normalizeDecision(value: string): DecisionKind {
  if (value === "approved") return "approved";
  if (value === "hold") return "hold";
  if (value === "reset") return "reset";
  return "review";
}

function emptyBucket(date: string): DailyBucket {
  return { date, approved: 0, review: 0, hold: 0, reset: 0, total: 0 };
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
