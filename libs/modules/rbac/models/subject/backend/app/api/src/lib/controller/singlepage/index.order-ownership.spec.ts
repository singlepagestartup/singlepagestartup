/**
 * BDD Suite: per-order subject routes check the order belongs to the subject.
 *
 * Given: the subject controller's route table mounted the way the module app mounts it,
 * with the route handlers replaced by stubs so only the route guards are under test.
 * When: the per-order quantity, total, update and delete routes are requested.
 * Then: an order not linked to the subject in the path, or another subject's token, is
 * refused before the handler, while the subject's own order reaches the handler with the
 * subject's token or the operator secret; the cart routes beside them are not affected.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_JWT_SECRET: "test-jwt-secret",
    RBAC_SECRET_KEY: "test-rbac-secret-key",
  };
});

import { sign } from "hono/jwt";
import { DefaultApp } from "@sps/shared-backend-api";
import { Controller } from ".";

type IHandlerName =
  | "ecommerceModuleOrderIdQuantity"
  | "ecommerceModuleOrderIdTotal"
  | "ecommerceModuleOrderIdUpdate"
  | "ecommerceModuleOrderIdDelete"
  | "ecommerceModuleOrderQuantity"
  | "ecommerceModuleOrderTotal"
  | "ecommerceModuleOrderCheckout";

interface IRoute {
  name: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: (props: { subjectId: string; orderId: string }) => string;
  handlerName: IHandlerName;
}

const perOrderRoutes: IRoute[] = [
  {
    name: "GET quantity",
    method: "GET",
    path: ({ subjectId, orderId }) =>
      `/${subjectId}/ecommerce-module/orders/${orderId}/quantity`,
    handlerName: "ecommerceModuleOrderIdQuantity",
  },
  {
    name: "GET total",
    method: "GET",
    path: ({ subjectId, orderId }) =>
      `/${subjectId}/ecommerce-module/orders/${orderId}/total`,
    handlerName: "ecommerceModuleOrderIdTotal",
  },
  {
    name: "PATCH",
    method: "PATCH",
    path: ({ subjectId, orderId }) =>
      `/${subjectId}/ecommerce-module/orders/${orderId}`,
    handlerName: "ecommerceModuleOrderIdUpdate",
  },
  {
    name: "DELETE",
    method: "DELETE",
    path: ({ subjectId, orderId }) =>
      `/${subjectId}/ecommerce-module/orders/${orderId}`,
    handlerName: "ecommerceModuleOrderIdDelete",
  },
];

const cartRoutes: IRoute[] = [
  {
    name: "GET cart quantity",
    method: "GET",
    path: ({ subjectId }) => `/${subjectId}/ecommerce-module/orders/quantity`,
    handlerName: "ecommerceModuleOrderQuantity",
  },
  {
    name: "GET cart total",
    method: "GET",
    path: ({ subjectId }) => `/${subjectId}/ecommerce-module/orders/total`,
    handlerName: "ecommerceModuleOrderTotal",
  },
  {
    name: "POST cart checkout",
    method: "POST",
    path: ({ subjectId }) => `/${subjectId}/ecommerce-module/orders/checkout`,
    handlerName: "ecommerceModuleOrderCheckout",
  },
];

const subjectsToEcommerceModuleOrders = [
  { subjectId: "subject-owner", ecommerceModuleOrderId: "order-owner" },
  { subjectId: "subject-other", ecommerceModuleOrderId: "order-other" },
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

/**
 * The route table captures handler references when the controller is
 * constructed, so the stubs are installed on the prototype before that.
 */
function createApp() {
  const handlers = [...perOrderRoutes, ...cartRoutes].reduce(
    (result, route) => {
      result[route.handlerName] = jest
        .spyOn(Controller.prototype, route.handlerName)
        .mockImplementation(
          async (...args: Parameters<Controller[IHandlerName]>) => {
            const [c] = args;

            return c.json({ data: route.name });
          },
        );

      return result;
    },
    {} as Record<IHandlerName, jest.SpyInstance>,
  );
  const service = createService();
  const app = new DefaultApp(
    {} as any,
    new Controller(service as any) as any,
    {} as any,
  );

  app.useRoutes();

  return { hono: app.hono, handlers, service };
}

