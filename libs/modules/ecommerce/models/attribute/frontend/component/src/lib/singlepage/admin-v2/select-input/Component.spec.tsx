jest.mock(
  "@sps/shared-frontend-components/singlepage/admin/select-input/Component",
  () => ({
    Component: "MockAdminSelectInput",
  }),
);

import { internationalization } from "@sps/shared-configuration";
import { Component } from "./Component";

describe("attribute admin-v2 select-input component", () => {
  it("passes ecommerce/attribute metadata and default render field", () => {
    const element = Component({
      variant: "admin-v2-select-input",
      data: [],
    } as any) as any;

    expect(element.props.module).toBe("ecommerce");
    expect(element.props.name).toBe("attribute");
    expect(element.props.label).toBe("attribute");
    expect(element.props.renderField).toBe("adminTitle");
  });

  it("formats display label with all attribute primitive values", () => {
    const element = Component({
      variant: "admin-v2-select-input",
      data: [],
    } as any) as any;

    const render = element.props.renderFunction as (entity: any) => string;
    const language = internationalization.defaultLanguage.code;

    const output = render({
      adminTitle: "Primary color",
      string: { [language]: "Blue" },
      number: 42,
      boolean: true,
      datetime: "2025-01-01T10:15:00",
    });

    expect(output).toContain("Primary color");
    expect(output).toContain("String: Blue");
    expect(output).toContain("Number: 42");
    expect(output).toContain("Boolean: true");
    expect(output).toContain("Datetime: 01.01.2025 10:15");
  });
});
