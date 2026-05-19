import type { Locale } from "../../types";
import { getAppCommonCopy, type AppCommonCopy } from "./common";
import { getAuditCopy, type AuditCopy } from "./audit";
import { getAnalyticsCopy, type AnalyticsCopy } from "./analytics";
import { getBillingCopy, type BillingCopy } from "./billing";
import { getOnboardingCopy, type OnboardingCopy } from "./onboarding";
import { getPlaybooksCopy, type PlaybooksCopy } from "./playbooks";
import { getReturnsCopy, type ReturnsCopy } from "./returns";
import { getSettingsCopy, type SettingsCopy } from "./settings";

export type AppPagesMessages = {
  common: AppCommonCopy;
  returns: ReturnsCopy;
  analytics: AnalyticsCopy;
  settings: SettingsCopy;
  billing: BillingCopy;
  onboarding: OnboardingCopy;
  audit: AuditCopy;
  playbooks: PlaybooksCopy;
};

export function getAppPagesMessages(locale: Locale): AppPagesMessages {
  return {
    common: getAppCommonCopy(locale),
    returns: getReturnsCopy(locale),
    analytics: getAnalyticsCopy(locale),
    settings: getSettingsCopy(locale),
    billing: getBillingCopy(locale),
    onboarding: getOnboardingCopy(locale),
    audit: getAuditCopy(locale),
    playbooks: getPlaybooksCopy(locale),
  };
}
