jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "test-secret",
  RBAC_SECRET_KEY: "operator",
}));
jest.mock("hono/jwt", () => ({
  verify: jest.fn(async (token: string) => ({ subject: { id: token } })),
}));
import { Hono } from "hono";
import { ParseQueryMiddleware } from "@sps/shared-backend-api";
import { Handler as FindHandler } from "../../../../../../../../../../../../../shared/backend/api/src/lib/controllers/rest/handler/find";
import { Handler as CountHandler } from "../../../../../../../../../../../../../shared/backend/api/src/lib/controllers/rest/handler/count";
import {
  Service as Graph,
  graphEdges,
  type IGraphServices,
  type IGraphRecord,
} from "./graph";
import { Service as Access } from "./access";
import { Service as Content } from "./content";
import { Middleware } from "../../../../../../../middlewares/src/lib/protected-blog-content";
const privateLinkId = "a0000000-0000-4000-8000-000000000003";
function fixture() {
  const rows: Record<string, IGraphRecord[]> = {
    "blog/articles": [{ id: "article" }],
    "blog/articles-to-website-builder-module-widgets": [
      {
        id: "public-link",
        articleId: "article",
        websiteBuilderModuleWidgetId: "public-widget",
        variant: "default",
        orderIndex: 0,
      },
      {
        id: privateLinkId,
        articleId: "article",
        websiteBuilderModuleWidgetId: "private-widget",
        variant: "private",
        orderIndex: 1,
      },
    ],
    "blog/articles-to-ecommerce-module-products": [
      {
        id: "requirement",
        articleId: "article",
        ecommerceModuleProductId: "product",
        variant: "subscription",
      },
    ],
    "website-builder/widgets": [
      { id: "public-widget", title: { en: "public" } },
      { id: "private-widget", title: { en: "PRIVATE-MARKER" } },
    ],
    "website-builder/widgets-to-features": [
      {
        id: "feature-link",
        widgetId: "private-widget",
        featureId: "private-feature",
      },
    ],
    "website-builder/features": [
      { id: "private-feature", description: { en: "PRIVATE-MARKER" } },
    ],
    "website-builder/features-to-file-storage-module-files": [
      {
        id: "file-link",
        featureId: "private-feature",
        fileStorageModuleFileId: "private-file",
      },
    ],
    "file-storage/files": [
      {
        id: "private-file",
        file: "/file-storage/secret.txt",
        mimeType: "text/plain",
      },
    ],
    "rbac/subjects-to-identities": [
      { id: "identity", subjectId: "subscriber" },
      { id: "other-identity", subjectId: "other" },
    ],
    "rbac/subjects-to-ecommerce-module-orders": [
      { id: "owner", subjectId: "subscriber", ecommerceModuleOrderId: "order" },
    ],
    "rbac/subjects-to-roles": [
      { id: "grant", subjectId: "subscriber", roleId: "role" },
    ],
    "rbac/roles-to-ecommerce-module-products": [
      {
        id: "product-role",
        roleId: "role",
        ecommerceModuleProductId: "product",
      },
    ],
    "ecommerce/products": [{ id: "product", type: "subscription" }],
    "ecommerce/orders": [
      {
        id: "order",
        status: "delivering",
        type: "history",
        subscriptionPeriodStartsAt: "2020-01-01",
        subscriptionPeriodEndsAt: "2099-01-01",
        subscriptionPeriodInvoiceId: "paid-invoice",
      },
    ],
    "ecommerce/orders-to-products": [
      { id: "line", orderId: "order", productId: "product" },
    ],
  };
  for (const edge of graphEdges) {
    rows[edge.relation] ||= [];
    rows[edge.parent] ||= [];
    rows[edge.child] ||= [];
  }
  const services: IGraphServices = {};
  for (const resource of Object.keys(rows))
    services[resource] = {
      find: jest.fn(async (props) => {
        let values = [...rows[resource]];
        for (const filter of props?.params?.filters?.and || []) {
          if (filter.method === "eq")
            values = values.filter(
              (row) => row[filter.column] === filter.value,
            );
          if (filter.method === "inArray")
            values = values.filter((row) =>
              (filter.value as string[]).includes(String(row[filter.column])),
            );
          if (filter.method === "notInArray")
            values = values.filter(
              (row) =>
                !(filter.value as string[]).includes(
                  String(row[filter.column]),
                ),
            );
        }
        return values.slice(
          props?.params?.offset || 0,
          props?.params?.limit === undefined
            ? undefined
            : (props.params.offset || 0) + props.params.limit,
        );
      }),
      findById: jest.fn(async ({ id }) =>
        rows[resource].find((row) => row.id === id),
      ),
    };
  services["ecommerce/orders"].findByIdCheckoutAttributes = jest.fn(
    async ({ id }) => ({
      type: String(
        rows["ecommerce/orders"].find((order) => order.id === id)
          ?.checkoutType || "subscription",
      ),
    }),
  );
  return { rows, graph: new Graph(services) };
}
function chain(graph: Graph) {
  const app = new Hono();
  const guard = new Middleware(
    () => graph,
    async (operation) => operation(),
  );
  let cacheHits = 0;
  app.use(guard.bytes());
  app.on(
    ["GET", "HEAD"],
    "/public/*",
    (c) =>
      new Response(c.req.method === "HEAD" ? null : "PRIVATE-MARKER", {
        headers: { "Content-Type": "text/plain" },
      }),
  );
  app.use(new ParseQueryMiddleware().init());
  app.use(guard.init());
  app.use(async (c, next) => {
    cacheHits++;
    return next();
  });
  app.use(new ParseQueryMiddleware().init());
  for (const resource of [
    "website-builder/widgets",
    "website-builder/features",
    "file-storage/files",
  ]) {
    const service = {
      find: (props: unknown) => graph.services[resource].find(props as never),
      count: async (props: unknown) =>
        (await graph.services[resource].find(props as never)).length,
    };
    app.get(`/api/${resource}`, (c) =>
      new FindHandler(service as never).execute(c, async () => {}),
    );
    app.get(`/api/${resource}/count`, (c) =>
      new CountHandler(service as never).execute(c, async () => {}),
    );
    app.get(`/api/${resource}/:id`, async (c) =>
      c.json({
        data: await graph.services[resource].findById({
          id: c.req.param("id"),
        }),
      }),
    );
  }
  app.post("/api/blog/articles-to-website-builder-module-widgets", (c) =>
    c.json({ data: { ok: true } }, 201),
  );
  app.delete("/api/blog/articles-to-website-builder-module-widgets/:id", (c) =>
    c.json({ data: { ok: true } }),
  );
  return { app, cacheHits: () => cacheHits };
}
it("grants an entitled guest Subject without an Identity and presents an unentitled guest as guest", async () => {
  const { rows, graph } = fixture();
  rows["rbac/subjects-to-identities"] = [];
  const access = new Access(graph);
  expect(
    (await access.execute({ articleId: "article", subjectId: "subscriber" }))
      .state,
  ).toBe("granted");
  rows["rbac/subjects-to-ecommerce-module-orders"] = [];
  expect(
    await access.execute({ articleId: "article", subjectId: "subscriber" }),
  ).toEqual({ state: "guest", expiresAt: null });
});
it("preserves native database Date milliseconds at both fixed period boundaries", async () => {
  const { rows, graph } = fixture();
  const start = new Date("2026-10-23T00:00:00.487Z");
  const end = new Date("2026-10-24T00:00:00.487Z");
  const order = rows["ecommerce/orders"][0];
  order.subscriptionPeriodStartsAt = start;
  order.subscriptionPeriodEndsAt = end;
  const read = (time: number) =>
    new Access(graph).execute({
      articleId: "article",
      subjectId: "subscriber",
      now: new Date(time),
    });
  expect((await read(start.getTime() - 1)).state).toBe("locked");
  expect((await read(start.getTime())).state).toBe("granted");
  expect(await read(end.getTime() - 1)).toEqual({
    state: "granted",
    expiresAt: end.toISOString(),
  });
  expect((await read(end.getTime())).state).toBe("expired");
  order.subscriptionPeriodStartsAt = start.getTime();
  order.subscriptionPeriodEndsAt = end.getTime();
  expect((await read(end.getTime() - 1)).state).toBe("granted");
  for (const invalid of [
    new Date(Number.NaN),
    {},
    "October 24 2026",
    "2026-02-31T00:00:00.487Z",
    null,
  ]) {
    order.subscriptionPeriodEndsAt = invalid;
    expect((await read(start.getTime())).state).toBe("locked");
  }
});
it("gates fresh owned product/role/status/period and expires without a mutation", async () => {
  const { rows, graph } = fixture();
  const access = new Access(graph);
  expect((await access.execute({ articleId: "article" })).state).toBe("guest");
  expect(
    (await access.execute({ articleId: "article", subjectId: "other" })).state,
  ).toBe("locked");
  expect(
    (await access.execute({ articleId: "article", subjectId: "subscriber" }))
      .state,
  ).toBe("granted");
  rows["rbac/subjects-to-roles"] = [];
  expect(
    (await access.execute({ articleId: "article", subjectId: "subscriber" }))
      .state,
  ).toBe("locked");
  rows["rbac/subjects-to-roles"] = [
    { id: "grant", subjectId: "subscriber", roleId: "role" },
  ];
  expect(
    (
      await access.execute({
        articleId: "article",
        subjectId: "subscriber",
        now: new Date("2099-01-01"),
      })
    ).state,
  ).toBe("expired");
  rows["ecommerce/orders"][0].status = "paid";
  expect(
    (await access.execute({ articleId: "article", subjectId: "subscriber" }))
      .state,
  ).toBe("locked");
});
it("returns ordered opaque denied slots without protected IDs or bodies", async () => {
  const { graph } = fixture();
  const content = new Content(graph);
  const denied = await content.execute({
    id: "other",
    blogModuleArticleId: "article",
  });
  expect(denied.items.map((item) => item.key)).toEqual(["block-0", "block-1"]);
  expect(JSON.stringify(denied)).not.toMatch(
    /private-widget|private-link|PRIVATE-MARKER/,
  );
  const granted = await content.execute({
    id: "subscriber",
    blogModuleArticleId: "article",
  });
  expect(JSON.stringify(granted)).toContain("PRIVATE-MARKER");
});
it("enforces scope before controller pagination/count and checks every raw descendant before cache", async () => {
  const { graph } = fixture();
  const { app, cacheHits } = chain(graph);
  const count = await app.request("/api/website-builder/widgets/count");
  expect(await count.json()).toEqual({ data: 1 });
  const page = await app.request(
    "/api/website-builder/widgets?limit=1&offset=1",
  );
  expect(await page.json()).toEqual({ data: [] });
  expect(
    (
      await app.request("/api/website-builder/widgets/private-widget", {
        headers: { Authorization: "Bearer subscriber" },
      })
    ).status,
  ).toBe(200);
  const before = cacheHits();
  for (const url of [
    "/api/website-builder/widgets/private-widget",
    "/api/website-builder/features/private-feature",
    "/api/file-storage/files/private-file",
  ])
    expect((await app.request(url)).status).toBe(403);
  expect(cacheHits()).toBe(before);
  expect(
    (
      await app.request(
        "/api/website-builder/widgets?filters[or][0][column]=id",
      )
    ).status,
  ).toBe(400);
});
it("guards GET/HEAD byte paths before the static handler and allows only the subscriber", async () => {
  const { graph } = fixture();
  const { app } = chain(graph);
  for (const method of ["GET", "HEAD"]) {
    const denied = await app.request("/public/file-storage/secret.txt", {
      method,
    });
    expect(denied.status).toBe(403);
    expect(await denied.text()).not.toContain("PRIVATE-MARKER");
    const grant = await app.request("/public/file-storage/secret.txt", {
      method,
      headers: { Authorization: "Bearer subscriber" },
    });
    expect(grant.status).toBe(200);
    expect(grant.headers.get("Cache-Control")).toContain("no-store");
  }
});
it("requires all private roots of a shared descendant", async () => {
  const { rows, graph } = fixture();
  rows["blog/articles-to-website-builder-module-widgets"].push({
    id: "other-root",
    articleId: "other-article",
    websiteBuilderModuleWidgetId: "private-widget",
    variant: "private",
  });
  const { app } = chain(graph);
  expect(
    (
      await app.request("/api/website-builder/features/private-feature", {
        headers: { Authorization: "Bearer subscriber" },
      })
    ).status,
  ).toBe(403);
});
it("rejects orphaning private links and public reuse even for an operator", async () => {
  const { graph } = fixture();
  const { app } = chain(graph);
  const headers = { "X-RBAC-SECRET-KEY": "operator" };
  expect(
    (
      await app.request(
        `/api/blog/articles-to-website-builder-module-widgets/${privateLinkId}`,
        { method: "DELETE", headers },
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await app.request(
        "/api/blog/articles-to-website-builder-module-widgets",
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              articleId: "public-article",
              websiteBuilderModuleWidgetId: "private-widget",
              variant: "default",
            },
          }),
        },
      )
    ).status,
  ).toBe(409);
});

