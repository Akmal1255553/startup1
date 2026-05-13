import { describe, expect, it } from "vitest";

import { PLAN_GROWTH, PLAN_SCALE, PLAN_STARTER } from "./plans";
import {
  describeRequiredPlan,
  getCapabilities,
  isFeatureAvailable,
} from "./capabilities";

describe("getCapabilities", () => {
  it("returns Trial caps when no active payment", () => {
    const caps = getCapabilities(null, false);
    expect(caps).toMatchObject({
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
    });
  });

  it("returns Trial caps when planId is set but payment inactive", () => {
    expect(getCapabilities(PLAN_GROWTH, false).planLabel).toBe("Trial");
  });

  it("returns Trial caps when payment active but planId is null", () => {
    expect(getCapabilities(null, true).planLabel).toBe("Trial");
  });

  it("returns Starter caps", () => {
    const caps = getCapabilities(PLAN_STARTER, true);
    expect(caps.planLabel).toBe("Starter");
    expect(caps.hasActivePlan).toBe(true);
    expect(caps.maxQueuePageSize).toBe(25);
    expect(caps.canExportCsv).toBe(true);
    expect(caps.canSaveSettings).toBe(true);
    expect(caps.canBulkAct).toBe(false);
    expect(caps.canUseAutomation).toBe(false);
    expect(caps.canUseAuditLog).toBe(false);
    expect(caps.analyticsPeriodDays).toBe(7);
  });

  it("returns Growth caps with bulk + automation + audit log", () => {
    const caps = getCapabilities(PLAN_GROWTH, true);
    expect(caps.planLabel).toBe("Growth");
    expect(caps.maxQueuePageSize).toBe(100);
    expect(caps.canBulkAct).toBe(true);
    expect(caps.canUseAutomation).toBe(true);
    expect(caps.canUseAuditLog).toBe(true);
    expect(caps.hasAdvancedAnalytics).toBe(false);
    expect(caps.analyticsPeriodDays).toBe(30);
  });

  it("returns Scale caps with advanced analytics", () => {
    const caps = getCapabilities(PLAN_SCALE, true);
    expect(caps.planLabel).toBe("Scale");
    expect(caps.hasAdvancedAnalytics).toBe(true);
    expect(caps.analyticsPeriodDays).toBe(90);
    expect(caps.canBulkAct).toBe(true);
    expect(caps.canUseAutomation).toBe(true);
    expect(caps.canUseAuditLog).toBe(true);
  });

  it("falls back to Trial caps for unknown plan id", () => {
    expect(
      getCapabilities("Mystery" as unknown as typeof PLAN_GROWTH, true)
        .planLabel,
    ).toBe("Trial");
  });
});

describe("isFeatureAvailable", () => {
  const starter = getCapabilities(PLAN_STARTER, true);
  const growth = getCapabilities(PLAN_GROWTH, true);
  const scale = getCapabilities(PLAN_SCALE, true);
  const trial = getCapabilities(null, false);

  it("gates bulk to Growth+", () => {
    expect(isFeatureAvailable(trial, "bulk")).toBe(false);
    expect(isFeatureAvailable(starter, "bulk")).toBe(false);
    expect(isFeatureAvailable(growth, "bulk")).toBe(true);
    expect(isFeatureAvailable(scale, "bulk")).toBe(true);
  });

  it("gates automation to Growth+", () => {
    expect(isFeatureAvailable(starter, "automation")).toBe(false);
    expect(isFeatureAvailable(growth, "automation")).toBe(true);
  });

  it("gates auditLog to Growth+", () => {
    expect(isFeatureAvailable(starter, "auditLog")).toBe(false);
    expect(isFeatureAvailable(growth, "auditLog")).toBe(true);
  });

  it("gates export to any paid plan (Starter+)", () => {
    expect(isFeatureAvailable(trial, "export")).toBe(false);
    expect(isFeatureAvailable(starter, "export")).toBe(true);
    expect(isFeatureAvailable(growth, "export")).toBe(true);
  });

  it("gates saveSettings to any paid plan (Starter+)", () => {
    expect(isFeatureAvailable(trial, "saveSettings")).toBe(false);
    expect(isFeatureAvailable(starter, "saveSettings")).toBe(true);
  });

  it("gates advancedAnalytics to Scale only", () => {
    expect(isFeatureAvailable(starter, "advancedAnalytics")).toBe(false);
    expect(isFeatureAvailable(growth, "advancedAnalytics")).toBe(false);
    expect(isFeatureAvailable(scale, "advancedAnalytics")).toBe(true);
  });
});

describe("describeRequiredPlan", () => {
  it("names Growth or Scale for collaborative features", () => {
    expect(describeRequiredPlan("bulk")).toBe("Growth or Scale");
    expect(describeRequiredPlan("automation")).toBe("Growth or Scale");
    expect(describeRequiredPlan("auditLog")).toBe("Growth or Scale");
  });

  it("names Scale for advancedAnalytics", () => {
    expect(describeRequiredPlan("advancedAnalytics")).toBe("Scale");
  });

  it("names any paid plan for base paid features", () => {
    expect(describeRequiredPlan("export")).toBe("any paid plan");
    expect(describeRequiredPlan("saveSettings")).toBe("any paid plan");
  });
});
