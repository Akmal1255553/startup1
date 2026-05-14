import type { Locale } from "./types";
import { isLocale } from "./types";
import { readLocaleCookie } from "./locale-cookie.server";

function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const parts = header.split(",").map((p) => p.trim().split(";")[0]?.toLowerCase());
  for (const part of parts) {
    if (!part) continue;
    const base = part.split("-")[0] ?? part;
    const candidates: string[] = [part.replace("_", "-")];
    if (part === "pt-br" || part.startsWith("pt-br")) candidates.push("pt-BR");
    if (base === "pt") candidates.push("pt-BR");
    candidates.push(base);
    for (const c of candidates) {
      if (isLocale(c)) return c;
    }
    if (base === "ru" && isLocale("ru")) return "ru";
    if (base === "en" && isLocale("en")) return "en";
    if (base === "es" && isLocale("es")) return "es";
    if (base === "de" && isLocale("de")) return "de";
    if (base === "fr" && isLocale("fr")) return "fr";
    if (base === "ja" && isLocale("ja")) return "ja";
    if (base === "it" && isLocale("it")) return "it";
    if (base === "nl" && isLocale("nl")) return "nl";
    if (base === "ko" && isLocale("ko")) return "ko";
  }
  return null;
}

export async function resolveLocale(request: Request): Promise<Locale> {
  const fromCookie = await readLocaleCookie(request.headers.get("Cookie"));
  if (fromCookie) return fromCookie;
  const fromHeader = localeFromAcceptLanguage(
    request.headers.get("Accept-Language"),
  );
  if (fromHeader) return fromHeader;
  return "en";
}
