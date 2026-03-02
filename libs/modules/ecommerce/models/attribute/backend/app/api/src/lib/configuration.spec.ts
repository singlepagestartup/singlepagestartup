import { Configuration } from "./configuration";

describe("ecommerce attribute configuration", () => {
  it("defines attribute seed metadata and slug filter", () => {
    const repository = new Configuration().getConfiguration().repository;

    expect(repository.seed.module).toBe("ecommerce");
    expect(repository.seed.name).toBe("attribute");
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
            slug: "attribute-slug",
          },
        },
      } as any),
    ).toBe("attribute-slug");
  });
});
