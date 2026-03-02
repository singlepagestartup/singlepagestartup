/**
 * BDD Suite: get-model-by-name.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { util } from ".";

describe("get-model-by-name", () => {
  it("should take slide from name @sps/website-builder-models-slide-backend-schema-relations", () => {
    const name = "@sps/website-builder-models-slide-backend-schema-relations";

    const result = util({ name });
    expect(result).toBe("slide");
  });

  it("should take form from name @sps/crm-models-form-backend-schema-relations", () => {
    const name = "@sps/crm-models-form-backend-schema-relations";

    const result = util({ name });
    expect(result).toBe("form");
  });
});