async function request(props: {
  route: IRoute;
  subjectId: string;
  orderId: string;
  tokenSubjectId?: string;
  operatorSecret?: string;
}) {
  const { hono, handlers, service } = createApp();
  const headers: Record<string, string> = {};

  if (props.tokenSubjectId) {
    const token = await sign(
      { subject: { id: props.tokenSubjectId } },
      "test-jwt-secret",
    );

    headers["Authorization"] = `Bearer ${token}`;
  }

  if (props.operatorSecret) {
    headers["X-RBAC-SECRET-KEY"] = props.operatorSecret;
  }

  const response = await hono.request(
    props.route.path({ subjectId: props.subjectId, orderId: props.orderId }),
    { method: props.route.method, headers },
  );

  return {
    response,
    handler: handlers[props.route.handlerName],
    service,
  };
}

describe("Given: the per-order subject routes", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * BDD Scenario
   * Given: the subject's own token and, in its own path, an order linked to another subject.
   * When: each per-order route is requested.
   * Then: it is refused with 401 before the handler runs.
   */
  it.each(perOrderRoutes)(
    "When: the subject names an order of another subject Then: $name refuses before the handler",
    async (route) => {
      const { response, handler } = await request({
        route,
        subjectId: "subject-owner",
        orderId: "order-other",
        tokenSubjectId: "subject-owner",
      });

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    },
  );

  /**
   * BDD Scenario
   * Given: another subject's token on the owner's path and the owner's order.
   * When: each per-order route is requested.
   * Then: it is refused with 401 before the order link is looked up.
   */
  it.each(perOrderRoutes)(
    "When: another subject's token is sent Then: $name refuses before the handler",
    async (route) => {
      const { response, handler, service } = await request({
        route,
        subjectId: "subject-owner",
        orderId: "order-owner",
        tokenSubjectId: "subject-other",
      });

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
      expect(
        service.subjectsToEcommerceModuleOrders.find,
      ).not.toHaveBeenCalled();
    },
  );

  /**
   * BDD Scenario
   * Given: the subject's own token and an order linked to that subject, as the cart sends them.
   * When: each per-order route is requested.
   * Then: the handler runs.
   */
  it.each(perOrderRoutes)(
    "When: the subject names its own order Then: $name runs the handler",
    async (route) => {
      const { response, handler } = await request({
        route,
        subjectId: "subject-owner",
        orderId: "order-owner",
        tokenSubjectId: "subject-owner",
      });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    },
  );

  /**
   * BDD Scenario
   * Given: the operator secret in `X-RBAC-SECRET-KEY` and an order linked to the subject in the path.
   * When: each per-order route is requested.
   * Then: the handler runs.
   */
  it.each(perOrderRoutes)(
    "When: the operator secret names the subject's own order Then: $name runs the handler",
    async (route) => {
      const { response, handler } = await request({
        route,
        subjectId: "subject-owner",
        orderId: "order-owner",
        operatorSecret: "test-rbac-secret-key",
      });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
    },
  );

  /**
   * BDD Scenario
   * Given: the cart routes whose last path segment also fits the `:orderId` pattern.
   * When: the subject requests them with its own token.
   * Then: their handlers run and the order link is never looked up.
   */
  it.each(cartRoutes)(
    "When: the subject calls $name Then: the order link check does not run",
    async (route) => {
      const { response, handler, service } = await request({
        route,
        subjectId: "subject-owner",
        orderId: "order-owner",
        tokenSubjectId: "subject-owner",
      });

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(
        service.subjectsToEcommerceModuleOrders.find,
      ).not.toHaveBeenCalled();
    },
  );
});
