import { Service } from "./thread-context";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";

it("projects only visible linked products and work for each authorized thread", async () => {
  const productLinks = [
    { threadId: "one", ecommerceModuleProductId: "cover", variant: "default" },
    { threadId: "one", ecommerceModuleProductId: "cover", variant: "default" },
    {
      threadId: "one",
      ecommerceModuleProductId: "hidden-product",
      variant: "default",
    },
    {
      threadId: "one",
      ecommerceModuleProductId: "hidden-link",
      variant: "hidden",
    },
    {
      threadId: "two",
      ecommerceModuleProductId: "carrier",
      variant: "default",
    },
  ];
  const products = [
    {
      id: "cover",
      slug: "cover-service",
      title: { ru: "Обложка" },
      description: "Internal material",
    },
    { id: "hidden-product", slug: "hidden", title: {}, variant: "hidden" },
    { id: "carrier", slug: "carrier-service", title: { ru: "Доставка" } },
  ];
  const findWorkLinks = jest.fn().mockResolvedValue([{ threadId: "two" }]);
  const findProductLinks = jest.fn().mockResolvedValue(productLinks);
  const findProducts = jest.fn().mockResolvedValue(products);
  const reader = new Service({
    modules: {
      social: {
        threadsToCrmModuleTasks: { find: findWorkLinks },
        threadsToEcommerceModuleProducts: { find: findProductLinks },
      },
      ecommerce: { product: { find: findProducts } },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);

  await expect(
    reader.enrich([{ id: "one" }, { id: "two" }] as ISocialModuleThread[]),
  ).resolves.toEqual([
    {
      id: "one",
      hasCustomerWork: false,
      linkedProducts: [
        { id: "cover", slug: "cover-service", title: { ru: "Обложка" } },
      ],
    },
    {
      id: "two",
      hasCustomerWork: true,
      linkedProducts: [
        { id: "carrier", slug: "carrier-service", title: { ru: "Доставка" } },
      ],
    },
  ]);
  const filter = {
    column: "threadId",
    method: "inArray",
    value: ["one", "two"],
  };
  expect(findWorkLinks.mock.calls[0][0].params.filters.and).toEqual([filter]);
  expect(findProductLinks.mock.calls[0][0].params.filters.and).toEqual([
    filter,
  ]);
  expect(findProducts.mock.calls[0][0].params.filters.and[0].value).toEqual([
    "cover",
    "hidden-product",
    "carrier",
  ]);
});
