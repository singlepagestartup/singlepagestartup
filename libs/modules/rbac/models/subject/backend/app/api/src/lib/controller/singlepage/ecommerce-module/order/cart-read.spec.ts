/**
 * BDD Suite: active cart read controllers.
 *
 * Given: a subject owns orders that may already have progressed past the new state.
 * When: cart list, quantity, and total endpoints load the subject's orders.
 * Then: without filters every order query is restricted to type cart and status new,
 * and filters passed to the list only narrow the subject's own orders.
 */

const authorizationMock = jest.fn();
const verifyMock = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  authorization: (...args: unknown[]) => authorizationMock(...args),
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("hono/jwt", () => ({
  verify: (...args: unknown[]) => verifyMock(...args),
}));

import { Handler as ListHandler } from "./list";
import { Handler as QuantityHandler } from "./quantity";
import { Handler as TotalHandler } from "./total";

function createContext(parsedQuery?: unknown) {
  return {
    req: {
      param: (name: string) => (name === "id" ? "subject-1" : undefined),
    },
    get: (name: string) => (name === "parsedQuery" ? parsedQuery : undefined),
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  const orderFind = jest.fn().mockResolvedValue([]);

  return {
    orderFind,
    service: {
      subjectsToEcommerceModuleOrders: {
        find: jest
          .fn()
          .mockResolvedValue([{ ecommerceModuleOrderId: "order-1" }]),
      },
      ecommerceModule: {
        order: {
          find: orderFind,
          findByIdQuantity: jest.fn(),
          findByIdTotal: jest.fn(),
        },
      },
    } as any,
  };
}

function expectActiveCartFilters(orderFind: jest.Mock) {
  expect(orderFind).toHaveBeenCalledWith({
    params: {
      filters: {
        and: expect.arrayContaining([
          {
            column: "type",
            method: "eq",
            value: "cart",
          },
          {
            column: "status",
            method: "eq",
            value: "new",
          },
        ]),
      },
    },
  });
}

describe("Given: an authenticated subject with historical cart orders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizationMock.mockReturnValue("token");
    verifyMock.mockResolvedValue({ subject: { id: "subject-1" } });
  });

  /**
   * BDD Scenario: list only active cart orders.
   *
   * Given: subject-to-order relations exist.
   * When: the cart list endpoint executes.
   * Then: the repository query includes status new.
   */
  it("When: cart list is requested Then: only new cart orders are queried", async () => {
    const { orderFind, service } = createService();

    await new ListHandler(service).execute(createContext(), jest.fn());

    expectActiveCartFilters(orderFind);
  });

  /**
   * BDD Scenario: count only active cart orders.
   *
   * Given: subject-to-order relations exist.
   * When: the cart quantity endpoint executes.
   * Then: the repository query includes status new.
   */
  it("When: cart quantity is requested Then: only new cart orders are queried", async () => {
    const { orderFind, service } = createService();

    await new QuantityHandler(service).execute(createContext(), jest.fn());

    expectActiveCartFilters(orderFind);
  });

  /**
   * BDD Scenario: total only active cart orders.
   *
   * Given: subject-to-order relations exist.
   * When: the cart total endpoint executes.
   * Then: the repository query includes status new.
   */
  it("When: cart total is requested Then: only new cart orders are queried", async () => {
    const { orderFind, service } = createService();

    await new TotalHandler(service).execute(createContext(), jest.fn());

    expectActiveCartFilters(orderFind);
  });

  /**
   * BDD Scenario: list the subject's orders of every status.
   *
   * Given: the caller filters the list by type cart only.
   * When: the cart list endpoint executes.
   * Then: the filter replaces the active-cart default and the query stays
   * restricted to the orders linked to the subject.
   */
  it("When: the list is filtered by the caller Then: the filters apply within the subject's orders", async () => {
    const { orderFind, service } = createService();
    const typeFilter = { column: "type", method: "eq", value: "cart" };

    await new ListHandler(service).execute(
      createContext({ filters: { and: [typeFilter] } }),
      jest.fn(),
    );

    expect(orderFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: ["order-1"] },
            typeFilter,
          ],
        },
      },
    });
  });
});
