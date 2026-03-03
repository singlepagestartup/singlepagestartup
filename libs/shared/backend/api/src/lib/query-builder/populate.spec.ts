/**
 * BDD Suite: Query Builder | Populate.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { queryBuilder } from "./populate";

describe("Query Builder | Populate", () => {
  it("should take function from passed orderBy method", () => {
    const params = {
      pagesToWidgets: {
        orderBy: {
          column: "orderIndex",
          method: "asc",
        },
      },
    };

    const populateParams = queryBuilder(params as any, "pagesToWidgets");

    expect(typeof populateParams["orderBy"]).toBe("function");
  });
});
