import { beforeEach, describe, expect, it, vi } from "vitest";
import { readLocaleCookie } from "./locale-cookie.server";
import { readShopLocale } from "./shop-locale.server";
import { resolveLocale } from "./resolver.server";

vi.mock("./locale-cookie.server", () => ({ readLocaleCookie: vi.fn() }));
vi.mock("./shop-locale.server", () => ({
  readShopLocale: vi.fn(),
  shopFromRequestUrl: (url: URL) => url.searchParams.get("shop"),
}));

const request = () => new Request("https://app.test/app?shop=test.myshopify.com");

describe("locale recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readLocaleCookie).mockResolvedValue(null);
  });

  it("keeps the page available when the locale database query fails", async () => {
    vi.mocked(readShopLocale).mockRejectedValue(new Error("database unavailable"));
    await expect(resolveLocale(request())).resolves.toBe("en");
    expect(readShopLocale).toHaveBeenCalledTimes(1);
  });

  it("does not requery a session with no saved language", async () => {
    await expect(resolveLocale(request(), { sessionLocale: null })).resolves.toBe("en");
    expect(readShopLocale).not.toHaveBeenCalled();
  });

  it("loads the saved language when no session was provided", async () => {
    vi.mocked(readShopLocale).mockResolvedValue("ru");
    await expect(resolveLocale(request())).resolves.toBe("ru");
  });

  it("prioritizes the language cookie without a database query", async () => {
    vi.mocked(readLocaleCookie).mockResolvedValue("de");
    await expect(resolveLocale(request(), { sessionLocale: "ru" })).resolves.toBe("de");
    expect(readShopLocale).not.toHaveBeenCalled();
  });
});
