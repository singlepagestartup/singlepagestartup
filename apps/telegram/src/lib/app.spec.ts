/// <reference types="jest" />

/**
 * @jest-environment node
 *
 * BDD Suite: Telegram transport route registration.
 *
 * Given: the transport registers its controller route descriptors on its Hono app.
 * When: requests reach a guarded control route and the unguarded webhook route.
 * Then: a rejecting guard stops the handler, a passing guard lets it run, and a
 * descriptor without middleware is registered with none. This seam is what a
 * fork silently loses: an unmerged route table compiles and leaves the control
 * routes open.
 */

jest.mock("@sps/shared-backend-api", () => {
  return {
    DI: {
      IExceptionFilter: Symbol("IExceptionFilter"),
    },
  };
});

jest.mock("./apps", () => {
  return {
    Apps: class {
      apps = [];
    },
  };
});

jest.mock("./controller", () => {
  return {
    Controller: class {},
  };
});

jest.mock("./telegram-bot", () => {
  return {
    TelegarmBot: class {},
  };
});

import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { App } from "./app";

function registerRoutes(httpRoutes: unknown[]) {
  const app = Object.create(App.prototype) as any;

  app.hono = new Hono();
  app.controller = { httpRoutes };
  app.apps = { apps: [] };
  app.useHttpRoutes();

  return app.hono as Hono;
}

describe("Given: the Telegram transport HTTP route registration", () => {
  /**
   * BDD Scenario
   * Given: a control route descriptor carries a guard that rejects the caller.
   * When: the route is requested.
   * Then: the guard's rejection is returned and the route handler never runs.
   */
  it("When: a route guard rejects Then: the control route handler never runs", async () => {
    const handler = jest.fn((c: any) => c.json({ ok: true }));
    const hono = registerRoutes([
      {
        method: "POST",
        path: "/run",
        handler,
        middlewares: [
          createMiddleware(async () => {
            throw new HTTPException(401, { message: "Unauthorized" });
          }),
        ],
      },
    ]);

    const response = await hono.request("/run", { method: "POST" });

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a control route descriptor carries a guard that accepts the caller.
   * When: the route is requested.
   * Then: the guard runs first and the route handler runs after it.
   */
  it("When: a route guard accepts Then: the control route handler runs after it", async () => {
    const guard = jest.fn();
    const handler = jest.fn((c: any) => c.json({ ok: true }));
    const hono = registerRoutes([
      {
        method: "POST",
        path: "/run",
        handler,
        middlewares: [
          createMiddleware(async (_c, next) => {
            guard();

            return next();
          }),
        ],
      },
    ]);

    const response = await hono.request("/run", { method: "POST" });

    expect(response.status).toBe(200);
    expect(guard).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(guard.mock.invocationCallOrder[0]).toBeLessThan(
      handler.mock.invocationCallOrder[0],
    );
  });

  /**
   * BDD Scenario
   * Given: the webhook descriptor carries no middleware, and a guarded control
   *        route is registered beside it.
   * When: the webhook route is requested.
   * Then: it reaches its handler without the control route's guard.
   */
  it("When: the webhook route is requested Then: no control-route guard applies to it", async () => {
    const guard = jest.fn();
    const webhookHandler = jest.fn((c: any) => c.json({ ok: true }));
    const hono = registerRoutes([
      {
        method: "POST",
        path: "/",
        handler: webhookHandler,
      },
      {
        method: "POST",
        path: "/run",
        handler: jest.fn(),
        middlewares: [
          createMiddleware(async (_c, next) => {
            guard();

            return next();
          }),
        ],
      },
    ]);

    const response = await hono.request("/", { method: "POST" });

    expect(response.status).toBe(200);
    expect(webhookHandler).toHaveBeenCalledTimes(1);
    expect(guard).not.toHaveBeenCalled();
  });
});
