import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import { recordWebhookEvent } from "../models/webhook-sync.server";

/**
 * GDPR `customers/data_request` — Shopify forwards a merchant request
 * for a customer's stored personal data. ReturnGuard does not store
 * customer PII directly (only Shopify GIDs for orders/returns), so we
 * log the request for audit and respond 200.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  const typed = payload as {
    customer?: { id?: string | number };
  };
  const shopifyId =
    typed.customer && typed.customer.id !== undefined
      ? String(typed.customer.id)
      : null;
  await recordWebhookEvent(shop, topic, payload, shopifyId);
  return new Response();
};
