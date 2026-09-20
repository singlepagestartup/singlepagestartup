/**
 * BDD Suite: REST controller count route.
 *
 * Given: shared REST controllers register generic model routes.
 * When: default routes are bound or the count handler executes.
 * Then: GET /count is registered before parameterized item routes and returns
 *       numeric data, and the dump route is bound as secret-only.
 */

import { Controller } from ".";
import { Handler as CountHandler } from "./handler/count";
import { type IController } from "../interface";

const createService = () =>
  ({
    find: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    dump: jest.fn(),
    seed: jest.fn(),
    findOrCreate: jest.fn(),
  }) as any;

class CustomController extends Controller<any> {
  constructor(service: any, routes: IController<any>["httpRoutes"]) {
    super(service);
    this.bindHttpRoutes(routes);
  }
}

const findRoute = (controller: Controller<any>, path: string) => {
  return controller.httpRoutes.find((route) => {
    return route.method === "GET" && route.path === path;
  });
};

describe("REST Controller", () => {
  /**
   * BDD Scenario: default count route ordering.
   *
   * Given: the default shared REST controller.
   * When: its HTTP routes are inspected.
   * Then: GET /count appears before GET /:uuid so the static route wins.
   */
  it("registers GET /count before GET /:uuid by default", () => {
    const controller = new Controller(createService());
    const countIndex = controller.httpRoutes.findIndex((route) => {
      return route.method === "GET" && route.path === "/count";
    });
    const uuidIndex = controller.httpRoutes.findIndex((route) => {
      return route.method === "GET" && route.path === "/:uuid";
    });

    expect(countIndex).toBeGreaterThan(-1);
    expect(uuidIndex).toBeGreaterThan(-1);
    expect(countIndex).toBeLessThan(uuidIndex);
  });

  /**
   * BDD Scenario: count handler response.
   *
   * Given: parsed query params and a service count method.
   * When: the count handler executes.
   * Then: it forwards parsed params and responds with a numeric data payload.
   */
  it("returns count service result as numeric data payload", async () => {
    const service = createService();
    service.count.mockResolvedValue(9);
    const handler = new CountHandler(service);
    const json = jest.fn((payload) => {
      return new Response(JSON.stringify(payload));
    });
    const context = {
      var: {
        parsedQuery: {
          filters: {
            and: [
              {
                column: "status",
                method: "eq",
                value: "active",
              },
            ],
          },
        },
      },
      json,
    } as any;

    await handler.execute(context, jest.fn() as any);

    expect(service.count).toHaveBeenCalledWith({
      params: context.var.parsedQuery,
    });
    expect(json).toHaveBeenCalledWith({
      data: 9,
    });
  });

  /**
   * BDD Scenario: the dump route is marked as secret-only by default.
   *
   * Given: the default shared REST controller.
   * When: its HTTP routes are inspected.
   * Then: the GET /dump entry carries requiresSecret and its guard, and no
   *       read route does.
   */
  it("binds GET /dump as secret-only and leaves the read routes open", () => {
    const controller = new Controller(createService());

    expect(findRoute(controller, "/dump")?.requiresSecret).toBe(true);
    expect(findRoute(controller, "/dump")?.middlewares).toHaveLength(1);
    expect(findRoute(controller, "/")?.requiresSecret).toBe(false);
    expect(findRoute(controller, "/")?.middlewares).toBeUndefined();
    expect(findRoute(controller, "/count")?.requiresSecret).toBe(false);
    expect(findRoute(controller, "/:uuid")?.requiresSecret).toBe(false);
  });

  /**
   * BDD Scenario: a controller that re-binds /dump inherits the mark.
   *
   * Given: a controller that calls bindHttpRoutes with its own route list
   *        containing GET /dump and no explicit flag.
   * When: its HTTP routes are inspected.
   * Then: the dump entry is marked secret-only and carries the guard.
   */
  it("marks a re-bound GET /dump without an explicit flag", () => {
    const controller = new CustomController(createService(), [
      {
        method: "GET",
        path: "/dump",
        handler: Controller.prototype.dump,
      },
      {
        method: "GET",
        path: "/",
        handler: Controller.prototype.find,
      },
    ]);

    expect(findRoute(controller, "/dump")?.requiresSecret).toBe(true);
    expect(findRoute(controller, "/dump")?.middlewares).toHaveLength(1);
    expect(findRoute(controller, "/")?.requiresSecret).toBe(false);
  });

  /**
   * BDD Scenario: a project can re-open dump deliberately.
   *
   * Given: a controller that binds GET /dump with requiresSecret set to false.
   * When: its HTTP routes are inspected.
   * Then: the flag is preserved and no guard is attached, so the startup seam
   *       still works.
   */
  it("preserves a deliberately re-opened GET /dump", () => {
    const controller = new CustomController(createService(), [
      {
        method: "GET",
        path: "/dump",
        handler: Controller.prototype.dump,
        requiresSecret: false,
      },
    ]);

    expect(findRoute(controller, "/dump")?.requiresSecret).toBe(false);
    expect(findRoute(controller, "/dump")?.middlewares).toBeUndefined();
  });

  /**
   * BDD Scenario: a guarded route keeps the middlewares it declared.
   *
   * Given: a controller that binds GET /dump with an ownership middleware.
   * When: its HTTP routes are inspected.
   * Then: the guard is first and the declared middleware follows it.
   */
  it("keeps a guarded route's own middlewares behind the guard", () => {
    const ownMiddleware = jest.fn() as any;
    const controller = new CustomController(createService(), [
      {
        method: "GET",
        path: "/dump",
        handler: Controller.prototype.dump,
        middlewares: [ownMiddleware],
      },
    ]);
    const middlewares = findRoute(controller, "/dump")?.middlewares;

    expect(middlewares).toHaveLength(2);
    expect(middlewares?.[1]).toBe(ownMiddleware);
  });
});
