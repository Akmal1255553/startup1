export type ReturnReasonCategory =
  | "sizing"
  | "damaged"
  | "notAsDescribed"
  | "changedMind"
  | "lateDelivery"
  | "other";

export type ProductRiskLevel = "low" | "medium" | "high";

export type ReasonBreakdown = Record<ReturnReasonCategory, number>;

export type ReasonStat = {
  count: number;
  percentage: number;
};

export type ReturnReasonAnalysis = {
  sizing: ReasonStat;
  damaged: ReasonStat;
  notAsDescribed: ReasonStat;
  changedMind: ReasonStat;
  lateDelivery: ReasonStat;
  other: ReasonStat;
  total: number;
};

export type ProductTrendPoint = {
  date: string;
  count: number;
};

export type ProductReturnRow = {
  productId: string;
  productTitle: string;
  sku: string | null;
  ordersCount: number;
  returnsCount: number;
  returnRate: number;
  revenueLost: number;
  revenueAtRisk: number;
  revenueRecoverable: number;
  riskScore: number;
  riskLevel: ProductRiskLevel;
  customerComplaints: number;
  reasonBreakdown: ReasonBreakdown;
  returnTrend: ProductTrendPoint[];
  currencyCode: string;
};

export type ProductRecommendation = {
  id: string;
  productId: string;
  productTitle: string;
  severity: "info" | "attention" | "critical";
  title: string;
  message: string;
};

export type ProductIntelligenceSummary = {
  totalProducts: number;
  productsWithReturns: number;
  averageReturnRate: number;
  estimatedRevenueLost: number;
  estimatedRevenueSaved: number;
  revenueAtRisk: number;
  revenueRecoverable: number;
  currencyCode: string;
  reasonAnalysis: ReturnReasonAnalysis;
};

export type ProductIntelligencePage = {
  summary: ProductIntelligenceSummary;
  products: ProductReturnRow[];
  allProducts: ProductReturnRow[];
  recommendations: ProductRecommendation[];
  insights: import("./ai-insights.server").Insight[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort: ProductSortField;
  sortDirection: "asc" | "desc";
  query: string;
  error: string | null;
};

export type ProductSortField =
  | "productTitle"
  | "returnsCount"
  | "returnRate"
  | "revenueLost"
  | "riskScore"
  | "ordersCount";

export type ProductIntelligenceQuery = {
  page?: number;
  pageSize?: number;
  sort?: ProductSortField;
  sortDirection?: "asc" | "desc";
  query?: string;
};
