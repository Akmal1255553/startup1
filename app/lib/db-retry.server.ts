/** Prisma / Postgres errors that are often transient on serverless (cold start, pool). */
const TRANSIENT_DB_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
]);

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  if (TRANSIENT_DB_CODES.has(code)) return true;
  const message =
    error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection pool timeout") ||
    message.includes("Server has closed the connection") ||
    message.includes("ECONNRESET") ||
    message.includes("ENOTFOUND")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry short-lived DB failures (common on Vercel + Supabase pooler). */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || i === attempts - 1) {
        throw error;
      }
      await sleep(100 * (i + 1));
    }
  }
  throw lastError;
}
