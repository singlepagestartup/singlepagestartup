/**
 * BDD Suite: Page resolution and public URL enumeration.
 * Given: public content Pages and private application masks.
 * When: the service resolves routes or lists sitemap candidates.
 * Then: parameters remain exact and only public masks are expanded.
 */
import { Service } from "./index";
import { api as profilesApi } from "@sps/social/models/profile/sdk/server";
jest.mock("@sps/social/models/profile/sdk/server", () => ({
  api: { authorFind: jest.fn() },
}));

jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "test-only-secret",
}));

it("returns null for a route without the requested profile segment", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findByUrl = jest.fn(async () => ({
    url: "/ai-chat/projects",
  })) as any;
  await expect(
    service.urlSegmentValue({
      url: "/ai-chat/projects",
      segment: "social.profiles.id",
    }),
  ).resolves.toBeNull();
});

it("keeps the actual profile segment on project routes", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findByUrl = jest.fn(async () => ({
    url: "/ai-chat/social/profiles/[social.profiles.id]",
  })) as any;
  await expect(
    service.urlSegmentValue({
      url: "/ai-chat/social/profiles/profile",
      segment: "social.profiles.id",
    }),
  ).resolves.toBe("profile");
});

it("returns all keys with the resolved page without a second lookup", async () => {
  const service = Object.create(Service.prototype) as Service;
  const page = {
    id: "page",
    language: "en",
    url: "/chats/[social.chats.id]/threads/[social.threads.id]",
  };
  service.find = jest.fn(async () => [page]) as any;
  service.withUrls = jest.fn(async () => ({
    ...page,
    urls: [{ url: "/chats/c/threads/t" }],
  })) as any;
  service.findById = jest.fn(async () => page) as any;
  (service as any).fetchAllModuleEntities = jest.fn(async ({ filters }) => [
    { id: filters[0].value },
  ]);
  await expect(
    service.findByUrl({ url: "/chats/c/threads/t", language: "en" }),
  ).resolves.toEqual({
    ...page,
    routeParams: { "social.chats.id": "c", "social.threads.id": "t" },
  });
  expect(service.withUrls).not.toHaveBeenCalled();
});
it("does not interpret an unrelated missing key as pagination", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findByUrl = jest.fn(async () => ({
    url: "/blog/[blog.articles.:pagination:10]",
  })) as any;
  await expect(
    service.urlSegmentValue({ url: "/blog", segment: "social.profiles.id" }),
  ).resolves.toBeNull();
});

it("excludes private and unknown masks before any privileged expansion", async () => {
  const service = Object.create(Service.prototype) as Service;
  const pages = [
    { id: "home", url: "/", language: "ru" },
    { id: "article", url: "/blog/[blog.articles.slug]", language: "ru" },
    { id: "auth", url: "/rbac/subject/authentication/logout", language: "en" },
    { id: "private", url: "/social/chats/[social.chats.id]", language: "en" },
    { id: "unknown", url: "/custom/[unknown.entities.slug]", language: "en" },
    { id: "error", url: "/404", language: "en" },
  ];
  service.find = jest.fn(async () => pages) as any;
  service.withUrls = jest.fn(async ({ id }) => ({
    ...pages.find((page) => page.id === id),
    urls:
      id === "home"
        ? [{ url: "/" }]
        : [{ url: "/blog/article" }, { url: "/blog/article" }],
  })) as any;
  await expect(service.urls()).resolves.toEqual([
    { url: "/", language: "ru" },
    { url: "/blog/article", language: "ru" },
  ]);
  expect(service.withUrls).toHaveBeenCalledTimes(2);
  expect(service.withUrls).toHaveBeenNthCalledWith(1, {
    id: "home",
    publicOnly: true,
    maxUrls: 1_000_000,
  });
  expect(service.withUrls).toHaveBeenNthCalledWith(2, {
    id: "article",
    publicOnly: true,
    maxUrls: 1_000_000,
  });
});

it("propagates a public collection error instead of returning a partial sitemap", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.find = jest.fn(async () => [
    { id: "articles", url: "/blog/[blog.articles.slug]", language: "ru" },
  ]) as any;
  service.withUrls = jest.fn(async () => {
    throw new Error("Collection unavailable");
  });
  await expect(service.urls()).rejects.toThrow("Collection unavailable");
});

