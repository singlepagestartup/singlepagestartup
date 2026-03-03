/**
 * BDD Suite: ecommerce attribute configuration.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

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
