import {
  entityMetadataSchema,
  metadataPathValue,
  parseMetadataReference,
  renderMetadataTemplate,
} from "./index";

describe("editable metadata contracts", () => {
  it("resolves named localized masks and preserves literal text", async () => {
    await expect(
      renderMetadataTemplate("[blog.articles.title] — Example", {
        language: "ru",
        resolve: () => ({ ru: "Статья", en: "Article" }),
      }),
    ).resolves.toBe("Статья — Example");
  });
  it("does not substitute another language or stringify missing fields", async () => {
    await expect(
      renderMetadataTemplate("[blog.articles.title]", {
        language: "ru",
        resolve: () => ({ en: "Article" }),
      }),
    ).rejects.toThrow("Missing");
  });
  it("keeps an explicit relation chain", () => {
    expect(
      parseMetadataReference(
        "blog.articles>blog.articles-to-file-storage-module-files>file-storage.files.file",
      ),
    ).toEqual({
      source: "blog.articles",
      relations: ["blog.articles-to-file-storage-module-files"],
      target: "file-storage.files",
      path: ["file"],
    });
  });
  it.each([
    "[broken",
    "[blog.articles.title]]",
    "[blog.articles.__proto__]",
    "[blog.articles>file-storage.files.file]",
  ])("rejects malformed or unsafe mask %s", async (template) => {
    await expect(
      renderMetadataTemplate(template, {
        language: "en",
        resolve: () => "value",
      }),
    ).rejects.toThrow();
  });
  it("formats keywords as a list without duplicate words", async () => {
    await expect(
      renderMetadataTemplate("[blog.articles.metadata.seo.keywords]", {
        language: "en",
        list: true,
        resolve: () => [" guide ", "guide", "property"],
      }),
    ).resolves.toBe("guide, property");
  });
  it("only reads own JSON properties", () => {
    expect(
      metadataPathValue(Object.create({ title: "secret" }), ["title"], "en"),
    ).toBeUndefined();
  });
  it("preserves non-SEO JSON sections while validating localized SEO values", () => {
    const value = {
      seo: { keywords: { ru: ["статья"] } },
      attributes: { size: 24 },
    };
    expect(entityMetadataSchema.parse(value)).toEqual(value);
    expect(
      entityMetadataSchema.safeParse({ seo: { keywords: { en: "invalid" } } })
        .success,
    ).toBe(false);
    expect(
      entityMetadataSchema.safeParse({ seo: { title: { en: 1 } } }).success,
    ).toBe(false);
  });
  it("rejects excessively large, deep or unsafe JSON", () => {
    expect(
      entityMetadataSchema.safeParse({ data: "x".repeat(65536) }).success,
    ).toBe(false);
    let deep: unknown = {};
    for (let i = 0; i < 12; i++) deep = { data: deep };
    expect(entityMetadataSchema.safeParse(deep).success).toBe(false);
    expect(
      entityMetadataSchema.safeParse(JSON.parse('{"__proto__":{"secret":1}}'))
        .success,
    ).toBe(false);
  });
});
