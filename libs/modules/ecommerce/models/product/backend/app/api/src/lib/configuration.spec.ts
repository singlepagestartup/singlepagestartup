import { Configuration } from "./configuration";

describe("ecommerce product configuration", () => {
  it("defines product seed metadata and slug filter", () => {
    const repository = new Configuration().getConfiguration().repository;

    expect(repository.seed.module).toBe("ecommerce");
    expect(repository.seed.name).toBe("product");
    expect(repository.seed.type).toBe("model");

    const slugFilter = repository.seed.filters?.find(
      (filter) => filter.column === "slug",
    );

    expect(slugFilter).toBeDefined();
    expect(
      slugFilter?.value({
        seeds: [],
        entity: {
          dump: {
            slug: "product-slug",
          },
        },
      } as any),
    ).toBe("product-slug");
  });
});
