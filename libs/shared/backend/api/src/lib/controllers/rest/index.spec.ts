/**
 * BDD Suite: REST controller count route.
 *
 * Given: shared REST controllers register generic model routes.
 * When: default routes are bound or the count handler executes.
 * Then: GET /count is registered before parameterized item routes and returns numeric data.
 */

import { Controller } from ".";
import { Handler as CountHandler } from "./handler/count";

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
});
