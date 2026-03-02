jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/select-input/Component",
  () => ({
    Component: "MockAdminV2SelectInput",
  }),
);

import { internationalization } from "@sps/shared-configuration";
import { Component } from "./Component";

describe("product admin-v2 select-input component", () => {
  it("passes ecommerce/product metadata and default render field", () => {
    const element = Component({
      variant: "admin-v2-select-input",
    } as any) as any;

    expect(element.props.module).toBe("ecommerce");
    expect(element.props.name).toBe("product");
    expect(element.props.label).toBe("product");
    expect(element.props.renderField).toBe("adminTitle");
  });

  it("formats label with localized title, adminTitle and variant", () => {
    const element = Component({
      variant: "admin-v2-select-input",
    } as any) as any;

    const render = element.props.renderFunction as (entity: any) => string;
    const language = internationalization.defaultLanguage.code;

    expect(
      render({
        title: { [language]: "Coffee Mug" },
        adminTitle: "Mug #1",
        variant: "default",
      }),
    ).toBe("Coffee Mug | Mug #1 | default");

    expect(
      render({
        title: {},
        adminTitle: "Mug #2",
      }),
    ).toBe("Untitled | Mug #2 | Unknown Variant");
  });
});
