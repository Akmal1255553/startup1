import { expect, it, vi } from "vitest";
import prisma from "../db.server";
import { loadReturnRiskData } from "./return-risk.server";

vi.mock("../db.server", () => ({
  default: { returnRiskSetting: { upsert: vi.fn() } },
}));

it("does not repeat a failed settings lookup or expose its internal error", async () => {
  vi.mocked(prisma.returnRiskSetting.upsert).mockRejectedValue(new Error("private database connection details"));
  const admin = { graphql: vi.fn() };
  const data = await loadReturnRiskData(admin, "test.myshopify.com");
  expect(prisma.returnRiskSetting.upsert).toHaveBeenCalledTimes(1);
  expect(admin.graphql).not.toHaveBeenCalled();
  expect(data.error).toBe("Dashboard data is temporarily unavailable. Please try again shortly.");
  expect(data.orders).toEqual([]);
});
