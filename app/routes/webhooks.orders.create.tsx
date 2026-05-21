import type { ActionFunctionArgs } from "@remix-run/node";

import {
  authenticateWebhookOrResponse,
  isWebhookAuthResponse,
} from "../lib/shopify-webhook.server";
import {
  extractShopifyId,
  recordWebhookEvent,
} from "../models/webhook-sync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await authenticateWebhookOrResponse(request);
  if (isWebhookAuthResponse(auth)) return auth;
  const { shop, topic, payload } = auth;
  await recordWebhookEvent(
    shop,
    topic,
    payload,
    extractShopifyId(payload as { id?: string | number; admin_graphql_api_id?: string }),
  );
  return new Response();
};
