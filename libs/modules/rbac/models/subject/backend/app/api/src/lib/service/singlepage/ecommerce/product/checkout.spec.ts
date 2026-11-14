import { ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS as quantityBounds } from "@sps/shared-utils";
import { Service } from "./checkout";

it.each([0, -1, 1.5, quantityBounds.max + 1])(
  "rejects quantity %s before reading the product",
  async (quantity) => {
    const findById = jest.fn();
    const service = new Service({
      ecommerceModule: { product: { findById } },
    } as any);
    await expect(
      service.execute({
        id: "subject",
        productId: "product",
        data: { provider: "dummy", quantity },
      }),
    ).rejects.toThrow("Quantity");
    expect(findById).not.toHaveBeenCalled();
  },
);
