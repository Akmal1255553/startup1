import { createCookie } from "@remix-run/node";

import type { Locale } from "./types";
import { isLocale } from "./types";

export const localeCookie = createCookie("rg_locale", {
  path: "/",
  sameSite: "lax",
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 365,
  secure: process.env.NODE_ENV === "production",
});

export async function readLocaleCookie(
  cookieHeader: string | null,
): Promise<Locale | null> {
  if (!cookieHeader) return null;
  const raw = await localeCookie.parse(cookieHeader);
  if (typeof raw === "string" && isLocale(raw)) return raw;
  return null;
}

/** Same-origin path only (prevents open redirects). */
export function sanitizeInternalRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw;
}
