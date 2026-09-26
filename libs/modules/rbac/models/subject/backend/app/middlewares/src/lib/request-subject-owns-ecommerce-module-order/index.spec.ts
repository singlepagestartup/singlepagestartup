/**
 * BDD Suite: ecommerce-module order ownership guard.
 *
 * Given: subjects linked to their cart orders through subjects-to-ecommerce-module-orders.
 * When: a route with a subject id and an order id in its path is requested.
 * Then: the route runs only when a relation row links that subject to that order,
 * whatever credential the request carries.
 */

import { Hono } from "hono";
import { Middleware } from ".";

const subjectsToEcommerceModuleOrders = [
  {
    id: "owner-order-relation",
    subjectId: "subject-owner",
    ecommerceModuleOrderId: "order-owner",
  },
  {
    id: "other-order-relation",
    subjectId: "subject-other",
    ecommerceModuleOrderId: "order-other",
  },
];

function createService() {
  return {
    subjectsToEcommerceModuleOrders: {
      find: jest.fn(async (props: any) => {
        const filters = props?.params?.filters?.and || [];

        return subjectsToEcommerceModuleOrders.filter((relation) => {
          return filters.every((filter: any) => {
            return (
              filter.method === "eq" &&
              relation[filter.column as keyof typeof relation] === filter.value
            );
          });
        });
      }),
    },
  };
}

function createApp(service: ReturnType<typeof createService>) {
  const handler = jest.fn((c: any) => c.json({ ok: true }));
  const app = new Hono();

  app.get(
    "/subjects/:id/ecommerce-module/orders/:orderId",
    new Middleware(service as any).init(),
    handler,
  );

  return { app, handler };
}

describe("Given: the ecommerce-module order ownership guard", () => {
  /**
   * BDD Scenario
   * Given: a relation row links the subject in the path to the order in the path.
   * When: the route is requested.
   * Then: the route runs, and the guard looks up that single pair.
   */
  it("When: the order is linked to the subject Then: the route runs", async () => {
    const service = createService();
    const { app, handler } = createApp(service);

    const response = await app.request(
      "/subjects/subject-owner/ecommerce-module/orders/order-owner",
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(service.subjectsToEcommerceModuleOrders.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: "subject-owner",
            },
            {
              column: "ecommerceModuleOrderId",
              method: "eq",
              value: "order-owner",
            },
          ],
        },
        limit: 1,
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the order in the path is linked to another subject.
   * When: the route is requested for the subject in the path.
   * Then: it is refused with 401 and the route does not run.
   */
  it("When: the order is linked to another subject Then: refuses the request before the route", async () => {
    const service = createService();
    const { app, handler } = createApp(service);

    const response = await app.request(
      "/subjects/subject-owner/ecommerce-module/orders/order-other",
    );

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: no relation row mentions the order in the path.
   * When: the route is requested.
   * Then: it is refused with 401 and the route does not run.
   */
  it("When: no subject is linked to the order Then: refuses the request before the route", async () => {
    const service = createService();
    const { app, handler } = createApp(service);

    const response = await app.request(
      "/subjects/subject-owner/ecommerce-module/orders/order-without-relation",
    );

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an operator request carrying `X-RBAC-SECRET-KEY` for a subject and its own order.
   * When: the route is requested.
   * Then: the route runs.
   */
  it("When: the operator secret names the subject's own order Then: the route runs", async () => {
    const service = createService();
    const { app, handler } = createApp(service);

    const response = await app.request(
      "/subjects/subject-owner/ecommerce-module/orders/order-owner",
      { headers: { "X-RBAC-SECRET-KEY": "operator-secret" } },
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario
   * Given: an operator request carrying `X-RBAC-SECRET-KEY` for a subject and an order linked to another subject.
   * When: the route is requested.
   * Then: it is refused with 401, because the credential does not replace the relation row.
   */
  it("When: the operator secret names an order of another subject Then: refuses the request before the route", async () => {
    const service = createService();
    const { app, handler } = createApp(service);

    const response = await app.request(
      "/subjects/subject-owner/ecommerce-module/orders/order-other",
      { headers: { "X-RBAC-SECRET-KEY": "operator-secret" } },
    );

    expect(response.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });
});
