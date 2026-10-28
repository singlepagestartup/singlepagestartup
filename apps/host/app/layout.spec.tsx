/**
 * BDD Suite: root response preflight.
 * Given: the middleware supplies the requested path and the Page API resolves it.
 * When: RootLayout prepares the HTML shell.
 * Then: absence or upstream failure is settled before streaming, and html uses the requested language.
 */
import { headers } from "next/headers";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import RootLayout from "./layout";

jest.mock("../styles/fonts.css", () => ({}));
jest.mock("../styles/tailwind.css", () => ({}));
jest.mock("./fonts", () => ({
  fonts: {
    defaultFont: { variable: "default" },
    primaryFont: { variable: "primary" },
  },
}));
jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { findByUrl: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "en" }, { code: "ru" }],
    defaultLanguage: { code: "en" },
  },
}));
jest.mock("@sps/ui-adapter/toast", () => ({ Toaster: () => null }));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("../src/components/revalidation", () => ({ Component: () => null }));
jest.mock("@sps/shared-third-parties", () => ({ YandexMetrika: () => null }));
jest.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: () => null,
  GoogleTagManager: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  (headers as jest.Mock).mockResolvedValue(
    new Headers({ "x-sps-pathname": "/ru/blog/articles/example" }),
  );
  (pageApi.findByUrl as jest.Mock).mockResolvedValue({ id: "page-1" });
});

it("resolves the page before returning a Russian HTML shell", async () => {
  const result = await RootLayout({ children: <main>Article</main> });
  expect(pageApi.findByUrl).toHaveBeenCalledWith({
    url: "/blog/articles/example",
    language: "ru",
    silentNotFound: true,
  });
  expect(result.type).toBe("html");
  expect(result.props.lang).toBe("ru");
});

it("rejects a missing page before returning HTML", async () => {
  (pageApi.findByUrl as jest.Mock).mockResolvedValue(undefined);
  await expect(RootLayout({ children: null })).rejects.toThrow("404");
});

it("preserves upstream errors", async () => {
  (pageApi.findByUrl as jest.Mock).mockRejectedValue(
    new Error("upstream unavailable"),
  );
  await expect(RootLayout({ children: null })).rejects.toThrow(
    "upstream unavailable",
  );
});

it("allows the separately routed admin without a Page record", async () => {
  (headers as jest.Mock).mockResolvedValue(
    new Headers({ "x-sps-pathname": "/en/admin" }),
  );
  const result = await RootLayout({ children: null });
  expect(result.props.lang).toBe("en");
  expect(pageApi.findByUrl).not.toHaveBeenCalled();
});
