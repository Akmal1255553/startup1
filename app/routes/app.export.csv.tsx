import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import { loadReturnRiskData } from "../models/return-risk.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const data = await loadReturnRiskData(admin, session.shop);
  const csv = [
    [
      "order",
      "customer",
      "value",
      "currency",
      "risk",
      "recommendation",
      "decision",
      "financial_status",
      "fulfillment_status",
      "factors",
    ],
    ...data.orders.map((order) => [
      order.name,
      order.customer,
      String(order.value),
      order.currencyCode,
      String(order.risk),
      order.recommendation,
      order.savedDecision || "",
      order.financialStatus,
      order.fulfillmentStatus,
      order.factors.join("; "),
    ]),
  ]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Disposition":
        'attachment; filename="returnguard-risk-report.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
};

function escapeCsv(value: string) {
  const escaped = value.replace(/"/g, '""');

  return `"${escaped}"`;
}
