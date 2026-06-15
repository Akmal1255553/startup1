import type { Locale } from "../types";
import { pickByLocale } from "../pick-locale";
import { LANDING_COPY } from "../translations/landing";
import { LANDING_PRICING, type LandingPricingCopy, type LandingPricingPlan } from "../translations/landing-pricing";

export type LandingFeature = { title: string; description: string };
export type LandingStep = { n: string; title: string; text: string };
export type LandingMetric = { value: string; label: string };

export type { LandingPricingPlan };

export type LandingBaseCopy = {
  metaTitle: string;
  metaDescription: string;
  navProduct: string;
  navWorkflow: string;
  navInstall: string;
  navPrivacy: string;
  navSupport: string;
  navPreview: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  btnSeeInterface: string;
  installDisabled: string;
  labelStoreDomain: string;
  placeholderShop: string;
  btnInstall: string;
  chipEmbedded: string;
  chipQueue: string;
  chipAudit: string;
  mockAria: string;
  mockUrl: string;
  mockReturnsQueue: string;
  mockToday: string;
  mockLiveSync: string;
  mockPortfolioRisk: string;
  mockWeighted: string;
  mockHighRisk: string;
  mockReview: string;
  mockApproved: string;
  metricsAria: string;
  platformEyebrow: string;
  featTitle: string;
  featLead: string;
  features: LandingFeature[];
  workflowEyebrow: string;
  workflowTitle: string;
  steps: LandingStep[];
  ctaTitle: string;
  ctaLead: string;
  btnInstallCta: string;
  btnExplore: string;
  footerPrivacy: string;
  footerSupport: string;
  footerNote: string;
  metrics: LandingMetric[];
  langLabel: string;
};

export type LandingCopy = LandingBaseCopy & LandingPricingCopy;

export function getLandingCopy(locale: Locale): LandingCopy {
  return {
    ...pickByLocale(LANDING_COPY, locale),
    ...pickByLocale(LANDING_PRICING, locale),
  };
}
