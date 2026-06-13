import type { ReturnReasonCategory } from "./product-intelligence.types";

const SIZING_TOKENS = [
  "size",
  "sizing",
  "too_small",
  "too-small",
  "too_large",
  "too-large",
  "size_too_small",
  "size_too_large",
  "fit",
];

const DAMAGED_TOKENS = [
  "defective",
  "damaged",
  "broken",
  "damage",
  "defect",
];

const NOT_AS_DESCRIBED_TOKENS = [
  "not_as_described",
  "not-as-described",
  "wrong_item",
  "wrong-item",
  "incorrect",
  "color",
  "colour",
];

const CHANGED_MIND_TOKENS = [
  "change_of_mind",
  "change-of-mind",
  "unwanted",
  "no_longer_needed",
  "customer_changed_mind",
];

const LATE_DELIVERY_TOKENS = [
  "late_delivery",
  "late-delivery",
  "delivery",
  "shipping_delay",
  "arrived_late",
];

/**
 * Map Shopify return reason enums, definition handles, and free-text notes
 * into the six analytics buckets used across Product Return Intelligence.
 */
export function categorizeReturnReason(input: {
  returnReason?: string | null;
  reasonHandle?: string | null;
  reasonName?: string | null;
  note?: string | null;
}): ReturnReasonCategory {
  const tokens = [
    input.returnReason,
    input.reasonHandle,
    input.reasonName,
    input.note,
  ]
    .filter(Boolean)
    .map((value) => normalizeToken(value as string));

  for (const token of tokens) {
    if (matchesAny(token, SIZING_TOKENS)) return "sizing";
    if (matchesAny(token, DAMAGED_TOKENS)) return "damaged";
    if (matchesAny(token, NOT_AS_DESCRIBED_TOKENS)) return "notAsDescribed";
    if (matchesAny(token, CHANGED_MIND_TOKENS)) return "changedMind";
    if (matchesAny(token, LATE_DELIVERY_TOKENS)) return "lateDelivery";
  }

  return "other";
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function matchesAny(token: string, needles: string[]): boolean {
  return needles.some(
    (needle) => token === needle || token.includes(needle.replace(/_/g, "")),
  );
}

export function emptyReasonBreakdown(): Record<ReturnReasonCategory, number> {
  return {
    sizing: 0,
    damaged: 0,
    notAsDescribed: 0,
    changedMind: 0,
    lateDelivery: 0,
    other: 0,
  };
}
