import type { ActionFunctionArgs } from "@remix-run/node";

import {
  authenticateWebhookOrResponse,
  isWebhookAuthResponse,
} from "../lib/shopify-webhook.server";
import {
  extractShopifyId,
  recordWebhookEvent,
  syncReturnDecisionFromWebhook,
} from "../models/webhook-sync.server";

type ReturnPayload = {
  id?: string | number;
  admin_graphql_api_id?: string;
  order_id?: string | number;
  name?: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await authenticateWebhookOrResponse(request);
  if (isWebhookAuthResponse(auth)) return auth;
  const { shop, topic, payload } = auth;
  const typed = payload as ReturnPayload;
  await recordWebhookEvent(shop, topic, payload, extractShopifyId(typed));
  await syncReturnDecisionFromWebhook(shop, topic, typed);
  return new Response();
};
