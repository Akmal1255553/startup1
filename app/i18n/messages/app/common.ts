import type { Locale } from "../../types";
import { pickByLocale } from "../../pick-locale";
import { APP_COMMON } from "../../translations/common";

export type AppCommonCopy = (typeof APP_COMMON)["en"];

export function getAppCommonCopy(locale: Locale): AppCommonCopy {
  return pickByLocale(APP_COMMON, locale);
}

export function decisionLabel(
  copy: AppCommonCopy,
  decision: string,
): string {
  if (decision === "approved") return copy.decisionApproved;
  if (decision === "hold") return copy.decisionHold;
  return copy.decisionReview;
}

export function describePlanContext(
  copy: AppCommonCopy,
  planLabel: string,
  hasActivePlan: boolean,
): string {
  if (!hasActivePlan) return copy.planContextFree;
  return copy.planContextPaid(planLabel);
}
