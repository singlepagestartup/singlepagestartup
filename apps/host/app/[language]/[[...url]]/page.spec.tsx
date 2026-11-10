/**
 * BDD Suite: public Host route delegation.
 * Given: a locale and a concrete path.
 * When: Next prepares metadata or renders a route.
 * Then: model readers own document data and unsupported locales return 404.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import Page, {
  revalidate,
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from "./page";
jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { resolvePageSeo: jest.fn(), find: jest.fn() },
}));
jest.mock("@sps/website-builder/models/widget/frontend/component", () => ({
  Component: ({ variant, children }: any) => (
    <main data-variant={variant}>{children}</main>
  ),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ mode, language }: any) => (
    <form aria-label={mode} lang={language} />
  ),
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: { languages: [{ code: "en" }, { code: "ru" }] },
}));
jest.mock("@sps/host/models/page/frontend/component", () => ({
  Component: ({ variant, url, language }: any) => (
    <main data-variant={variant} lang={language}>
      {url}
    </main>
  ),
}));
jest.mock("../../../src/components/admin", () => ({ Component: () => null }));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
const request = (language: string, url: string[] = []) => ({
  params: Promise.resolve({ language, url }),
});
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(pageApi.resolvePageSeo)
    .mockResolvedValue({ metadata: { title: "SEO" } } as any);
});
it("enables on-demand ISR without enumerating all user-owned entities", async () => {
  expect(revalidate).toBe(3600);
  expect(dynamicParams).toBe(true);
  expect(await generateStaticParams()).toEqual([]);
});
it("delegates localized SEO to its model SDK", async () => {
  expect(await generateMetadata(request("ru", ["blog", "example"]))).toEqual({
    title: "SEO",
  });
  expect(pageApi.resolvePageSeo).toHaveBeenCalledWith("/ru/blog/example");
});
it("renders the document model with explicit route inputs", async () => {
  const html = renderToStaticMarkup(await Page(request("en", ["about"])));
  expect(html).toContain('data-variant="document"');
  expect(html).toContain('lang="en"');
  expect(html).toContain("/about");
});
it("rejects unsupported locales before reading SEO", async () => {
  await expect(generateMetadata(request("zz"))).rejects.toThrow("404");
  await expect(Page(request("zz"))).rejects.toThrow("404");
  expect(pageApi.resolvePageSeo).not.toHaveBeenCalled();
});

it("preserves Next-escaped delimiters without encoding them a second time", async () => {
  await generateMetadata(request("ru", ["blog", "a%2Fb"]));
  expect(pageApi.resolvePageSeo).toHaveBeenCalledWith("/ru/blog/a%2Fb");
});

it.each([
  ["", "authentication"],
  ["/registration", "registration"],
  ["/forgot-password", "forgot-password"],
  ["/reset-password", "reset-password"],
])(
  "provides the public form at %s when there is no saved Host Page",
  async (suffix, action) => {
    jest.mocked(pageApi.find).mockResolvedValue([]);
    const route = request(
      "en",
      ("rbac/subject/authentication/email-and-password" + suffix).split("/"),
    );
    const html = renderToStaticMarkup(await Page(route));
    expect(html).toContain('data-variant="authentication-page-default"');
    expect(html).toContain(`aria-label="${action}"`);
    expect(await generateMetadata(route)).toEqual({
      robots: { index: false, follow: false },
    });
  },
);

it("preserves a project's saved authentication page and SEO", async () => {
  jest.mocked(pageApi.find).mockResolvedValue([{ id: "project-page" }] as any);
  const route = request("en", [
    "rbac",
    "subject",
    "authentication",
    "email-and-password",
  ]);
  expect(renderToStaticMarkup(await Page(route))).toContain(
    'data-variant="document"',
  );
  expect(await generateMetadata(route)).toEqual({ title: "SEO" });
});
