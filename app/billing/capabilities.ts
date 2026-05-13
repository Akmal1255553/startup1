/**
 * Plan capability descriptors.
 *
 * Pure data — safe for client and server. Routes call `getCapabilities`
 * (driven by Shopify Billing) to know which features the current shop can
 * use, then enforce on the server and reflect in the UI.
 */
import {
  PLAN_GROWTH,
  PLAN_SCALE,
  PLAN_STARTER,
  type PlanId,
} from "./plans";

export type PlanCapabilities = {
  planId: PlanId | null;
  planLabel: string;
  hasActivePlan: boolean;
  maxQueuePageSize: number;
  canBulkAct: boolean;
  canExportCsv: boolean;
  canUseAutomation: boolean;
  canUseAuditLog: boolean;
  canSaveSettings: boolean;
  hasAdvancedAnalytics: boolean;
  /** Max analytics window the UI may render, in days. */
  analyticsPeriodDays: number;
};

const TRIAL: PlanCapabilities = {
  planId: null,
  planLabel: "Trial",
  hasActivePlan: false,
  maxQueuePageSize: 10,
  canBulkAct: false,
  canExportCsv: false,
  canUseAutomation: false,
  canUseAuditLog: false,
  canSaveSettings: false,
  hasAdvancedAnalytics: false,
  analyticsPeriodDays: 7,
};

const CAPABILITIES_BY_PLAN: Record<PlanId, PlanCapabilities> = {
  [PLAN_STARTER]: {
    planId: PLAN_STARTER,
    planLabel: "Starter",
    hasActivePlan: true,
    maxQueuePageSize: 25,
    canBulkAct: false,
    canExportCsv: true,
    canUseAutomation: false,
    canUseAuditLog: false,
    canSaveSettings: true,
    hasAdvancedAnalytics: false,
    analyticsPeriodDays: 7,
  },
  [PLAN_GROWTH]: {
    planId: PLAN_GROWTH,
    planLabel: "Growth",
    hasActivePlan: true,
    maxQueuePageSize: 100,
    canBulkAct: true,
    canExportCsv: true,
    canUseAutomation: true,
    canUseAuditLog: true,
    canSaveSettings: true,
    hasAdvancedAnalytics: false,
    analyticsPeriodDays: 30,
  },
  [PLAN_SCALE]: {
    planId: PLAN_SCALE,
    planLabel: "Scale",
    hasActivePlan: true,
    maxQueuePageSize: 100,
    canBulkAct: true,
    canExportCsv: true,
    canUseAutomation: true,
    canUseAuditLog: true,
    canSaveSettings: true,
    hasAdvancedAnalytics: true,
    analyticsPeriodDays: 90,
  },
};

export function getCapabilities(
  planId: PlanId | null,
  hasActivePayment: boolean,
): PlanCapabilities {
  if (!hasActivePayment || !planId) return TRIAL;
  return CAPABILITIES_BY_PLAN[planId] ?? TRIAL;
}

export function isFeatureAvailable(
  capabilities: PlanCapabilities,
  feature:
    | "bulk"
    | "export"
    | "automation"
    | "auditLog"
    | "saveSettings"
    | "advancedAnalytics",
): boolean {
  switch (feature) {
    case "bulk":
      return capabilities.canBulkAct;
    case "export":
      return capabilities.canExportCsv;
    case "automation":
      return capabilities.canUseAutomation;
    case "auditLog":
      return capabilities.canUseAuditLog;
    case "saveSettings":
      return capabilities.canSaveSettings;
    case "advancedAnalytics":
      return capabilities.hasAdvancedAnalytics;
  }
}

export function describeRequiredPlan(
  feature:
    | "bulk"
    | "export"
    | "automation"
    | "auditLog"
    | "saveSettings"
    | "advancedAnalytics",
): string {
  switch (feature) {
    case "bulk":
    case "automation":
    case "auditLog":
      return "Growth or Scale";
    case "advancedAnalytics":
      return "Scale";
    case "export":
    case "saveSettings":
      return "any paid plan";
  }
}
