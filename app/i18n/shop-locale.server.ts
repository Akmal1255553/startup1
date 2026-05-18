import prisma from "../db.server";
import type { Locale } from "./types";
import { isLocale } from "./types";

/** Parse `shop` from an internal redirect path like `/app?shop=…&host=…`. */
export function shopFromInternalPath(path: string): string | null {
  try {
    const u = new URL(path, "https://app.local");
    return u.searchParams.get("shop");
  } catch {
    return null;
  }
}

export function shopFromRequestUrl(url: URL): string | null {
  return (
    url.searchParams.get("shop") ??
    shopFromInternalPath(
      url.searchParams.get("redirect") ?? "",
    )
  );
}

export async function readShopLocale(shop: string): Promise<Locale | null> {
  const row = await prisma.session.findFirst({
    where: { shop },
    select: { locale: true },
    orderBy: [{ isOnline: "desc" }, { expires: "desc" }],
  });
  const raw = row?.locale;
  if (typeof raw === "string" && isLocale(raw)) return raw;
  return null;
}

/** Persist UI language for all sessions of this shop (embedded iframe-safe). */
export async function persistShopLocale(
  shop: string,
  locale: Locale,
): Promise<void> {
  await prisma.session.updateMany({
    where: { shop },
    data: { locale },
  });
}