it("runs a named Identity action without a UUID record lookup and preserves its body", async () => {
  const { graph } = fixture();
  const findById = jest.fn(async () => {
    throw new Error("invalid input syntax for type uuid: email-and-password");
  });
  graph.services["rbac/identities"] = {
    find: jest.fn().mockResolvedValue([]),
    findById,
  };
  const { app } = chain(graph);
  const action = jest.fn(async (payload: unknown) => payload);
  app.post("/api/rbac/identities/email-and-password", async (context) =>
    context.json({ data: await action(await context.req.json()) }, 201),
  );
  const data = { email: "fixture@example.test", password: "fixture-only" };
  const response = await app.request(
    "/api/rbac/identities/email-and-password",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    },
  );
  expect(response.status).toBe(201);
  expect(action).toHaveBeenCalledWith({ data });
  expect(findById).not.toHaveBeenCalled();
});

it.each([
  { websiteBuilderModuleWidgetId: "private-widget" },
  { fileStorageModuleFileId: "private-file" },
])(
  "still denies protected body references in a named action: %o",
  async (data) => {
    const { graph } = fixture();
    const findById = jest.fn(async () => {
      throw new Error("Named actions are not record IDs");
    });
    graph.services["rbac/identities"] = {
      find: jest.fn().mockResolvedValue([]),
      findById,
    };
    const { app } = chain(graph);
    const action = jest.fn();
    app.post("/api/rbac/identities/email-and-password", (context) => {
      action();
      return context.json({ data: { ok: true } }, 201);
    });
    const response = await app.request(
      "/api/rbac/identities/email-and-password",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      },
    );
    expect(response.status).toBe(409);
    expect(action).not.toHaveBeenCalled();
    expect(findById).not.toHaveBeenCalled();
  },
);

