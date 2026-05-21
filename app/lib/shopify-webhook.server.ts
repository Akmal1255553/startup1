import type { WebhookContext } from "@shopify/shopify-app-remix/server";

import { authenticate } from "../shopify.server";

/**
 * Authenticate a Shopify webhook and return either context or an HTTP Response.
 * Remix actions should `return` auth failures (not only throw) so automated
 * checks receive 401 instead of 500.
 */
export async function authenticateWebhookOrResponse(
  request: Request,
): Promise<WebhookContext | Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      statusText: "Method Not Allowed",
    });
  }

  try {
    return await authenticate.webhook(request);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("[webhook] authentication failed", error);
    return new Response("Unauthorized", {
      status: 401,
      statusText: "Unauthorized",
    });
  }
}

export function isWebhookAuthResponse(
  result: WebhookContext | Response,
): result is Response {
  return result instanceof Response;
}
