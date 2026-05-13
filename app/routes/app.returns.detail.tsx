import type { LoaderFunctionArgs } from "@remix-run/node";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";

const DETAIL_EVENT_LIMIT = 25;

export type ReturnDetailEvent = {
  id: string;
  decision: string;
  previousDecision: string | null;
  risk: number | null;
  reason: string | null;
  createdAt: string;
  orderName: string | null;
  returnId: string | null;
};

export type ReturnDetailResponse = {
  orderId: string;
  returnId: string | null;
  events: ReturnDetailEvent[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const orderId = (url.searchParams.get("orderId") || "").trim();
  const returnIdRaw = (url.searchParams.get("returnId") || "").trim();
  const returnId = returnIdRaw.length ? returnIdRaw : null;

  if (!orderId) {
    return {
      orderId: "",
      returnId,
      events: [],
    } satisfies ReturnDetailResponse;
  }

  // Pull events for both: the specific return AND any order-only decisions
  // on the parent order, so the timeline shows the full triage history.
  const where = {
    shop: session.shop,
    OR: returnId
      ? [
          { orderId, returnId },
          { orderId, returnId: null },
        ]
      : [{ orderId }],
  };

  const events = await prisma.returnDecisionEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: DETAIL_EVENT_LIMIT,
    select: {
      id: true,
      decision: true,
      previousDecision: true,
      risk: true,
      reason: true,
      createdAt: true,
      orderName: true,
      returnId: true,
    },
  });

  return {
    orderId,
    returnId,
    events: events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
  } satisfies ReturnDetailResponse;
};
