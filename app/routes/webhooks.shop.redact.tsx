import type { ActionFunctionArgs } from "@remix-run/node";

import {
  authenticateWebhookOrResponse,
  isWebhookAuthResponse,
} from "../lib/shopify-webhook.server";
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
  const auth = await authenticateWebhookOrResponse(request);
  if (isWebhookAuthResponse(auth)) return auth;
  const { shop, topic, payload } = auth;
  const typed = payload as { shop_id?: string | number };
  const shopifyId =
    typed.shop_id !== undefined ? String(typed.shop_id) : null;
  await recordWebhookEvent(shop, topic, payload, shopifyId);
  await redactShop(shop);
  return new Response();
};
