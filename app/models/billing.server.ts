import { BillingInterval } from "@shopify/shopify-app-remix/server";
import {
  PLAN_GROWTH,
  PLAN_SCALE,
  PLAN_STARTER,
  PLANS,
  isKnownPlanId,
  type PlanId,
} from "../billing/plans";

/**
 * Whether to issue Shopify Billing requests in test mode.
 *
 * Production uses real subscriptions for regular merchant stores.
 * Local development and Shopify development stores keep test charges.
 * Legacy BILLING_TEST values no longer override the production setting.
 */
export function resolveBillingTestMode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export const BILLING_TEST_MODE = resolveBillingTestMode();

export const KNOWN_PLAN_IDS: PlanId[] = [PLAN_STARTER, PLAN_GROWTH, PLAN_SCALE];

type ShopPlanSnapshot =
  | {
      partnerDevelopment?: boolean;
      displayName?: string | null;
    }
  | null
  | undefined;

/** True for Partner dev stores and similar — they must use test charges only. */
export function isDevelopmentShopPlan(plan: ShopPlanSnapshot): boolean {
  if (!plan) return false;
  if (plan.partnerDevelopment) return true;
  const name = (plan.displayName ?? "").toLowerCase();
  return (
    name.includes("development") ||
    name.includes("developer preview") ||
    name === "affiliate" ||
    name.includes("partner test")
  );
}

export type BillingAdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type ActiveSubscriptionSummary = {
  hasActivePayment: boolean;
  activePlan: PlanId | null;
  subscriptionId: string | null;
  isTest: boolean;
};

const IS_TEST_TTL_MS = 15 * 60 * 1000;
const SUBSCRIPTION_TTL_MS = 5 * 60 * 1000;

const isTestCache = new Map<string, { value: boolean; expiresAt: number }>();
const subscriptionCache = new Map<
  string,
  { value: ActiveSubscriptionSummary; expiresAt: number }
>();

export function getCachedBillingIsTest(shop: string): boolean | undefined {
  const hit = isTestCache.get(shop);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  return undefined;
}

function cacheBillingIsTest(shop: string, isTest: boolean) {
  isTestCache.set(shop, {
    value: isTest,
    expiresAt: Date.now() + IS_TEST_TTL_MS,
  });
}

/**
 * Dev stores always get test charges; regular production stores use real billing.
 */
export async function resolveBillingIsTestForShop(
  admin: BillingAdminGraphql,
  shop: string,
): Promise<boolean> {
  const cached = getCachedBillingIsTest(shop);
  if (cached !== undefined) return cached;

  // Propagate lookup failures, including Shopify authentication handoffs.
  // Never guess a live billing mode when the store type could not be checked.
  const response = await admin.graphql(`#graphql
      query BillingShopPlan {
        shop {
          plan {
            partnerDevelopment
            displayName
          }
        }
      }
    `);
  const json = (await response.json()) as {
    data?: {
      shop?: {
        plan?: { partnerDevelopment?: boolean; displayName?: string };
      };
    };
  };
  const plan = json.data?.shop?.plan;
  if (!response.ok || typeof plan?.partnerDevelopment !== "boolean") {
    throw new Error("Unable to verify store billing mode. Please try again.");
  }
  if (isDevelopmentShopPlan(plan)) {
    cacheBillingIsTest(shop, true);
    return true;
  }

  cacheBillingIsTest(shop, BILLING_TEST_MODE);
  return BILLING_TEST_MODE;
}

type AdminBilling = {
  check: (options: { plans: PlanId[]; isTest: boolean }) => Promise<{
    hasActivePayment: boolean;
    appSubscriptions: Array<{ id: string; name: string; test?: boolean }>;
  }>;
};

/** Cached wrapper around billing.check — shared by billing page and plan gating. */
export async function checkActiveSubscription(
  billing: AdminBilling,
  options: { shop: string; isTest: boolean; fresh?: boolean },
): Promise<ActiveSubscriptionSummary> {
  const cacheKey = `${options.shop}:${options.isTest}`;
  const hit = subscriptionCache.get(cacheKey);
  if (!options.fresh && hit && hit.expiresAt > Date.now()) return hit.value;

  const result = await billing.check({
    plans: KNOWN_PLAN_IDS,
    isTest: options.isTest,
  });
  const summary = summarizeActiveSubscription(result);
  subscriptionCache.set(cacheKey, {
    value: summary,
    expiresAt: Date.now() + SUBSCRIPTION_TTL_MS,
  });
  return summary;
}

export function invalidateSubscriptionCache(shop: string): void {
  subscriptionCache.delete(`${shop}:true`);
  subscriptionCache.delete(`${shop}:false`);
}

/**
 * Local structural type for a recurring subscription plan that matches
 * @shopify/shopify-api's `BillingConfigSubscriptionLineItemPlan`.
 * We define this locally because `BillingConfig` is not part of the
 * public package exports.
 */
type SubscriptionPlanConfig = {
  trialDays?: number;
  lineItems: Array<{
    amount: number;
    currencyCode: string;
    interval: BillingInterval.Every30Days | BillingInterval.Annual;
  }>;
};

function buildSubscriptionPlan(planId: PlanId): SubscriptionPlanConfig {
  return {
    trialDays: getPlanTrialDays(planId),
    lineItems: [
      {
        amount: getPlanAmount(planId),
        currencyCode: "USD",
        interval: BillingInterval.Every30Days,
      },
    ],
  };
}

/**
 * Configuration object passed into shopifyApp({ billing }).
 * Pricing here mirrors `app/billing/plans.ts` to keep a single source of truth.
 *
 * IMPORTANT: this object is intentionally NOT annotated with a wide
 * Record<string, ...> type, because shopifyApp() infers the literal plan
 * names from this object to type the billing API surface. Annotating with
 * a Record would erase those literal keys and cause `plans` typing failures
 * downstream (e.g. billing.check({ plans })).
 */
export const billingConfig = {
  [PLAN_STARTER]: buildSubscriptionPlan(PLAN_STARTER),
  [PLAN_GROWTH]: buildSubscriptionPlan(PLAN_GROWTH),
  [PLAN_SCALE]: buildSubscriptionPlan(PLAN_SCALE),
};

/**
 * Pure mapper from Shopify billing.check() response to our typed summary.
 * Keeps the route logic thin and the mapping testable.
 */
export function summarizeActiveSubscription(result: {
  hasActivePayment: boolean;
  appSubscriptions: Array<{ id: string; name: string; test?: boolean }>;
}): ActiveSubscriptionSummary {
  const subscription = result.appSubscriptions[0];
  const activePlan =
    subscription && isKnownPlanId(subscription.name) ? subscription.name : null;

  return {
    hasActivePayment: result.hasActivePayment,
    activePlan,
    subscriptionId: subscription?.id || null,
    isTest: Boolean(subscription?.test),
  };
}

function getPlanAmount(planId: PlanId): number {
  const descriptor = PLANS.find((plan) => plan.id === planId);
  if (!descriptor) {
    throw new Error(`Missing plan descriptor for ${planId}`);
  }
  return descriptor.monthlyPrice;
}

function getPlanTrialDays(planId: PlanId): number {
  const descriptor = PLANS.find((plan) => plan.id === planId);
  if (!descriptor) {
    throw new Error(`Missing plan descriptor for ${planId}`);
  }
  return descriptor.trialDays;
}