it("looks up canonical protected UUID records and denies DELETE through every accepted spelling", async () => {
  const { graph } = fixture();
  const { app } = chain(graph);
  const findById =
    graph.services["blog/articles-to-website-builder-module-widgets"].findById;
  for (const spelling of [
    privateLinkId,
    privateLinkId.toUpperCase(),
    "%61" + privateLinkId.slice(1),
    encodeURIComponent("{" + privateLinkId + "}"),
    privateLinkId.replaceAll("-", ""),
  ]) {
    expect(
      (
        await app.request(
          "/api/blog/articles-to-website-builder-module-widgets/" + spelling,
          { method: "DELETE" },
        )
      ).status,
    ).toBe(409);
    expect(findById).toHaveBeenLastCalledWith({ id: privateLinkId });
  }
});

it("canonicalizes encoded and alternative UUID spellings before the cache", async () => {
  const { rows, graph } = fixture();
  const id = "a0000000-0000-4000-8000-000000000001";
  rows["website-builder/widgets"][1].id = id;
  rows[
    "blog/articles-to-website-builder-module-widgets"
  ][1].websiteBuilderModuleWidgetId = id;
  rows["website-builder/widgets-to-features"][0].widgetId = id;
  const { app } = chain(graph);
  for (const spelling of [
    id,
    id.toUpperCase(),
    "%61" + id.slice(1),
    encodeURIComponent("{" + id + "}"),
    id.replaceAll("-", ""),
  ])
    expect(
      (await app.request("/api/website-builder/widgets/" + spelling)).status,
    ).toBe(403);
});
it("rejects first private mark when owning app isolation detects an existing Host/CRM reference", async () => {
  const { rows, graph } = fixture();
  rows["blog/articles-to-website-builder-module-widgets"][1].variant =
    "default";
  const isolated = jest.fn(async () => {
    throw new Error("Conflict error. Existing Host/CRM reference");
  });
  const guardedGraph = new Graph(graph.services, isolated);
  const guard = new Middleware(
    () => guardedGraph,
    async (operation) => operation(),
  );
  const app = new Hono();
  app.use(new ParseQueryMiddleware().init());
  app.use(guard.init());
  app.patch("/api/blog/articles-to-website-builder-module-widgets/:id", (c) =>
    c.json({ data: { ok: true } }),
  );
  const response = await app.request(
    `/api/blog/articles-to-website-builder-module-widgets/${privateLinkId}`,
    {
      method: "PATCH",
      headers: {
        "X-RBAC-SECRET-KEY": "operator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { variant: "private" } }),
    },
  );
  expect(response.status).toBe(409);
  expect(isolated).toHaveBeenCalled();
});
it("denies aliases of protected bytes in File metadata/content scope and prevents new public aliases", async () => {
  const { rows, graph } = fixture();
  rows["file-storage/files"].push({
    id: "alias-file",
    file: "/file-storage/sub/../secret.txt",
  });
  const { app } = chain(graph);
  expect((await app.request("/api/file-storage/files/alias-file")).status).toBe(
    403,
  );
  const guard = new Middleware(
    () => graph,
    async (operation) => operation(),
  );
  const upload = new Hono();
  upload.use(new ParseQueryMiddleware().init());
  upload.use(guard.init());
  upload.post("/api/file-storage/files", (c) =>
    c.json({ data: { ok: true } }, 201),
  );
  expect(
    (
      await upload.request("/api/file-storage/files", {
        method: "POST",
        headers: {
          "X-RBAC-SECRET-KEY": "operator",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { file: "/file-storage/sub/../secret.txt" },
        }),
      })
    ).status,
  ).toBe(409);
});
it("rejects nested bulk first-private markers before individual prevalidation", async () => {
  const { rows, graph } = fixture();
  rows["blog/articles-to-website-builder-module-widgets"][1].variant =
    "default";
  const guard = new Middleware(
    () => graph,
    async (operation) => operation(),
  );
  const app = new Hono();
  app.use(new ParseQueryMiddleware().init());
  app.use(guard.init());
  app.post("/api/blog/articles-to-website-builder-module-widgets/bulk", (c) =>
    c.json({ data: { ok: true } }, 201),
  );
  const response = await app.request(
    "/api/blog/articles-to-website-builder-module-widgets/bulk",
    {
      method: "POST",
      headers: {
        "X-RBAC-SECRET-KEY": "operator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          {
            data: {
              articleId: "article",
              websiteBuilderModuleWidgetId: "private-widget",
              variant: "private",
            },
          },
          {
            data: {
              articleId: "other",
              websiteBuilderModuleWidgetId: "private-widget",
              variant: "default",
            },
          },
        ],
      }),
    },
  );
  expect(response.status).toBe(409);
});
it("rejects multipart replacement of protected bytes through canonical or hyphenless IDs", async () => {
  const { rows, graph } = fixture();
  const id = "a0000000-0000-4000-8000-000000000002";
  rows["file-storage/files"][0].id = id;
  rows[
    "website-builder/features-to-file-storage-module-files"
  ][0].fileStorageModuleFileId = id;
  const guard = new Middleware(
    () => graph,
    async (operation) => operation(),
  );
  const app = new Hono();
  app.use(new ParseQueryMiddleware().init());
  app.use(guard.init());
  app.patch("/api/file-storage/files/:id", (c) =>
    c.json({ data: { ok: true } }),
  );
  for (const spelling of [
    id,
    id.replaceAll("-", ""),
    encodeURIComponent("{" + id + "}"),
  ]) {
    const form = new FormData();
    form.set("file", new Blob(["replacement"]), "replacement.txt");
    expect(
      (
        await app.request("/api/file-storage/files/" + spelling, {
          method: "PATCH",
          headers: { "X-RBAC-SECRET-KEY": "operator" },
          body: form,
        })
      ).status,
    ).toBe(409);
  }
});
it("does not allow a re-created Role to restore an explicitly revoked Order", async () => {
  const { rows, graph } = fixture();
  rows["ecommerce/orders"][0].subscriptionRevokedAt = new Date().toISOString();
  expect(
    (
      await new Access(graph).execute({
        subjectId: "subscriber",
        articleId: "article",
      })
    ).state,
  ).toBe("locked");
});
it("limits a granted Widget lifetime by other private roots of its shared descendant", async () => {
  const { rows, graph } = fixture();
  rows["blog/articles-to-website-builder-module-widgets"].push({
    id: "root-b",
    articleId: "article-b",
    websiteBuilderModuleWidgetId: "widget-b",
    variant: "private",
  });
  rows["website-builder/widgets"].push({ id: "widget-b" });
  rows["website-builder/widgets-to-file-storage-module-files"].push({
    id: "b-file",
    widgetId: "widget-b",
    fileStorageModuleFileId: "private-file",
  });
  rows["blog/articles-to-ecommerce-module-products"].push({
    id: "require-b",
    articleId: "article-b",
    ecommerceModuleProductId: "product-b",
    variant: "subscription",
  });
  rows["ecommerce/products"].push({ id: "product-b", type: "subscription" });
  rows["rbac/roles-to-ecommerce-module-products"].push({
    id: "role-product-b",
    roleId: "role-b",
    ecommerceModuleProductId: "product-b",
  });
  rows["rbac/subjects-to-roles"].push({
    id: "grant-b",
    subjectId: "subscriber",
    roleId: "role-b",
  });
  rows["rbac/subjects-to-ecommerce-module-orders"].push({
    id: "owner-b",
    subjectId: "subscriber",
    ecommerceModuleOrderId: "order-b",
  });
  rows["ecommerce/orders-to-products"].push({
    id: "line-b",
    orderId: "order-b",
    productId: "product-b",
  });
  rows["ecommerce/orders"].push({
    id: "order-b",
    type: "history",
    status: "delivering",
    subscriptionPeriodStartsAt: "2020-01-01",
    subscriptionPeriodEndsAt: "2030-01-01",
    subscriptionPeriodInvoiceId: "invoice-b",
  });
  const result = await new Content(graph).execute({
    id: "subscriber",
    blogModuleArticleId: "article",
    now: new Date("2026-01-01"),
  });
  expect(result.items[1]).toMatchObject({
    kind: "private",
    access: { state: "granted", expiresAt: "2030-01-01T00:00:00.000Z" },
  });
});

it("denies cart and non-subscription checkout metadata despite leftover period fields", async () => {
  const { rows, graph } = fixture();
  rows["ecommerce/orders"][0].type = "cart";
  expect(
    (
      await new Access(graph).execute({
        subjectId: "subscriber",
        articleId: "article",
      })
    ).state,
  ).toBe("locked");
  rows["ecommerce/orders"][0].type = "history";
  rows["ecommerce/orders"][0].checkoutType = "one_off";
  expect(
    (
      await new Access(graph).execute({
        subjectId: "subscriber",
        articleId: "article",
      })
    ).state,
  ).toBe("locked");
});
