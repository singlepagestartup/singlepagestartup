import { Hono } from "hono";
import { Middleware } from "./index";
jest.mock("@sps/shared-utils", () => ({
  RBAC_SECRET_KEY: "operator-test-key",
}));

it("passes exclusions to the sole runtime cache", async () => {
  const cache = jest.fn(() => async (c: any) => c.json({ data: "cached" }));
  const excludedRoutes = [{ regexPath: /^\/scoped/ }];
  const middleware = new Middleware({
    runtime: { cache, clearCache: jest.fn() },
    excludedRoutes,
  });
  const app = new Hono();
  app.use(middleware.init());
  expect(await (await app.request("/public")).json()).toEqual({
    data: "cached",
  });
  expect(cache).toHaveBeenCalledWith({ excludedRoutes });
});

it("guards cache management before any cached response can answer it", async () => {
  const readCache = jest.fn(async (c: any) => c.json({ leaked: true }));
  const clearCache = jest.fn(async () => {});
  const middleware = new Middleware({
    runtime: { cache: () => readCache, clearCache },
  });
  const app = new Hono();
  middleware.registerRoutes(app);
  app.use(middleware.init());
  expect((await app.request("/api/http-cache/clear")).status).toBe(401);
  expect(clearCache).not.toHaveBeenCalled();
  const response = await app.request("/api/http-cache/clear", {
    headers: { "X-RBAC-SECRET-KEY": "operator-test-key" },
  });
  expect(await response.json()).toEqual({ message: "Cache cleared" });
  expect(clearCache).toHaveBeenCalledTimes(1);
  expect(readCache).not.toHaveBeenCalled();
});
