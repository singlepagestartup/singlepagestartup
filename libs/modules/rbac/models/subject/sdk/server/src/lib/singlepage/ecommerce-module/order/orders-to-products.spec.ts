/**
 * BDD Suite: subject order lines SDK action.
 *
 * Given: the server SDK wraps the subject's own order lines route.
 * When: the action runs with caller filters.
 * Then: it requests the subject's route with the filters in the query string and answers the
 * lines with their totals.
 */

import QueryString from "qs";
import { action } from "./orders-to-products";

describe("Given: the subject order lines SDK action", () => {
  const originalFetch = global.fetch;
  const lines = [
    {
      id: "line-1",
      orderId: "order-1",
      productId: "product-1",
      quantity: 2,
      total: [
        {
          total: 20,
          billingModuleCurrency: { id: "currency-1", symbol: "$" },
        },
      ],
    },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ data: lines }), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  /**
   * BDD Scenario
   * Given: filters that narrow the lines to one order.
   * When: the action runs for a subject.
   * Then: it requests that subject's order lines route with the filters and
   * answers the lines it receives.
   */
  it("When: the lines of one order are requested Then: calls the subject's route with the filters", async () => {
    const params = {
      filters: {
        and: [{ column: "orderId", method: "eq", value: "order-1" }],
      },
    };

    const result = await action({
      id: "subject-1",
      host: "http://api.test",
      params,
    });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    const [path, query] = String(url).split("?");

    expect(path).toBe(
      "http://api.test/api/rbac/subjects/subject-1/ecommerce-module/orders/orders-to-products",
    );
    expect(QueryString.parse(query)).toEqual(params);
    expect(result).toEqual(lines);
  });
});
