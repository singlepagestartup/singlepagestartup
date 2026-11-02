/**
 * BDD Suite: default app route registration.
 *
 * Given: a controller whose route list is registered by the default app.
 * When: the app registers those routes on its Hono instance.
 * Then: the declared routes answer, no dump route exists to be called, and
 *       per-route middlewares still run in their declared order.
 */

import { HTTPException } from "hono/http-exception";
import { createMiddleware } from "hono/factory";
import { App } from "./index";
import { Controller } from "../../controllers/rest";
import { type IController } from "../../controllers";

const createService = () =>
  ({
    find: jest.fn(async () => []),
    count: jest.fn(async () => 0),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    dump: jest.fn(async () => ({ dumps: [] })),
    seed: jest.fn(),
    findOrCreate: jest.fn(),
  }) as any;

const exceptionFilter = {
  catch: (error: any, c: any) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    return c.json({ error: "Internal server error" }, 500);
  },
} as any;

class CustomController extends Controller<any> {
  constructor(service: any, routes: IController<any>["httpRoutes"]) {
    super(service);
    this.bindHttpRoutes(routes);
  }
}

async function createApp(controller: any) {
  const app = new App(exceptionFilter, controller, {} as any);
  await app.init();

  return app;
}

describe("Given: the default app registers an entity's routes", () => {
  /**
   * BDD Scenario: a caller asks for a dump over HTTP.
   *
   * Given: the default route list, which no longer contains a dump route.
   * When: /dump is requested.
   * Then: nothing answers and the service never dumps, so no table is read
   *       and no data directory is rewritten by an HTTP caller.
   */
  it("does not answer a dump request at all", async () => {
    const service = createService();
    const app = await createApp(new Controller(service));

    const response = await app.hono.request("/dump");

    expect(response.status).toBe(404);
    expect(service.dump).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a caller holding the operator secret asks for a dump.
   *
   * Given: the default route list.
   * When: /dump is requested with an operator credential.
   * Then: it is still unanswered, because the route does not exist rather
   *       than being guarded — a credential cannot reopen it.
   */
  it("does not answer a dump request even with a credential", async () => {
    const service = createService();
    const app = await createApp(new Controller(service));

    const response = await app.hono.request("/dump", {
      headers: { "X-RBAC-SECRET-KEY": "any-operator-secret" },
    });

    expect(response.status).toBe(404);
    expect(service.dump).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: the read routes stay reachable.
   *
   * Given: the default route list.
   * When: the collection route is requested anonymously.
   * Then: it answers, so removing the dump route did not narrow the read
   *       surface the host app depends on.
   */
  it("leaves the read routes open to anonymous callers", async () => {
    const service = createService();
    const app = await createApp(new Controller(service));

    const response = await app.hono.request("/");

    expect(response.status).toBe(200);
    expect(service.find).toHaveBeenCalled();
  });

  /**
   * BDD Scenario: a route's own middlewares run.
   *
   * Given: a controller binding a route that declares its own middleware.
   * When: that route is called.
   * Then: the middleware runs before the handler, so route-level composition
   *       still works after binding stopped rewriting middleware lists.
   */
  it("runs a route's own middlewares before its handler", async () => {
    const order: string[] = [];
    const own = createMiddleware(async (_c, next) => {
      order.push("middleware");
      return next();
    });
    const service = createService();
    const controller = new CustomController(service, [
      {
        method: "GET",
        path: "/",
        handler: async (c: any) => {
          order.push("handler");
          return c.json({ ok: true });
        },
        middlewares: [own],
      },
    ]);
    const app = await createApp(controller);

    const response = await app.hono.request("/");

    expect(response.status).toBe(200);
    expect(order).toEqual(["middleware", "handler"]);
  });
});
