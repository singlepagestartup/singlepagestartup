import { generatePageSeo, resolvePageSeo } from "./index";
import { resolveSeo, preview } from "../seo";
jest.mock("../seo", () => ({ resolveSeo: jest.fn(), preview: jest.fn() }));
jest.mock("@sps/shared-configuration", () => ({
  internationalization: {
    languages: [{ code: "en" }, { code: "ru" }],
    defaultLanguage: { code: "en" },
  },
}));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
jest.mock("react", () => ({ cache: (fn: unknown) => fn }));
const result = {
  page: { id: "page-id" },
  metadata: { metadataBase: "https://example.com", title: "Title" },
  structuredData: [],
};
beforeEach(() => jest.resetAllMocks());
it("adapts the API result to Next Metadata and preserves already resolved path segments", async () => {
  jest.mocked(resolveSeo).mockResolvedValue(result as any);
  const seo = await resolvePageSeo("/ru", "ru");
  expect(resolveSeo).toHaveBeenCalledWith({ url: "/ru", language: "ru" });
  expect(seo.page).toBe(result.page);
  expect(seo.metadata.metadataBase).toBeInstanceOf(URL);
});
it("keeps compatibility locale parsing and sends drafts through the API preview SDK", async () => {
  jest.mocked(resolveSeo).mockResolvedValue(result as any);
  await generatePageSeo({ url: "/ru/about" });
  expect(resolveSeo).toHaveBeenCalledWith({
    url: "/about",
    language: "ru",
    options: undefined,
  });
  jest.mocked(preview).mockResolvedValue(result as any);
  await generatePageSeo({
    url: "/ru/about",
    metadataDraft: { title: "Draft" },
  });
  expect(preview).toHaveBeenCalledWith({
    url: "/ru/about",
    language: "ru",
    metadata: { title: "Draft" },
  });
});
it("maps only a real upstream 404 to Next notFound", async () => {
  jest.mocked(resolveSeo).mockRejectedValueOnce({ status: 404 });
  await expect(resolvePageSeo("/missing", "ru")).rejects.toThrow(
    "NEXT_HTTP_ERROR_FALLBACK;404",
  );
  jest.mocked(resolveSeo).mockRejectedValueOnce(new Error("offline"));
  await expect(resolvePageSeo("/", "ru")).rejects.toThrow("offline");
});
