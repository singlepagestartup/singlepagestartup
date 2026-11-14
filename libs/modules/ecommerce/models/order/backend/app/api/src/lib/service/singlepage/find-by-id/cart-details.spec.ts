import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import { Service } from "./cart-details";
describe("Cart detail capability", () => {
  it("loads only products referenced by this order and preserves missing-product lines", async () => {
    const dependencies = {
      ordersToProducts: {
        find: jest.fn().mockResolvedValue([
          { id: "line-a", orderId: "order", productId: "a", quantity: 2 },
          { id: "line-b", orderId: "order", productId: "b", quantity: 1 },
        ]),
      },
      product: {
        find: jest.fn().mockResolvedValue([{ id: "a", title: { en: "A" } }]),
      },
      ordersToCurrencies: { find: jest.fn().mockResolvedValue([]) },
      total: jest.fn().mockResolvedValue({
        totals: [{ total: 250 }],
        unpriced: [],
        availableCurrencyIds: ["rub"],
      }),
    };
    const result = await new Service(dependencies as any).execute({
      id: "order",
    });
    expect(dependencies.ordersToProducts.find).toHaveBeenCalledWith({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: "order" }] },
      },
    });
    expect(dependencies.product.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "id", method: "inArray", value: ["a", "b"] }],
        },
      },
    });
    expect(result.maxLineQuantity).toBe(quantityBounds.max);
    expect(result.lines[0].product?.id).toBe("a");
    expect(result.lines[1].product).toBeNull();
    expect(result.totals).toEqual([{ total: 250 }]);
  });
  it("does not query an unconstrained product list or total for an empty order", async () => {
    const dependencies = {
      ordersToProducts: { find: jest.fn().mockResolvedValue([]) },
      product: { find: jest.fn() },
      ordersToCurrencies: { find: jest.fn().mockResolvedValue([]) },
      total: jest.fn(),
    };
    expect(
      await new Service(dependencies as any).execute({ id: "empty" }),
    ).toEqual({ lines: [], totals: [], maxLineQuantity: quantityBounds.max });
    expect(dependencies.product.find).not.toHaveBeenCalled();
    expect(dependencies.total).not.toHaveBeenCalled();
  });
  it("preserves a mixed cart's priced amounts and unpriced lines as separate fields", async () => {
    const unpriced = [
      {
        ordersToProductsId: "line",
        productId: "missing-price",
        reason: "No price",
      },
    ];
    const result = await new Service({
      ordersToProducts: {
        find: async () => [{ id: "line", productId: "missing-price" }],
      },
      product: { find: async () => [{ id: "missing-price" }] },
      ordersToCurrencies: { find: async () => [] },
      total: async () => ({ totals: [{ total: 100 }], unpriced }),
    } as any).execute({ id: "order" });
    expect(result.totals.map((amount) => amount.total)).toEqual([100]);
    expect(result.unpriced).toEqual(unpriced);
    expect(result.lines).toHaveLength(1);
  });
});
