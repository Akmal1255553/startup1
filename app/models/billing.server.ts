import { BillingInterval } from "@shopify/shopify-app-remix/server";
import {
  PLAN_GROWTH,
  PLAN_SCALE,
  PLAN_STARTER,
  PLANS,
  isKnownPlanId,
  type PlanId,
} from "../billing/plans";

export const BILLING_TEST_MODE = process.env.NODE_ENV !== "production";

export const KNOWN_PLAN_IDS: PlanId[] = [PLAN_STARTER, PLAN_GROWTH, PLAN_SCALE];

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

export type ActiveSubscriptionSummary = {
  hasActivePayment: boolean;
  activePlan: PlanId | null;
  subscriptionId: string | null;
  isTest: boolean;
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
