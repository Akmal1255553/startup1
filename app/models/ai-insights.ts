export type InsightSeverity = "success" | "info" | "attention" | "critical";

export type Insight = {
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  cta?: { label: string; url: string };
};
