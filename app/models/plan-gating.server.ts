/**
 * Server-side bridge between Shopify Billing and our capability descriptors.
 *
 * Use `loadCapabilities(billing, shop)` from any loader/action that already calls
 * `authenticate.admin(request)`, so we don't authenticate twice. The result
 * is meant to be:
 *   - returned to the UI (to disable/hide gated controls), and
 *   - checked in mutations to reject calls a plan shouldn't be able to make.
 */
import {
  FREE,
  getCapabilities,
  type PlanCapabilities,
} from "../billing/capabilities";
import { authenticate } from "../shopify.server";
import {
  BILLING_TEST_MODE,
  checkActiveSubscription,
  getCachedBillingIsTest,
  resolveBillingIsTestForShop,
  type BillingAdminGraphql,
} from "./billing.server";

type AdminBilling = Awaited<
  ReturnType<typeof authenticate.admin>
>["billing"];

export async function loadCapabilities(
  billing: AdminBilling,
  shop: string,
  admin?: BillingAdminGraphql,
): Promise<PlanCapabilities> {
  let isTest = getCachedBillingIsTest(shop);
  if (isTest === undefined) {
    isTest = admin
      ? await resolveBillingIsTestForShop(admin, shop)
      : BILLING_TEST_MODE;
  }

  try {
    const summary = await checkActiveSubscription(billing, { shop, isTest });
    return getCapabilities(summary.activePlan, summary.hasActivePayment);
  } catch (error) {
    console.error("[ReturnGuard] billing.check failed — using Free tier", error);
    return FREE;
  }
}

/**
 * Throws a Remix 402 Response with a JSON body that the route's catch
 * boundary (or action layer) can return verbatim. Useful for mutations
 * that should hard-fail when the plan can't perform them.
 */
export function planResponse(
  capabilities: PlanCapabilities,
  message: string,
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: message,
      plan: capabilities.planLabel,
      hasActivePlan: capabilities.hasActivePlan,
    }),
    {
      status: 402,
      headers: { "Content-Type": "application/json" },
    },
  );
}
