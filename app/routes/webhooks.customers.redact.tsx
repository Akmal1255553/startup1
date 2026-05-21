import type { ActionFunctionArgs } from "@remix-run/node";

import {
  authenticateWebhookOrResponse,
  isWebhookAuthResponse,
} from "../lib/shopify-webhook.server";
import {
  recordWebhookEvent,
  redactCustomerData,
} from "../models/webhook-sync.server";

/**
 * GDPR `customers/redact` — Shopify gives `orders_to_redact` so we can
 * find any decision rows we previously logged for those orders and
 * delete them. ReturnDecision and ReturnDecisionEvent are the only
 * tables that can contain customer-derived data in our schema.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await authenticateWebhookOrResponse(request);
  if (isWebhookAuthResponse(auth)) return auth;
  const { shop, topic, payload } = auth;
  const typed = payload as {
    customer?: { id?: string | number };
    orders_to_redact?: Array<string | number>;
  };
  const shopifyId =
    typed.customer && typed.customer.id !== undefined
      ? String(typed.customer.id)
      : null;
  await recordWebhookEvent(shop, topic, payload, shopifyId);
  await redactCustomerData(shop, typed);
  return new Response();
};
