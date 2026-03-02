import { Configuration } from "./configuration";

describe("ecommerce products-to-attributes configuration", () => {
  it("maps product and attribute ids from seed results", () => {
    const repository = new Configuration().getConfiguration().repository;
    const filters = repository.seed.filters || [];

    const productFilter = filters.find(
      (filter) => filter.column === "productId",
    );
    const attributeFilter = filters.find(
      (filter) => filter.column === "attributeId",
    );

    const seeds = [
      {
        module: "ecommerce",
        name: "product",
        type: "model",
        seeds: [
          {
            dump: { id: "old-product-id" },
            new: { id: "new-product-id" },
          },
        ],
      },
      {
        module: "ecommerce",
        name: "attribute",
        type: "model",
        seeds: [
          {
            dump: { id: "old-attribute-id" },
            new: { id: "new-attribute-id" },
          },
        ],
      },
    ];

    const valueContext = {
      seeds,
      entity: {
        dump: {
          productId: "old-product-id",
          attributeId: "old-attribute-id",
        },
      },
    };

    expect(productFilter?.value(valueContext as any)).toBe("new-product-id");
    expect(attributeFilter?.value(valueContext as any)).toBe(
      "new-attribute-id",
    );
  });

  it("transforms relation payload ids using mapped seed values", () => {
    const repository = new Configuration().getConfiguration().repository;
    const transformers = repository.seed.transformers || [];

    const productIdTransformer = transformers.find(
      (transformer) => transformer.field === "productId",
    );
    const attributeIdTransformer = transformers.find(
      (transformer) => transformer.field === "attributeId",
    );

    const seeds = [
      {
        module: "ecommerce",
        name: "product",
        type: "model",
        seeds: [
          {
            dump: { id: "old-product-id" },
            new: { id: "new-product-id" },
          },
        ],
      },
      {
        module: "ecommerce",
        name: "attribute",
        type: "model",
        seeds: [
          {
            dump: { id: "old-attribute-id" },
            new: { id: "new-attribute-id" },
          },
        ],
      },
    ];

    const transformContext = {
      seeds,
      entity: {
        dump: {
          productId: "old-product-id",
          attributeId: "old-attribute-id",
        },
      },
    };

    expect(productIdTransformer?.transform(transformContext as any)).toBe(
      "new-product-id",
    );
    expect(attributeIdTransformer?.transform(transformContext as any)).toBe(
      "new-attribute-id",
    );
  });
});
