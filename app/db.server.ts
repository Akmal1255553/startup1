import { PrismaClient } from "@prisma/client";

import { withDbRetry } from "./lib/db-retry.server";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
}

function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "15");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "10");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  const url = resolveDatabaseUrl();
  const base = new PrismaClient(
    url ? { datasources: { db: { url } } } : undefined,
  );

  return base.$extends({
    name: "dbRetry",
    query: {
      $allOperations({ args, query }) {
        return withDbRetry(() => query(args));
      },
    },
  });
}

const prisma = global.prismaGlobal ?? createPrismaClient();

global.prismaGlobal = prisma;

export default prisma;
