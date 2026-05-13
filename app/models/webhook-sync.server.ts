/**
 * Shared helpers for Shopify webhooks.
 *
 * Every webhook route should call `recordWebhookEvent` so we keep an
 * append-only audit of what Shopify pushed (truncated for storage),
 * regardless of whether we also have business logic for that topic.
 */
import prisma from "../db.server";

const PAYLOAD_TRUNCATE_BYTES = 16_000;

export async function recordWebhookEvent(
  shop: string,
  topic: string,
  payload: unknown,
  shopifyId: string | null = null,
): Promise<void> {
  let payloadJson: string;
  try {
    payloadJson = JSON.stringify(payload);
  } catch {
    payloadJson = '{"_warning":"unserializable_payload"}';
  }

  if (payloadJson.length > PAYLOAD_TRUNCATE_BYTES) {
    payloadJson = `${payloadJson.slice(0, PAYLOAD_TRUNCATE_BYTES)}…[truncated]`;
  }

  await prisma.webhookEvent.create({
    data: {
      shop,
      topic,
      shopifyId,
      payloadJson,
    },
  });
}

type GenericIdSource = {
  id?: string | number | null;
  admin_graphql_api_id?: string | null;
};

export function extractShopifyId(
  source: GenericIdSource | null | undefined,
): string | null {
  if (!source) return null;
  if (typeof source.admin_graphql_api_id === "string" && source.admin_graphql_api_id) {
    return source.admin_graphql_api_id;
  }
  if (source.id !== undefined && source.id !== null) {
    return String(source.id);
  }
  return null;
}

/**
 * Map Shopify return webhook topics into the ReturnGuard decision vocabulary.
 * `returns/request` is informational only — we don't auto-decide on the
 * merchant's behalf there. The auto-mirror only kicks in for terminal
 * states the merchant chose in Shopify Admin.
 */
const RETURN_TOPIC_TO_DECISION: Record<string, "approved" | "hold" | null> = {
  "returns/approve": "approved",
  "returns/decline": "hold",
  "returns/cancel": "hold",
  "returns/request": null,
};

type ReturnWebhookPayload = {
  id?: string | number | null;
  admin_graphql_api_id?: string | null;
  order_id?: string | number | null;
  name?: string | null;
};

export async function syncReturnDecisionFromWebhook(
  shop: string,
  topic: string,
  payload: ReturnWebhookPayload,
): Promise<void> {
  const decision = RETURN_TOPIC_TO_DECISION[topic];
  if (!decision) return;

  const returnGid =
    payload.admin_graphql_api_id ||
    (payload.id ? `gid://shopify/Return/${payload.id}` : null);
  const orderGid = payload.order_id
    ? `gid://shopify/Order/${payload.order_id}`
    : null;

  if (!returnGid || !orderGid) return;

  const existing = await prisma.returnDecision.findFirst({
    where: { shop, returnId: returnGid },
  });

  if (existing) {
    if (existing.decision === decision) return;
    await prisma.returnDecision.update({
      where: { id: existing.id },
      data: { decision },
    });
    await prisma.returnDecisionEvent.create({
      data: {
        shop,
        orderId: orderGid,
        returnId: returnGid,
        orderName: existing.orderName ?? payload.name ?? null,
        decision,
        previousDecision: existing.decision,
        reason: `Mirrored from Shopify webhook ${topic}`,
      },
    });
    return;
  }

  await prisma.returnDecision.create({
    data: {
      shop,
      orderId: orderGid,
      returnId: returnGid,
      orderName: payload.name ?? null,
      decision,
    },
  });
  await prisma.returnDecisionEvent.create({
    data: {
      shop,
      orderId: orderGid,
      returnId: returnGid,
      orderName: payload.name ?? null,
      decision,
      reason: `Mirrored from Shopify webhook ${topic}`,
    },
  });
}

/**
 * GDPR `shop/redact` — Shopify gives us 48 hours after uninstall to wipe
 * shop data. We also call this from `customers/redact` for thoroughness
 * if there's no per-customer index, since our schema is shop-scoped.
 */
export async function redactShop(shop: string): Promise<void> {
  await prisma.$transaction([
    prisma.returnDecision.deleteMany({ where: { shop } }),
    prisma.returnDecisionEvent.deleteMany({ where: { shop } }),
    prisma.playbook.deleteMany({ where: { shop } }),
    prisma.returnRiskSetting.deleteMany({ where: { shop } }),
    prisma.webhookEvent.deleteMany({ where: { shop } }),
  ]);
}

type CustomersRedactPayload = {
  customer?: { id?: string | number | null } | null;
  orders_to_redact?: Array<string | number> | null;
};

/**
 * GDPR `customers/redact` — wipe any decision rows linked to the
 * customer's specific orders. Our ReturnDecision table doesn't store
 * customer PII directly, only GIDs, so we use `orders_to_redact` to
 * locate and remove relevant rows.
 */
export async function redactCustomerData(
  shop: string,
  payload: CustomersRedactPayload,
): Promise<void> {
  const orderIds = (payload.orders_to_redact ?? []).map((value) =>
    `gid://shopify/Order/${value}`,
  );
  if (!orderIds.length) return;

  await prisma.$transaction([
    prisma.returnDecision.deleteMany({
      where: { shop, orderId: { in: orderIds } },
    }),
    prisma.returnDecisionEvent.deleteMany({
      where: { shop, orderId: { in: orderIds } },
    }),
  ]);
}
