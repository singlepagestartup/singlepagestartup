import { randomUUID } from "node:crypto";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import {
  createEcommerceOffer,
  setEcommerceCatalogueAttribute,
} from "./ecommerce-catalog";

afterEach(() => jest.restoreAllMocks());
test("offer dry run validates the complete graph without a write", async () => {
  const action = jest.spyOn(subjectApi, "ecommerceModuleOfferCreate");
  const result = await createEcommerceOffer(
    {
      subjectId: randomUUID(),
      data: {
        productId: randomUUID(),
        prices: [{ currencyId: randomUUID(), amount: "5000" }],
        stockQuantity: "3",
      },
    },
    {},
  );
  expect(result).toMatchObject({
    operation: "ecommerce-offer-create",
    dryRun: true,
  });
  expect(action).not.toHaveBeenCalled();
});
test("offer apply delegates to the same Subject operation with caller credentials", async () => {
  const subjectId = randomUUID();
  const productId = randomUUID();
  const now = new Date();
  const common = { createdAt: now, updatedAt: now, variant: "default" };
  const action = jest
    .spyOn(subjectApi, "ecommerceModuleOfferCreate")
    .mockResolvedValue({
      product: {
        ...common,
        id: productId,
        kind: "physical",
        type: "one_off",
        slug: "test-product",
        adminTitle: "Test product",
        title: {},
        shortDescription: {},
        description: {},
        metadata: {},
      },
      offer: {
        ...common,
        id: randomUUID(),
        productId,
        storeId: randomUUID(),
        sku: "test-offer",
        orderIndex: 0,
        className: null,
        configurationKey: "",
        settings: {},
      },
    });
  const headers = { Authorization: "Bearer caller-access-token" };
  const result = await createEcommerceOffer(
    {
      subjectId,
      data: {
        productId,
        prices: [{ currencyId: randomUUID(), amount: "5000" }],
      },
      dryRun: false,
    },
    headers,
  );
  expect(action).toHaveBeenCalledWith(
    expect.objectContaining({ id: subjectId, options: { headers } }),
  );
  expect(result).toMatchObject({
    product: { id: productId },
    offer: { productId },
  });
});
test("stock dry run rejects fractional values and mismatched ownership scope", async () => {
  for (const ownerType of ["store", "offer"]) {
    await expect(
      setEcommerceCatalogueAttribute(
        {
          subjectId: randomUUID(),
          data: {
            owner: { type: ownerType, id: randomUUID() },
            key: "stock_quantity",
            field: "number",
            number: "1.5",
          },
        },
        {},
      ),
    ).rejects.toThrow();
  }
});
