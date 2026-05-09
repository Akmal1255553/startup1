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
    tagline: "For new stores starting return moderation.",
    monthlyPrice: 19,
    currencyCode: "USD",
    trialDays: 14,
    features: [
      "Up to 100 scored returns / month",
      "Manual review queue",
      "Basic risk scoring",
      "CSV export",
    ],
  },
  {
    id: PLAN_GROWTH,
    name: "Growth",
    tagline: "For scaling teams that need automation.",
    monthlyPrice: 49,
    currencyCode: "USD",
    trialDays: 14,
    recommended: true,
    features: [
      "Up to 1,000 scored returns / month",
      "Automated playbooks (auto approve / review / hold)",
      "Decision history & audit log",
      "Bulk moderation actions",
      "Email support",
    ],
  },
  {
    id: PLAN_SCALE,
    name: "Scale",
    tagline: "For high-volume merchants and brands.",
    monthlyPrice: 149,
    currencyCode: "USD",
    trialDays: 14,
    features: [
      "Unlimited scored returns",
      "Advanced analytics",
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
