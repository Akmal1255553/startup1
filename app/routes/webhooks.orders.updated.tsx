import type { ActionFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import {
  extractShopifyId,
  recordWebhookEvent,
} from "../models/webhook-sync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  await recordWebhookEvent(
    shop,
    topic,
    payload,
    extractShopifyId(payload as { id?: string | number; admin_graphql_api_id?: string }),
  );
  return new Response();
};
