import type { LoaderFunctionArgs } from "@remix-run/node";

import { authenticate } from "../shopify.server";
import { loadReturnRiskData } from "../models/return-risk.server";
import { loadCapabilities } from "../models/plan-gating.server";

export type ExportCsvResponse =
  | { ok: true; csv: string; filename: string }
  | { ok: false; error: "upgrade-required" };

/**
 * Returns the CSV body wrapped in JSON instead of as a `text/csv`
 * attachment Response.
 *
 * Why: in Shopify's embedded admin, opening a URL in a new tab loses the
 * App Bridge session context, so `authenticate.admin` triggers an OAuth
 * dance that never lands back on this route — the user just sees the
 * /app dashboard and no file ever downloads. Calling this route via
 * `useFetcher().load("/app/export/csv")` *inside* the embedded session
 * works correctly because the active session token is sent automatically.
 * The dashboard page then turns the returned `csv` field into a Blob and
 * triggers the actual download client-side.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const capabilities = await loadCapabilities(billing);
  if (!capabilities.canExportCsv) {
    return { ok: false, error: "upgrade-required" } satisfies ExportCsvResponse;
  }
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

  return {
    ok: true,
    csv,
    filename: "returnguard-risk-report.csv",
  } satisfies ExportCsvResponse;
};

function escapeCsv(value: string) {
  const escaped = value.replace(/"/g, '""');

  return `"${escaped}"`;
}
