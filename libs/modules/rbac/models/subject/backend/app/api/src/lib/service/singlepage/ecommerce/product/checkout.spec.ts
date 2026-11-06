import { Service } from "./checkout";

it.each([0, -1, 1.5, 1001])("rejects quantity %s before reading the product", async (quantity) => {
  const findById = jest.fn();
  const service = new Service({ ecommerceModule: { product: { findById } } } as any);
  await expect(service.execute({ id: "subject", productId: "product", data: { quantity } })).rejects.toThrow("Quantity");
  expect(findById).not.toHaveBeenCalled();
});
