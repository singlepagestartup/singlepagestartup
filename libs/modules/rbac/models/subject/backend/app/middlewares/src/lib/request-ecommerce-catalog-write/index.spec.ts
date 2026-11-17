import { Hono } from "hono";
import { Middleware, guardedRoutes } from "./index";
import type { Service as Catalog } from "../../../../api/src/lib/service/singlepage/ecommerce/catalog";

test("private registry reads and compound writes never reach a public handler", async () => {
  const catalog = {
    async assertPrivateOrderAccess() {
      throw new Error("Permission error. Private order registry");
    },
  } as unknown as Catalog;
  const app = new Hono();
  app.use(
    new Middleware().init({
      catalog,
      authenticate: async () => ({ id: "buyer", authenticated: true }),
    }),
  );
  app.all("*", (c) => c.json({ address: "must stay private" }));
  for (const [path, method] of [
    ["/api/ecommerce/orders", "GET"],
    ["/api/ecommerce/orders/order-id/extended", "GET"],
    ["/api/ecommerce/orders-to-products", "GET"],
    ["/api/ecommerce/orders-to-billing-module-payment-intents/count", "GET"],
    ["/api/ecommerce/orders-to-billing-module-payment-intents/bulk", "PATCH"],
  ]) {
    const anonymous = await app.request(path, { method });
    expect(anonymous.status).toBe(401);
    const buyer = await app.request(path, {
      method,
      headers: { Authorization: "Bearer buyer-token" },
    });
    expect(buyer.status).toBe(403);
    expect(await buyer.text()).not.toContain("must stay private");
  }
});

test("catalogue guarded routes are anchored and never capture quotes or unrelated APIs", () => {
  const matches = (path: string, method: string) =>
    guardedRoutes.some(
      (route) =>
        (route.methods ?? []).includes(method) && route.regexPath.test(path),
    );
  expect(matches("/api/ecommerce/stores-to-products/offer-id", "PATCH")).toBe(
    true,
  );
  expect(
    matches("/api/ecommerce/stores-to-products/offer-id/quote", "POST"),
  ).toBe(false);
  expect(matches("/api/ecommerce/products/unrelated/nested", "POST")).toBe(
    false,
  );
  expect(matches("/api/blog/articles", "POST")).toBe(false);
  expect(matches("/public/api/ecommerce/stores", "POST")).toBe(false);
  expect(matches("/api/ecommerce/products", "GET")).toBe(false);
  expect(
    matches(
      "/api/ecommerce/orders/01234567-89ab-cdef-0123-456789abcdef/extended",
      "GET",
    ),
  ).toBe(true);
  expect(
    matches(
      "/api/ecommerce/orders/01234567-89ab-cdef-0123-456789abcdef/extended/other",
      "GET",
    ),
  ).toBe(false);
  expect(matches("/api/ecommerce/orders/count", "GET")).toBe(false);
});

test("request data cannot supply operator privileges or replace the authenticated Subject", async () => {
  const mutations: any[] = [];
  const catalog = {
    async mutate(props: unknown, operation: () => Promise<unknown>) {
      mutations.push(props);
      return operation();
    },
  } as unknown as Catalog;
  const app = new Hono();
  app.use(
    new Middleware().init({
      catalog,
      authenticate: async () => ({
        id: "signed-in-subject",
        authenticated: true,
      }),
    }),
  );
  app.patch("/api/ecommerce/products/:id", (c) =>
    c.json({ data: { id: c.req.param("id") } }),
  );
  const response = await app.request("/api/ecommerce/products/product-id", {
    method: "PATCH",
    headers: { Authorization: "Bearer access-token" },
    body: new URLSearchParams({
      data: JSON.stringify({
        operator: true,
        admin: true,
        subjectId: "another-subject",
      }),
    }),
  });
  expect(response.status).toBe(200);
  expect(mutations[0]).toMatchObject({
    subjectId: "signed-in-subject",
    operator: false,
  });
});

test("seller route refuses another Subject even when its payload claims admin", async () => {
  const app = new Hono();
  app.use(
    new Middleware().init({
      catalog: {} as Catalog,
      authenticate: async () => ({
        id: "signed-in-subject",
        authenticated: true,
      }),
    }),
  );
  app.post("/api/rbac/subjects/:id/ecommerce-module/offers", (c) =>
    c.json({ data: "unexpected" }),
  );
  const response = await app.request(
    "/api/rbac/subjects/another-subject/ecommerce-module/offers",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: { admin: true } }),
    },
  );
  expect(response.status).toBe(403);
});
