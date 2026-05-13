import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";

import type { ExportCsvResponse } from "../routes/app.export.csv";

/**
 * Trigger a CSV download from inside the embedded admin.
 *
 * Pattern:
 *   - `fetcher.load("/app/export/csv")` runs the resource route *with*
 *     the active embedded session token, so auth Just Works.
 *   - When the response arrives, we create a Blob and click a hidden
 *     `<a download>` so the browser actually saves the file.
 *
 * Returns:
 *   - `exportCsv()` — call to start the download.
 *   - `isExporting` — true while the request is in flight (use this on
 *     the button's `loading` prop).
 *   - `needsUpgrade` — server told us the current plan doesn't allow CSV
 *     export. UI can show an "Upgrade to Starter+" hint or redirect to
 *     /app/billing.
 */
export function useCsvExport() {
  const fetcher = useFetcher<ExportCsvResponse>();
  // Track which response we already turned into a download, so a fetcher
  // revalidation doesn't trigger the same download twice.
  const lastHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;

    const data = fetcher.data;
    if (data.ok === false) return;

    const fingerprint = `${data.filename}:${data.csv.length}`;
    if (lastHandledRef.current === fingerprint) return;
    lastHandledRef.current = fingerprint;

    const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Slight delay so Firefox doesn't cancel the download by revoking too early.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [fetcher.state, fetcher.data]);

  const isExporting = fetcher.state !== "idle";
  const needsUpgrade =
    fetcher.state === "idle" &&
    fetcher.data?.ok === false &&
    fetcher.data.error === "upgrade-required";

  const exportCsv = () => {
    lastHandledRef.current = null;
    fetcher.load("/app/export/csv");
  };

  return { exportCsv, isExporting, needsUpgrade };
}
