import type { ActionFunctionArgs } from "@remix-run/node";
import {
  authenticateWebhookOrResponse,
  isWebhookAuthResponse,
} from "../lib/shopify-webhook.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const auth = await authenticateWebhookOrResponse(request);
    if (isWebhookAuthResponse(auth)) return auth;
    const { payload, session, topic, shop } = auth;
    console.log(`Received ${topic} webhook for ${shop}`);

    const current = payload.current as string[];
    if (session) {
        await db.session.update({   
            where: {
                id: session.id
            },
            data: {
                scope: current.toString(),
            },
        });
    }
    return new Response();
};
