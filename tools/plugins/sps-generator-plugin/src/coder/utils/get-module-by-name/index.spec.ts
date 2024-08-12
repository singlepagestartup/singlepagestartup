import { util } from ".";

describe("get-module-by-name", () => {
  it("should take website-builder from name @sps/website-builder-models-slide-backend-schema-relations", () => {
    const name = "@sps/website-builder-models-slide-backend-schema-relations";

    const result = util({ name });
    expect(result).toBe("website-builder");
  });

  it("should take crm from name @sps/crm-models-form-backend-schema-relations", () => {
    const name = "@sps/crm-models-form-backend-schema-relations";

    const result = util({ name });
    expect(result).toBe("crm");
  });
});