it.each(["0", "-1", "1.5", "10x", "9007199254740992"])(
  "rejects pagination size %s before reading a collection",
  async (size) => {
    const service = Object.create(Service.prototype) as Service;
    service.findById = jest.fn(async () => ({
      id: "page",
      url: `/blog/[blog.articles.:pagination:${size}]`,
    })) as any;
    await expect(service.withUrls({ id: "page" })).rejects.toThrow(
      "Invalid page size",
    );
  },
);

it("keeps the first pagination URL unnumbered for an empty or nonempty collection", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.findById = jest.fn(async () => ({
    id: "page",
    url: "/blog/[blog.articles.:pagination:2]",
  })) as any;
  const fetchEntities = jest
    .fn()
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{}, {}, {}, {}, {}]);
  Object.assign(service, { fetchAllModuleEntities: fetchEntities });
  expect((await service.withUrls({ id: "page" })).urls).toEqual([
    { url: "/blog" },
  ]);
  expect((await service.withUrls({ id: "page" })).urls).toEqual([
    { url: "/blog" },
    { url: "/blog/2" },
    { url: "/blog/3" },
  ]);
});

it("enumerates public entity slugs without sending an administrative credential", async () => {
  const service = Object.create(Service.prototype) as Service;
  const page = {
    id: "articles",
    url: "/blog/[blog.articles.slug]",
    language: "ru",
  };
  service.find = jest.fn(async () => [page]) as any;
  service.findById = jest.fn(async () => page) as any;
  const originalFetch = global.fetch;
  const fetch = jest
    .fn()
    .mockImplementation(
      async () =>
        new Response(JSON.stringify({ data: [{ slug: "public-article" }] })),
    );
  global.fetch = fetch as any;
  try {
    await expect(service.urls()).resolves.toEqual([
      { url: "/blog/public-article", language: "ru" },
    ]);
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty(
      "X-RBAC-SECRET-KEY",
    );
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
  } finally {
    global.fetch = originalFetch;
  }
});

it.each([401, 403])(
  "omits a collection denied to anonymous requests with %s",
  async (status) => {
    const service = Object.create(Service.prototype) as Service;
    service.find = jest.fn(async () => [
      { id: "private", url: "/blog/[blog.articles.slug]", language: "ru" },
      { id: "home", url: "/", language: "ru" },
    ]) as any;
    service.withUrls = jest.fn(async ({ id }) => {
      if (id === "private")
        throw Object.assign(new Error("Denied"), { status });
      return { id, urls: [{ url: "/" }] };
    }) as any;
    await expect(service.urls()).resolves.toEqual([
      { url: "/", language: "ru" },
    ]);
  },
);

it("enumerates and resolves public author UUIDs through the public DTO API", async () => {
  const service = Object.create(Service.prototype) as Service;
  const id = "61ed455d-8cce-458f-9992-a12e1fcb449a";
  const page = {
    id: "author-page",
    language: "en",
    url: "/authors/[social.profiles.id]",
  };
  service.find = jest.fn(async () => [page]) as any;
  service.findById = jest.fn(async () => page) as any;
  jest.mocked(profilesApi.authorFind).mockResolvedValue([{ id }] as any);
  expect(await service.urls()).toEqual([
    { url: `/authors/${id}`, language: "en" },
  ]);
  expect(
    await service.findByUrl({ url: `/authors/${id}`, language: "en" }),
  ).toEqual({ ...page, routeParams: { "social.profiles.id": id } });
  expect(profilesApi.authorFind).toHaveBeenLastCalledWith({
    params: { profileId: id, limit: 100, offset: 0 },
    options: { cache: "no-store" },
  });
});
it("does not resolve a private Profile slug through an operator read on a public route", async () => {
  const service = Object.create(Service.prototype) as Service;
  service.find = jest.fn(async () => [
    { id: "page", language: "en", url: "/authors/[social.profiles.slug]" },
  ]) as any;
  jest.mocked(profilesApi.authorFind).mockClear();
  await expect(
    service.findByUrl({ url: "/authors/private-slug", language: "en" }),
  ).rejects.toThrow("Not Found");
  expect(profilesApi.authorFind).not.toHaveBeenCalled();
});
