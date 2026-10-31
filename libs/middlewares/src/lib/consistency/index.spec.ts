import { Hono } from "hono";
import { Middleware } from "./index";
jest.mock("hono/bun", () => ({
  createBunWebSocket: () => ({
    upgradeWebSocket: () => (c: any) => c.text("Upgrade required", 426),
  }),
}));
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_SECRET_KEY: "operator-test-key",
}));
function setup() {
  const runtime = {
    middleware: () => async (_c: any, next: any) => next(),
    check: jest.fn(async () => ({ valid: true })),
    metrics: () => ({ connections: 0 }),
    store: {
      diagnostics: jest.fn(async () => ({ epoch: "epoch" })),
      assertCoverage: jest.fn(async () => {}),
    },
    start: jest.fn(),
  };
  const middleware = new Middleware({
    runtime: runtime as any,
    revalidation: { revalidateTags: jest.fn() },
  });
  const app = new Hono();
  app.use(middleware.init());
  middleware.registerRoutes(app);
  return { app, runtime, middleware };
}
it("rejects malformed query refs before runtime access and forwards valid credential scope", async () => {
  const { app, runtime } = setup();
  const request = (body: unknown) =>
    app.request("/api/consistency/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer session",
      },
      body: JSON.stringify(body),
    });
  expect((await request({ refs: [1] })).status).toBe(400);
  expect((await request({ refs: Array(101).fill("ref") })).status).toBe(400);
  expect(runtime.check).not.toHaveBeenCalled();
  expect(await (await request({ refs: ["ref"] })).json()).toEqual({
    data: { valid: true },
  });
  expect(runtime.check).toHaveBeenCalledWith(["ref"], "Bearer session");
});
it("keeps diagnostics operator-only", async () => {
  const { app, runtime } = setup();
  expect((await app.request("/api/consistency/status")).status).toBe(401);
  expect(runtime.store.diagnostics).not.toHaveBeenCalled();
  const response = await app.request("/api/consistency/status", {
    headers: { "X-RBAC-SECRET-KEY": "operator-test-key" },
  });
  expect(await response.json()).toEqual({
    data: { epoch: "epoch", connections: 0 },
  });
});
it("starts delivery only after database capture coverage passes", async () => {
  const { runtime, middleware } = setup();
  runtime.store.assertCoverage.mockRejectedValueOnce(
    new Error("Missing capture"),
  );
  await expect(middleware.start()).rejects.toThrow("Missing capture");
  expect(runtime.start).not.toHaveBeenCalled();
  await middleware.start();
  expect(runtime.start).toHaveBeenCalledTimes(1);
});
