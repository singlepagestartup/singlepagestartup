import { Service } from "./authors";

const ids = {
  human: "61ed455d-8cce-458f-9992-a12e1fcb449a",
  editorial: "71ed455d-8cce-458f-9992-a12e1fcb449a",
  ai: "81ed455d-8cce-458f-9992-a12e1fcb449a",
  empty: "91ed455d-8cce-458f-9992-a12e1fcb449a",
  article: "a1ed455d-8cce-458f-9992-a12e1fcb449a",
  product: "b1ed455d-8cce-458f-9992-a12e1fcb449a",
};
function fixture() {
  const profiles = [
    {
      id: ids.human,
      variant: "telegram",
      slug: "subject-private-uuid",
      adminTitle: "private",
      allowedMcpServerIds: ["private-mcp"],
      title: { en: "Author" },
      subtitle: {},
      description: {},
    },
    {
      id: ids.editorial,
      variant: "default",
      slug: "editorial",
      title: { en: "Editorial" },
      subtitle: {},
      description: {},
    },
    {
      id: ids.ai,
      variant: "artificial-intelligence",
      title: { en: "Private project" },
    },
    { id: ids.empty, variant: "default", title: { en: "Not published" } },
  ];
  const dependencies = {
    profile: { find: jest.fn(async () => profiles) },
    article: {
      find: jest.fn(async () => [
        {
          id: ids.article,
          slug: "saved-article",
          title: {},
          subtitle: {},
          createdAt: new Date(),
        },
      ]),
    },
    product: {
      find: jest.fn(async () => [
        {
          id: ids.product,
          slug: "saved-product",
          title: {},
          shortDescription: {},
          type: "one_off",
        },
      ]),
    },
    file: {
      findById: jest.fn(async () => ({
        id: "avatar",
        file: "/avatar.png",
        mimeType: "image/png",
        extension: "png",
        width: 200,
        height: 200,
        alt: {},
        adminTitle: "private-file-label",
      })),
    },
    profilesToFiles: {
      find: jest.fn(async () => [
        {
          profileId: ids.human,
          fileStorageModuleFileId: "avatar",
          orderIndex: 0,
        },
      ]),
    },
    profilesToArticles: {
      find: jest.fn(async () =>
        [ids.human, ids.editorial, ids.ai].map((profileId, index) => ({
          id: `article-link-${index}`,
          profileId,
          blogModuleArticleId: ids.article,
          orderIndex: 0,
        })),
      ),
    },
    profilesToProducts: {
      find: jest.fn(async () => [
        {
          id: "project-link",
          profileId: ids.human,
          ecommerceModuleProductId: ids.product,
          orderIndex: 0,
        },
      ]),
    },
  };
  return { dependencies, service: new Service(dependencies as any) };
}

it("publishes only supported Profiles with explicit public work and strips private fields", async () => {
  const { service } = fixture();
  const authors = await service.find();
  expect(authors.map((author) => author.id)).toEqual([
    ids.human,
    ids.editorial,
  ]);
  expect(JSON.stringify(authors)).not.toMatch(
    /subject-private|private-mcp|adminTitle|allowedMcpServerIds/,
  );
  expect(authors[0].avatar).toEqual(
    expect.objectContaining({ id: "avatar", file: "/avatar.png" }),
  );
  expect(Object.keys(authors[0])).toEqual([
    "id",
    "title",
    "subtitle",
    "avatar",
    "description",
    "articleCount",
    "productCount",
  ]);
});

it("uses the same filtered eligibility for count before pagination", async () => {
  const { service } = fixture();
  expect(await service.count()).toBe(2);
  expect(await service.find({ limit: 1, offset: 1 })).toEqual([
    expect.objectContaining({ id: ids.editorial }),
  ]);
  expect(await service.count({ ecommerceModuleProductId: ids.product })).toBe(
    1,
  );
  expect(await service.count({ profileId: ids.empty })).toBe(0);
  expect(await service.findById({ id: ids.ai })).toBeNull();
});

it("returns only linked Article and Product references and accepts UUID handles only", async () => {
  const { service } = fixture();
  const author = await service.findById({ id: ids.human });
  expect(author?.articles.map((article) => article.id)).toEqual([ids.article]);
  expect(author?.products.map((product) => product.id)).toEqual([ids.product]);
  expect(author).not.toHaveProperty("slug");
  await expect(
    service.findById({ id: "subject-private-uuid" }),
  ).rejects.toThrow("Invalid author resource");
  await expect(service.find({ filters: {} } as any)).rejects.toThrow(
    "Unsupported author filter",
  );
});

it("does not treat content or association variants as publication permissions", async () => {
  const { service, dependencies } = fixture();
  dependencies.article.find.mockResolvedValue([
    { id: ids.article, variant: "hidden" },
  ] as any);
  dependencies.profilesToProducts.find.mockResolvedValue([
    {
      profileId: ids.human,
      ecommerceModuleProductId: ids.product,
      variant: "hidden",
    },
  ] as any);
  expect((await service.find()).map((profile) => profile.id)).toContain(
    ids.human,
  );
  expect(await service.count()).toBeGreaterThan(0);
});
it.each(["file", "link"])(
  "retains an avatar with variant hidden on its %s",
  async (target) => {
    const { service, dependencies } = fixture();
    if (target === "file")
      dependencies.file.findById.mockResolvedValue({
        id: "avatar",
        file: "/avatar.png",
        mimeType: "image/png",
        variant: "hidden",
      } as any);
    else
      dependencies.profilesToFiles.find.mockResolvedValue([
        {
          profileId: ids.human,
          fileStorageModuleFileId: "avatar",
          variant: "hidden",
        },
      ] as any);
    expect((await service.find())[0].avatar).toMatchObject({ id: "avatar" });
  },
);
it("publishes only the validated SEO section from Profile JSON", async () => {
  const { service, dependencies } = fixture();
  const profiles = await dependencies.profile.find();
  (profiles[0] as any).metadata = {
    seo: { keywords: { en: ["author"] } },
    campaign: { internalNote: "not-public" },
  };
  const author = (await service.find())[0];
  expect(author.metadata).toEqual({ seo: { keywords: { en: ["author"] } } });
  expect(JSON.stringify(author)).not.toContain("not-public");
});
