import { Service, type IConstructorProps } from "./catalog";

function fixture(receiptMethod?: string) {
  const values = {
    offers: [
      {
        id: "shipping",
        productId: "product",
        storeId: "seller",
        variant: "default",
        settings: { receiptMethod },
      },
    ],
    products: [{ id: "product", kind: "service", variant: "default" }],
    links: [{ id: "link" }],
  };
  const readers = Object.fromEntries(
    [
      "offers",
      "products",
      "links",
      "offerAttributes",
      "productAttributes",
      "storeAttributes",
      "attributes",
      "attributeKeys",
      "keyValues",
      "valueCurrencies",
      "currencies",
    ].map((name) => [
      name,
      { find: jest.fn(async () => values[name as keyof typeof values] ?? []) },
    ]),
  );
  const service = new Service(readers as unknown as IConstructorProps);
  return { service, readers, values };
}

it("loads the selected shipping offer and its Product through scoped readers", async () => {
  const { service, readers } = fixture("shipping");
  expect(await service.addressSuggestionsOffer("shipping")).toMatchObject({
    offer: { id: "shipping" },
    product: { id: "product" },
    hasDeliveryLink: false,
  });
  expect(readers.offers.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "id", method: "inArray", value: ["shipping"] }],
      },
    },
  });
  expect(readers.products.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "id", method: "inArray", value: ["product"] }],
      },
    },
  });
  expect(readers.links.find).not.toHaveBeenCalled();
});

it("checks an incoming delivery link only when receipt method is unset", async () => {
  const { service, readers } = fixture();
  expect(
    (await service.addressSuggestionsOffer("shipping"))?.hasDeliveryLink,
  ).toBe(true);
  expect(readers.links.find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          { column: "targetOfferId", method: "eq", value: "shipping" },
          { column: "variant", method: "eq", value: "delivery" },
        ],
      },
      limit: 1,
    },
  });
});

it("stops after a missing offer", async () => {
  const { service, readers } = fixture("shipping");
  readers.offers.find.mockResolvedValue([]);
  expect(await service.addressSuggestionsOffer("missing")).toBeUndefined();
  expect(readers.products.find).not.toHaveBeenCalled();
  expect(readers.links.find).not.toHaveBeenCalled();
});

it("loads product-wide links from archived siblings and deduplicates provider evidence in a batch", async () => {
  const { service, readers } = fixture();
  const main = {
    id: "main",
    productId: "product",
    storeId: "seller",
    variant: "default",
  };
  const archived = {
    ...main,
    id: "archived",
    storeId: "old-seller",
    variant: "hidden",
  };
  const option = {
    id: "service",
    productId: "service-product",
    storeId: "contractor",
    variant: "default",
  };
  const provider = { ...option, id: "provider", variant: "provider" };
  const delivery = {
    id: "delivery-link",
    sourceOfferId: archived.id,
    targetOfferId: option.id,
    variant: "delivery",
  };
  const delegated = {
    id: "provider-link",
    sourceOfferId: option.id,
    targetOfferId: provider.id,
    variant: "fulfilled-by",
  };
  readers.offers.find
    .mockResolvedValueOnce([main, option])
    .mockResolvedValueOnce([main, archived, option, provider])
    .mockResolvedValueOnce([main, archived, option, provider]);
  readers.links.find
    .mockResolvedValueOnce([delivery, delegated])
    .mockResolvedValueOnce([delegated]);
  const catalog = await service.catalog([main.id, option.id]);
  expect(readers.offers.find).toHaveBeenNthCalledWith(2, {
    params: {
      filters: {
        and: [
          {
            column: "productId",
            method: "inArray",
            value: ["product", "service-product"],
          },
        ],
      },
    },
  });
  expect(readers.links.find).toHaveBeenNthCalledWith(1, {
    params: {
      filters: {
        and: [
          {
            column: "sourceOfferId",
            method: "inArray",
            value: ["main", "archived", "service", "provider"],
          },
        ],
      },
    },
  });
  expect(catalog.links).toEqual([delivery]);
  expect(catalog.providers).toEqual([delegated]);
  expect(catalog.offers.has(archived.id)).toBe(true);
});
