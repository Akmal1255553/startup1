import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import {
  recordWebhookEvent,
  redactShop,
} from "../models/webhook-sync.server";

/**
 * GDPR `shop/redact` — fired 48 hours after a merchant uninstalls.
 * We wipe every shop-scoped row so we hold no leftover data.
 *
 * NB: this is intentionally last-write; the audit row goes in first so
 * the redaction is logged before the WebhookEvent table itself is
 * cleared.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const typed = payload as { shop_id?: string | number };
  const shopifyId =
    typed.shop_id !== undefined ? String(typed.shop_id) : null;
  await recordWebhookEvent(shop, topic, payload, shopifyId);
  await redactShop(shop);
  return new Response();
};
