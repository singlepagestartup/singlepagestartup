/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce order line amount.
 *
 * Given: an order line read through the subject's own route, catalog price data, and order
 * line reads by id that require the Admin role.
 * When: the amount variant renders the line.
 * Then: the amount is computed from the line it is handed and the catalog, without a line
 * request by id.
 */

import { render, screen } from "@testing-library/react";

const findByIdMock = jest.fn();

jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@sps/ecommerce/relations/orders-to-products/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: (...args: unknown[]) => findByIdMock(...args),
  },
}));

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

jest.mock("@sps/ecommerce/models/attribute-key/sdk/server", () => ({
  api: {
    find: jest.fn().mockResolvedValue([{ id: "attribute-key-price" }]),
  },
}));

jest.mock("@sps/ecommerce/models/product/sdk/server", () => ({
  api: {
    findById: jest.fn().mockResolvedValue({ id: "product-1" }),
  },
}));

jest.mock("@sps/ecommerce/relations/products-to-attributes/sdk/server", () => ({
  api: {
    find: jest
      .fn()
      .mockResolvedValue([{ productId: "product-1", attributeId: "price-1" }]),
  },
}));

jest.mock(
  "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server",
  () => ({
    api: {
      find: jest.fn().mockResolvedValue([
        {
          attributeKeyId: "attribute-key-price",
          attributeId: "price-1",
        },
      ]),
    },
  }),
);

jest.mock("@sps/ecommerce/models/attribute/sdk/server", () => ({
  api: {
    find: jest.fn().mockResolvedValue([{ id: "price-1", number: "10" }]),
  },
}));

import { Component } from "@sps/ecommerce/relations/orders-to-products/frontend/component";

describe("Given: an order line handed to the amount variant", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
    findByIdMock.mockReturnValue({ data: undefined, isLoading: true });
  });

  /**
   * BDD Scenario
   * Given: a line of two items of a product priced at 10.
   * When: the amount variant renders the line.
   * Then: it answers 20 and never requests the line by id.
   */
  it("When: the amount renders Then: it computes from the line it is handed", async () => {
    render(
      <Component
        isServer={false}
        variant="amount"
        data={
          {
            id: "line-1",
            orderId: "order-1",
            productId: "product-1",
            quantity: 2,
          } as any
        }
      >
        {({ data }: { data: string | undefined }) => (
          <p data-testid="amount">{data}</p>
        )}
      </Component>,
    );

    expect((await screen.findByTestId("amount")).textContent).toBe("20");
    expect(findByIdMock).not.toHaveBeenCalled();
  });
});
