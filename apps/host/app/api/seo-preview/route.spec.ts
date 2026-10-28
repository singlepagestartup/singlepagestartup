/** @jest-environment node */
/** Given a metadata draft, preview only public routes without persisting data. */
import { POST } from "./route";
import { api as pages } from "@sps/host/models/page/sdk/server";
import { api as metadata } from "@sps/host/models/metadata/sdk/server";
jest.mock("@sps/host/models/page/sdk/server", () => ({
  api: { findByUrl: jest.fn() },
}));
jest.mock("@sps/host/models/metadata/sdk/server", () => ({
  api: { generatePageSeo: jest.fn() },
}));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "en" }, { code: "ru" }],
    defaultLanguage: { code: "en" },
  },
}));
const request = (data: unknown) =>
  new Request("http://localhost/api/seo-preview", {
    method: "POST",
    body: JSON.stringify(data),
  });
const draft = {
  url: "/ru/blog/one",
  language: "ru",
  metadata: { title: "[blog.articles.title]" },
};
beforeEach(() => {
  jest.resetAllMocks();
});
it("resolves the selected locale and unsaved masks without caching the result", async () => {
  const page = {
    id: "page",
    url: "/blog/[blog.articles.slug]",
    variant: "default",
  };
  jest.mocked(pages.findByUrl).mockResolvedValue(page as any);
  jest.mocked(metadata.generatePageSeo).mockResolvedValue({
    metadata: { title: "Статья" },
    structuredData: [],
    diagnostics: [],
  } as any);
  const response = await POST(request(draft));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-robots-tag")).toBe("noindex");
  expect(pages.findByUrl).toHaveBeenCalledWith({
    url: "/blog/one",
    language: "ru",
    silentNotFound: true,
  });
  expect(metadata.generatePageSeo).toHaveBeenCalledWith({
    url: "/blog/one",
    language: "ru",
    page,
    metadataDraft: draft.metadata,
  });
  expect((await response.json()).metadata.title).toBe("Статья");
});
it.each([
  undefined,
  { variant: "hidden", url: "/blog/one" },
  { variant: "default", url: "/admin" },
])("does not preview missing, hidden or private pages", async (page) => {
  jest.mocked(pages.findByUrl).mockResolvedValue(page as any);
  expect((await POST(request(draft))).status).toBe(404);
  expect(metadata.generatePageSeo).not.toHaveBeenCalled();
});
it("rejects unsupported locales and malformed masks before loading content", async () => {
  expect((await POST(request({ ...draft, language: "zz" }))).status).toBe(400);
  expect(
    (await POST(request({ ...draft, metadata: { title: "[invalid" } }))).status,
  ).toBe(400);
  expect(pages.findByUrl).not.toHaveBeenCalled();
});
it("reports invalid JSON, oversized input and upstream failures separately", async () => {
  expect(
    (await POST(new Request("http://localhost", { method: "POST", body: "{" })))
      .status,
  ).toBe(400);
  expect(
    (await POST(request({ ...draft, metadata: { title: "x".repeat(65536) } })))
      .status,
  ).toBe(413);
  jest.mocked(pages.findByUrl).mockRejectedValue(new Error("offline"));
  expect((await POST(request(draft))).status).toBe(503);
});
