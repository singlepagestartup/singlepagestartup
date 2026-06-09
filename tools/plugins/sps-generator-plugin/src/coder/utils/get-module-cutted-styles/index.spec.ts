/**
 * BDD Suite: get-model-by-name.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { util } from ".";

describe("get-module-cutted-styles", () => {
  it("should take WeBr from website-builder", () => {
    const name = "website-builder";

    const result = util({ name });

    expect(result.pascalCased).toBe("WeBr");
  });

  it("should take we_br from website-builder", () => {
    const name = "website-builder";

    const result = util({ name });

    expect(result.snakeCased).toBe("we_br");
  });
});
