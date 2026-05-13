import prisma from "../db.server";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export type AuditLogParams = {
  decision?: string | null;
  page?: number | null;
  pageSize?: number | null;
  query?: string | null;
};

export async function loadAuditLog(shop: string, params: AuditLogParams) {
  const pageSize = clamp(
    params.pageSize || DEFAULT_PAGE_SIZE,
    5,
    MAX_PAGE_SIZE,
  );
  const page = Math.max(1, params.page || 1);
  const decision = normalizeDecisionFilter(params.decision);
  const query = sanitizeQuery(params.query);

  const where = {
    shop,
    ...(decision ? { decision } : {}),
    ...(query
      ? {
          OR: [
            { orderName: { contains: query } },
            { orderId: { contains: query } },
            { returnId: { contains: query } },
          ],
        }
      : {}),
  };

  const [events, total] = await Promise.all([
    prisma.returnDecisionEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderId: true,
        returnId: true,
        orderName: true,
        previousDecision: true,
        decision: true,
        risk: true,
        reason: true,
        createdAt: true,
      },
    }),
    prisma.returnDecisionEvent.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    decision: decision || "all",
    events: events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
      label: event.orderName || event.returnId || event.orderId,
    })),
    page: Math.min(page, totalPages),
    pageSize,
    query,
    total,
    totalPages,
  };
}

function normalizeDecisionFilter(value: string | null | undefined) {
  if (value === "approved" || value === "review" || value === "hold") {
    return value;
  }
  return null;
}

function sanitizeQuery(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/[^\w\s#:/.-]/g, "")
    .trim()
    .slice(0, 120);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
