/**
 * BDD Suite: products-to-attributes admin-v2 select-input component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component",
  () => ({
    Component: "MockAdminV2SelectInput",
  }),
);

import { Component } from "./Component";

describe("products-to-attributes admin-v2 select-input component", () => {
  it("passes ecommerce relation metadata to shared select component", () => {
    const element = Component({
      variant: "admin-v2-select-input",
      renderField: "attributeId",
    } as any) as any;

    expect(element.props.module).toBe("ecommerce");
    expect(element.props.name).toBe("products-to-attributes");
    expect(element.props.label).toBe("products-to-attributes");
    expect(element.props.renderField).toBe("attributeId");
  });
});
