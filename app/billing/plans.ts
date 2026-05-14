export const PLAN_STARTER = "Starter";
export const PLAN_GROWTH = "Growth";
export const PLAN_SCALE = "Scale";

export type PlanId =
  | typeof PLAN_STARTER
  | typeof PLAN_GROWTH
  | typeof PLAN_SCALE;

export type PlanDescriptor = {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  currencyCode: "USD";
  trialDays: number;
  features: string[];
  recommended?: boolean;
};

export const PLANS: PlanDescriptor[] = [
  {
    id: PLAN_STARTER,
    name: "Starter",
    tagline: "For new stores that want higher limits without automation yet.",
    monthlyPrice: 9,
    currencyCode: "USD",
    trialDays: 21,
    features: [
      "Up to 250 scored returns / month (fair use)",
      "Larger queue pages (50 rows)",
      "Everything in Free",
      "Email support",
    ],
  },
  {
    id: PLAN_GROWTH,
    name: "Growth",
    tagline: "For scaling teams that need automation and audit history.",
    monthlyPrice: 29,
    currencyCode: "USD",
    trialDays: 21,
    recommended: true,
    features: [
      "Up to 2,000 scored returns / month (fair use)",
      "Automated playbooks (approve / review / hold)",
      "Full audit log & decision history",
      "Bulk moderation actions",
      "30-day analytics window",
    ],
  },
  {
    id: PLAN_SCALE,
    name: "Scale",
    tagline: "For high-volume merchants who need analytics depth and priority help.",
    monthlyPrice: 79,
    currencyCode: "USD",
    trialDays: 21,
    features: [
      "Unlimited scored returns (fair use)",
      "Advanced analytics (90-day window)",
      "Priority support",
      "Custom risk weights",
      "Multi-store ready",
    ],
  },
];

export function getPlanDescriptor(planId: string | null): PlanDescriptor | null {
  if (!planId) return null;
  return PLANS.find((plan) => plan.id === planId) || null;
}

export function isKnownPlanId(value: unknown): value is PlanId {
  return value === PLAN_STARTER || value === PLAN_GROWTH || value === PLAN_SCALE;
}
