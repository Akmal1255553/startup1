import prisma from "../db.server";

const DAY_MS = 24 * 60 * 60 * 1000;

export type InsightSeverity = "success" | "info" | "attention" | "critical";

export type Insight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  cta?: { label: string; url: string };
};

/**
 * Generate "AI insights" from local moderation data — pure statistics,
 * zero external API calls. The insight engine looks at:
 *
 * - Week-over-week trends in approval / hold rates
 * - Daily volume anomalies (≥ 2× the 30d average)
 * - Reset-rate signals (humans overriding the system)
 * - Concentration of holds on a single decision pattern
 *
 * Architecture leaves room to plug in an LLM-based summarizer later
 * (e.g. Cloudflare Workers AI, Groq, OpenAI) by replacing the message
 * field of each insight with a generated narrative.
 */
export async function loadAiInsights(shop: string): Promise<Insight[]> {
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
        title: "Not enough data yet",
        message:
          "Once your team starts moderating returns, insights about trends, anomalies, and recommended playbooks will appear here.",
        cta: { label: "Open queue", url: "/app/returns" },
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

  insights.push(...buildVolumeTrend(thisWeek.length, lastWeek.length));
  insights.push(...buildApprovalShift(thisWeek, lastWeek));
  insights.push(...buildResetSignal(thisWeek));
  insights.push(...buildVolumeAnomaly(events, startOfToday));
  insights.push(...buildHoldConcentration(thisWeek));

  return insights.length
    ? insights
    : [
        {
          id: "all-clear",
          severity: "success",
          title: "Operations look healthy",
          message:
            "No anomalies, trend reversals, or unusual patterns detected in the last 30 days.",
        },
      ];
}

function buildVolumeTrend(thisWeek: number, lastWeek: number): Insight[] {
  if (lastWeek === 0 && thisWeek === 0) return [];
  if (lastWeek === 0) {
    return [
      {
        id: "trend-first-week",
        severity: "info",
        title: "First moderation week",
        message: `Your team handled ${thisWeek} return decisions this week. Insights will sharpen with more history.`,
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
          ? `Return moderation volume up ${change}% week-over-week`
          : `Return moderation volume down ${Math.abs(change)}% week-over-week`,
      message:
        change > 0
          ? `Your team handled ${thisWeek} return decisions in the last 7 days, vs ${lastWeek} the week before. Consider adding playbooks to absorb the load.`
          : `Volume has dropped from ${lastWeek} to ${thisWeek} decisions over the last 7 days — either fewer disputes or your playbooks are auto-clearing more cases.`,
      cta: { label: "Open playbooks", url: "/app/playbooks" },
    },
  ];
}

function buildApprovalShift(
  thisWeek: { decision: string }[],
  lastWeek: { decision: string }[],
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
          ? `Approval rate dropped ${Math.abs(delta)} points`
          : `Approval rate climbed ${delta} points`,
      message:
        delta < 0
          ? `${thisRate}% of moderated returns were approved this week (was ${lastRate}% the week before). More cases are being held or sent for review — review your hold threshold.`
          : `${thisRate}% of moderated returns were approved this week (was ${lastRate}% the week before). Either trust signals improved, or your playbooks are resolving more cases automatically.`,
      cta: { label: "Tune thresholds", url: "/app/settings" },
    },
  ];
}

function buildResetSignal(events: { decision: string }[]): Insight[] {
  const resets = events.filter((event) => event.decision === "reset").length;
  if (resets < 3) return [];

  const ratio = Math.round((resets / Math.max(1, events.length)) * 100);
  if (ratio < 10) return [];

  return [
    {
      id: "reset-signal",
      severity: "attention",
      title: "Frequent resets detected",
      message: `${resets} decisions were reset this week (${ratio}% of all actions). This may indicate your thresholds or playbooks need tuning to match real merchant intent.`,
      cta: { label: "Review settings", url: "/app/settings" },
    },
  ];
}

function buildVolumeAnomaly(
  events: { createdAt: Date }[],
  startOfToday: Date,
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

  // Find the most recent day that exceeds the threshold
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
          title: "Unusual moderation spike",
          message: `${value} return decisions were processed on ${formatDateLong(date)} — ${Math.round((value / avg) * 10) / 10}× your 30-day average of ${Math.round(avg)}/day. Check whether a single SKU or customer segment is driving this.`,
          cta: { label: "Open analytics", url: "/app/analytics" },
        },
      ];
    }
  }

  return [];
}

function buildHoldConcentration(events: { decision: string }[]): Insight[] {
  if (events.length < 10) return [];
  const holds = events.filter((event) => event.decision === "hold").length;
  if (holds === 0) return [];
  const ratio = Math.round((holds / events.length) * 100);
  if (ratio < 35) return [];

  return [
    {
      id: "hold-concentration",
      severity: "attention",
      title: "High hold concentration",
      message: `${ratio}% of all actions this week were holds. If this is consistent with policy, consider creating a playbook to automate the pattern and free up support time.`,
      cta: { label: "Create playbook", url: "/app/playbooks" },
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

function formatDateLong(input: Date): string {
  return input.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
