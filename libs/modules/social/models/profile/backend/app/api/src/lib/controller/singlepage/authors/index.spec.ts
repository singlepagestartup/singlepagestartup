import { Hono } from "hono";
import { ParseQueryMiddleware } from "@sps/shared-backend-api";
import { Controller } from "..";
import { Service } from "../../../service/singlepage";

jest.mock("@sps/shared-backend-api", () => ({
  ...jest.requireActual("@sps/shared-backend-api"),
  // Repository doubles have no database transaction to snapshot.
  withConsistencySnapshot: (operation: () => Promise<unknown>) => operation(),
}));
jest.mock("../../../repository", () => ({ Repository: class {} }));
jest.mock("@sps/social/models/chat/backend/app/api/src/lib/service", () => ({
  Service: class {},
}));
jest.mock(
  "@sps/social/relations/profiles-to-chats/backend/app/api/src/lib/service",
  () => ({ Service: class {} }),
);

const profileId = "61ed455d-8cce-458f-9992-a12e1fcb449a";
const articleId = "a1ed455d-8cce-458f-9992-a12e1fcb449a";
const productId = "b1ed455d-8cce-458f-9992-a12e1fcb449a";

function fixture() {
  const profile = {
    id: profileId,
    variant: "default",
    slug: "profile-handle",
    adminTitle: "Profile editor label",
    title: { en: "Framework author" },
    subtitle: {},
    description: {},
    allowedMcpServerIds: ["singlepagestartup"],
  };
  const repository = {
    find: jest.fn().mockResolvedValue([profile]),
    count: jest.fn().mockResolvedValue(1),
    findFirstByField: jest.fn().mockResolvedValue(profile),
  };
  const dependencies = {
    article: { find: jest.fn().mockResolvedValue([{ id: articleId }]) },
    product: { find: jest.fn().mockResolvedValue([{ id: productId }]) },
    file: { findById: jest.fn() },
    profilesToArticles: {
      find: jest
        .fn()
        .mockResolvedValue([
          { id: "article-link", profileId, blogModuleArticleId: articleId },
        ]),
    },
    profilesToProducts: {
      find: jest.fn().mockResolvedValue([
        {
          id: "product-link",
          profileId,
          ecommerceModuleProductId: productId,
        },
      ]),
    },
    profilesToFiles: { find: jest.fn().mockResolvedValue([]) },
  };
  const service = new Service(
    repository as any,
    {} as any,
    {} as any,
    dependencies as any,
  );
  const controller = new Controller(service);
  const app = new Hono();
  app.use("*", new ParseQueryMiddleware().init());
  for (const route of controller.httpRoutes)
    app.on(route.method, route.path, route.handler);
  return { app, profile, repository, dependencies };
}

it("keeps standard Profile list/count/detail on the CRUD model contract", async () => {
  const { app, profile, repository, dependencies } = fixture();
  const filters = [{ column: "id", method: "eq", value: profileId }];
  const query = new URLSearchParams({
    "filters[and]": JSON.stringify(filters),
    limit: "5",
    offset: "0",
  });
  const list = await app.request(`/?${query}`);
  expect(list.status).toBe(200);
  expect(await list.json()).toEqual({ data: [profile] });
  expect(repository.find).toHaveBeenCalledWith({
    params: expect.objectContaining({
      filters: { and: filters },
      limit: "5",
      offset: "0",
    }),
  });
  const count = await app.request("/count");
  expect(await count.json()).toEqual({ data: 1 });
  expect(repository.count).toHaveBeenCalledTimes(1);
  const detail = await app.request(`/${profileId}`);
  expect(detail.status).toBe(200);
  expect(await detail.json()).toEqual({ data: profile });
  expect(repository.findFirstByField).toHaveBeenCalledWith("id", profileId);
  for (const dependency of Object.values(dependencies))
    expect(
      "find" in dependency ? dependency.find : dependency.findById,
    ).not.toHaveBeenCalled();
});

it("returns Author summaries and linked work only through the named Author routes", async () => {
  const { app, repository } = fixture();
  const list = await app.request(
    `/authors?ecommerceModuleProductId=${productId}`,
  );
  expect(list.status).toBe(200);
  const { data: authors } = await list.json();
  expect(authors).toHaveLength(1);
  expect(authors[0]).toMatchObject({
    id: profileId,
    articleCount: 1,
    productCount: 1,
  });
  expect(authors[0]).not.toHaveProperty("articles");
  const count = await app.request(`/authors/count?profileId=${profileId}`);
  expect(await count.json()).toEqual({ data: 1 });
  const detail = await app.request(`/authors/${profileId}`);
  expect(detail.status).toBe(200);
  const { data: author } = await detail.json();
  expect(author.articles).toEqual([{ id: articleId }]);
  expect(author.products).toEqual([{ id: productId }]);
  for (const field of ["slug", "adminTitle", "allowedMcpServerIds"])
    expect(author).not.toHaveProperty(field);
  expect(repository.count).not.toHaveBeenCalled();
  expect(repository.findFirstByField).not.toHaveBeenCalled();
});

it("does not accept generic CRUD filters on the Author route", async () => {
  const { app, repository } = fixture();
  const response = await app.request("/authors?filters[and]=[]");
  expect(response.status).toBe(400);
  expect(repository.find).not.toHaveBeenCalled();
});
