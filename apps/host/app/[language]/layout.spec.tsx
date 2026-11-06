/**
 * BDD Suite: root document language.
 * Given: the route supplies the requested locale.
 * When: RootLayout prepares the HTML shell.
 * Then: the HTML document uses the requested language.
 */
import RootLayout from "./layout";

jest.mock("../../styles/fonts.css", () => ({}));
jest.mock("../../styles/tailwind.css", () => ({}));
jest.mock("../fonts", () => ({
  fonts: {
    defaultFont: { variable: "default" },
    primaryFont: { variable: "primary" },
  },
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
jest.mock("../../src/components/revalidation", () => ({
  Component: () => null,
}));
jest.mock("@sps/shared-third-parties", () => ({ YandexMetrika: () => null }));
jest.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: () => null,
  GoogleTagManager: () => null,
}));

it("returns a Russian HTML shell for a localized path", async () => {
  const result = await RootLayout({
    children: <main>Article</main>,
    params: Promise.resolve({ language: "ru" }),
  });
  expect(result.type).toBe("html");
  expect(result.props.lang).toBe("ru");
});

it("allows the separately routed admin without a Page record", async () => {
  const result = await RootLayout({
    children: null,
    params: Promise.resolve({ language: "en" }),
  });
  expect(result.props.lang).toBe("en");
});
