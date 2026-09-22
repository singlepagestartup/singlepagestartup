/**
 * BDD Suite: REST controller count route.
 *
 * Given: shared REST controllers register generic model routes.
 * When: default routes are bound or the count handler executes.
 * Then: GET /count is registered before parameterized item routes and returns
 *       numeric data, and no dump route is exposed over HTTP at all.
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
   * BDD Scenario: the dump action is not reachable over HTTP.
   *
   * Given: the default shared REST controller.
   * When: its HTTP routes are inspected.
   * Then: no dump route is registered, because dumping runs in process from
   *       the db:dump target and was never called over HTTP.
   */
  it("exposes no dump route over HTTP", () => {
    const controller = new Controller(createService());

    expect(findRoute(controller, "/dump")).toBeUndefined();
    expect(
      controller.httpRoutes.some((route) => route.path.includes("dump")),
    ).toBe(false);
  });

  /**
   * BDD Scenario: a controller binding its own list gets no dump route.
   *
   * Given: a controller binding an explicit route list with no dump entry.
   * When: its HTTP routes are inspected.
   * Then: the read routes are registered and no dump route appears.
   */
  it("registers no dump route for a controller binding its own list", () => {
    const controller = new CustomController(createService(), [
      { method: "GET", path: "/", handler: jest.fn() },
      { method: "GET", path: "/count", handler: jest.fn() },
    ]);

    expect(findRoute(controller, "/")).toBeDefined();
    expect(findRoute(controller, "/count")).toBeDefined();
    expect(findRoute(controller, "/dump")).toBeUndefined();
  });

  /**
   * BDD Scenario: a route keeps the middlewares it declares.
   *
   * Given: a controller binding a route that carries its own middleware.
   * When: its HTTP routes are inspected.
   * Then: the middleware list is exactly what the route declared, because
   *       binding no longer rewrites it.
   */
  it("preserves a route's own middlewares", () => {
    const own = jest.fn();
    const controller = new CustomController(createService(), [
      { method: "GET", path: "/", handler: jest.fn(), middlewares: [own] },
    ]);

    expect(findRoute(controller, "/")?.middlewares).toEqual([own]);
  });
});
