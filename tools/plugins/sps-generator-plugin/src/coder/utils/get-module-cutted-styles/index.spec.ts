/**
 * BDD Suite: get-model-by-name.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { util } from ".";

describe("get-model-by-name", () => {
  it("should take SPSWB from website-builder", () => {
    const name = "website-builder";

    const result = util({ name });

    expect(result.pascalCased).toBe("SPSWB");
  });

  it("should take sps_w_b from website-builder", () => {
    const name = "website-builder";

    const result = util({ name });

    expect(result.snakeCased).toBe("sps_w_b");
  });
});
