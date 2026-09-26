/**
 * BDD Suite: order lines of a subject.
 *
 * Given: a subject linked to its orders, and order lines read through the injected relation service.
 * When: the subject's order lines are requested, with or without caller filters.
 * Then: only lines of the subject's orders are read, each with its totals, and caller filters
 * narrow that set without replacing the constraint.
 */

import { logger } from "@sps/backend-utils";
import { Service } from "./orders-to-products";

const total = [
  {
    total: 20,
    billingModuleCurrency: { id: "currency-1", symbol: "$" },
  },
];

function createService(props?: {
  subjectsToEcommerceModuleOrders?: Record<string, unknown>[];
  ordersToProducts?: Record<string, unknown>[];
}) {
  const subjectsToEcommerceModuleOrdersFind = jest.fn().mockResolvedValue(
    props?.subjectsToEcommerceModuleOrders ?? [
      { subjectId: "subject-1", ecommerceModuleOrderId: "order-1" },
      { subjectId: "subject-1", ecommerceModuleOrderId: "order-2" },
    ],
  );
  const ordersToProductsFind = jest
    .fn()
    .mockResolvedValue(
      props?.ordersToProducts ?? [
        { id: "line-1", orderId: "order-1", productId: "product-1" },
      ],
    );
  const ordersToProductsGetTotal = jest.fn().mockResolvedValue(total);

  const service = new Service({
    ecommerceModule: {
      ordersToProducts: {
        find: ordersToProductsFind,
        getTotal: ordersToProductsGetTotal,
      },
    } as any,
    subjectsToEcommerceModuleOrders: {
      find: subjectsToEcommerceModuleOrdersFind,
    } as any,
  });

  return {
    service,
    subjectsToEcommerceModuleOrdersFind,
    ordersToProductsFind,
    ordersToProductsGetTotal,
  };
}

describe("Given: the order lines of a subject", () => {
  /**
   * BDD Scenario
   * Given: a subject linked to two orders, one of which has a line.
   * When: the lines are requested without caller filters.
   * Then: the line read is limited to the subject's orders and the line
   * carries its totals.
   */
  it("When: lines are requested Then: reads only the subject's orders and adds each line's totals", async () => {
    const {
      service,
      subjectsToEcommerceModuleOrdersFind,
      ordersToProductsFind,
      ordersToProductsGetTotal,
    } = createService();

    const result = await service.execute({ id: "subject-1" });

    expect(subjectsToEcommerceModuleOrdersFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: "subject-1" }],
        },
      },
    });
    expect(ordersToProductsFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: ["order-1", "order-2"],
            },
          ],
        },
      },
    });
    expect(ordersToProductsGetTotal).toHaveBeenCalledWith({ id: "line-1" });
    expect(result).toEqual([
      { id: "line-1", orderId: "order-1", productId: "product-1", total },
    ]);
  });

  /**
   * BDD Scenario
   * Given: caller filters that name an order of another subject.
   * When: the lines are requested with them.
   * Then: the filters are appended to the constraint to the subject's orders,
   * so they narrow the read and cannot widen it.
   */
  it("When: the caller filters the lines Then: the filters narrow the subject's orders", async () => {
    const { service, ordersToProductsFind } = createService();
    const callerFilters = [
      { column: "orderId", method: "eq", value: "order-of-another-subject" },
      { column: "productId", method: "eq", value: "product-1" },
    ] as any;

    await service.execute({ id: "subject-1", filters: callerFilters });

    expect(ordersToProductsFind).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: ["order-1", "order-2"],
            },
            ...callerFilters,
          ],
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a subject with no orders.
   * When: the lines are requested.
   * Then: it answers an empty list without reading lines or totals.
   */
  it("When: the subject has no orders Then: answers no lines", async () => {
    const { service, ordersToProductsFind, ordersToProductsGetTotal } =
      createService({ subjectsToEcommerceModuleOrders: [] });

    await expect(service.execute({ id: "subject-1" })).resolves.toEqual([]);
    expect(ordersToProductsFind).not.toHaveBeenCalled();
    expect(ordersToProductsGetTotal).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a subject whose orders have no lines that match.
   * When: the lines are requested.
   * Then: it answers an empty list without computing totals.
   */
  it("When: no line matches Then: answers no lines", async () => {
    const { service, ordersToProductsGetTotal } = createService({
      ordersToProducts: [],
    });

    await expect(service.execute({ id: "subject-1" })).resolves.toEqual([]);
    expect(ordersToProductsGetTotal).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: two lines, one of a product whose price cannot be computed.
   * When: the lines are requested.
   * Then: both lines are answered, the incomplete one with no totals, and the
   * failure is logged.
   */
  it("When: a line's total cannot be computed Then: answers the line without totals", async () => {
    const { service, ordersToProductsGetTotal } = createService({
      ordersToProducts: [
        { id: "line-1", orderId: "order-1", productId: "product-1" },
        { id: "line-2", orderId: "order-2", productId: "product-2" },
      ],
    });
    const loggerError = jest
      .spyOn(logger, "error")
      .mockImplementation(() => logger);

    ordersToProductsGetTotal.mockImplementation(async ({ id }) => {
      if (id === "line-2") {
        throw new Error("Product does not have any target price attributes");
      }

      return total;
    });

    await expect(service.execute({ id: "subject-1" })).resolves.toEqual([
      { id: "line-1", orderId: "order-1", productId: "product-1", total },
      { id: "line-2", orderId: "order-2", productId: "product-2", total: [] },
    ]);
    expect(loggerError).toHaveBeenCalledTimes(1);

    loggerError.mockRestore();
  });
});
