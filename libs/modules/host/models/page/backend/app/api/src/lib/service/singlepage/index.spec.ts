import { Service } from "./index";
import { RoutingService } from "./routing";

function create(pages: any[]) {
  const service = Object.create(Service.prototype) as Service;
  service.find = jest.fn(async () => pages) as any;
  service.findById = jest.fn(async ({ id }) =>
    pages.find((page) => page.id === id),
  ) as any;
  service.routing = {
    find: jest.fn(),
    all: jest.fn(),
  } as unknown as RoutingService;
  return service;
}
const page = (values: object = {}) => ({
  id: "page",
  variant: "default",
  language: "ru",
  url: "/about",
  ...values,
});

it("indexes saved published Pages independently of URL prefixes and legacy indexing", async () => {
  const service = create([
    page({ url: "/ai-chat/public", indexing: "noindex" }),
    page({ id: "contacts", url: "/contacts" }),
  ]);
  expect(await service.urls()).toEqual([
    { url: "/contacts" },
    { url: "/ai-chat/public" },
  ]);
});
it.each(["hidden", "draft"])(
  "returns 404 and omits %s Pages",
  async (variant) => {
    const service = create([page({ variant })]);
    await expect(service.findByUrl({ url: "/about" })).rejects.toThrow(
      "Not Found",
    );
    expect(await service.urls()).toEqual([]);
  },
);
it("keeps noindex route shells available without reading authenticated data", async () => {
  const service = create([
    page({ variant: "noindex", url: "/private/[custom.items.id]" }),
  ]);
  expect(await service.findByUrl({ url: "/private/one" })).toMatchObject({
    routeParams: { "custom.items.id": "one" },
  });
  expect(service.routing.find).not.toHaveBeenCalled();
  expect(await service.urls()).toEqual([]);
});
it("uses registered route sources for new modules without an SEO collection list", async () => {
  const service = create([page({ url: "/portfolio/[custom.projects.slug]" })]);
  jest
    .mocked(service.routing.all)
    .mockResolvedValue([{ id: "one", slug: "new-work" }]);
  expect(await service.urls()).toEqual([{ url: "/portfolio/new-work" }]);
  jest
    .mocked(service.routing.find)
    .mockResolvedValue([{ id: "one", slug: "new-work" }]);
  expect(await service.findByUrl({ url: "/portfolio/new-work" })).toMatchObject(
    { routeParams: { "custom.projects.slug": "new-work" } },
  );
  jest.mocked(service.routing.find).mockResolvedValue([]);
  await expect(
    service.findByUrl({ url: "/portfolio/missing" }),
  ).rejects.toThrow("Not Found");
});
it("prefers exact static Pages before route masks", async () => {
  const service = create([
    page({ id: "mask", url: "/[custom.items.slug]" }),
    page(),
  ]);
  expect((await service.findByUrl({ url: "/about" })).id).toBe("page");
  expect(service.routing.find).not.toHaveBeenCalled();
});
it("expands pagination through the Page route constructor and keeps page 1 unnumbered", async () => {
  const service = create([page({ url: "/news/[custom.posts.:pagination:2]" })]);
  jest
    .mocked(service.routing.all)
    .mockResolvedValue([
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
    ]);
  expect(await service.urls()).toEqual([
    { url: "/news" },
    { url: "/news/2" },
    { url: "/news/3" },
  ]);
  await expect(service.findByUrl({ url: "/news/4" })).rejects.toThrow(
    "Not Found",
  );
});
it("does not impose cross-model association requirements on Page masks", async () => {
  const service = create([
    page({ url: "/[custom.groups.slug]/[custom.items.slug]" }),
  ]);
  jest
    .mocked(service.routing.all)
    .mockImplementation(async (name) =>
      name === "custom.groups"
        ? [{ id: "g", slug: "group" }]
        : [{ id: "i", slug: "item" }],
    );
  expect(await service.urls()).toEqual([{ url: "/group/item" }]);
});
it("does not turn source outages into a partial successful sitemap", async () => {
  const service = create([page({ url: "/[custom.items.slug]" })]);
  jest.mocked(service.routing.all).mockRejectedValue(new Error("offline"));
  await expect(service.urls()).rejects.toThrow("offline");
});
it("omits unavailable anonymous source enumerations without using credentials", async () => {
  const service = create([page({ url: "/[custom.items.slug]" })]);
  jest.mocked(service.routing.all).mockRejectedValue({ status: 403 });
  expect(await service.urls()).toEqual([]);
});
it("retains legacy scalar route lookups and returns null for a missing segment", async () => {
  const service = create([
    page({ variant: "noindex", url: "/private/[custom.items.id]" }),
  ]);
  expect(
    await service.urlSegmentValue({
      url: "/private/one",
      segment: "custom.items.id",
    }),
  ).toBe("one");
  expect(
    await service.urlSegmentValue({
      url: "/private/one",
      segment: "other.id",
    }),
  ).toBeNull();
});

it("does not let a generic mask override an explicitly hidden static Page", async () => {
  const service = create([
    page({ variant: "hidden" }),
    page({ id: "mask", url: "/[custom.items.slug]" }),
  ]);
  await expect(service.findByUrl({ url: "/about" })).rejects.toThrow(
    "Not Found",
  );
  expect(service.routing.find).not.toHaveBeenCalled();
});

it.each(["hidden", "draft", "noindex"])(
  "does not reintroduce a %s Page through a generic sitemap mask",
  async (variant) => {
    const service = create([
      page({ variant }),
      page({ id: "ru-mask", url: "/[custom.items.slug]" }),
      page({ id: "en-mask", url: "/[custom.items.slug]" }),
    ]);
    jest.mocked(service.routing.all).mockResolvedValue([
      { id: "one", slug: "about" },
      { id: "two", slug: "contacts" },
    ]);
    expect(await service.urls()).toEqual([{ url: "/contacts" }]);
  },
);
