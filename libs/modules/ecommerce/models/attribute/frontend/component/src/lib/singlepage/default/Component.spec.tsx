jest.mock(
  "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component",
  () => ({ Component: "MockCurrency" }),
);

import { Component } from "./Component";

describe("attribute number display", () => {
  it.each([
    [769.230769, "769"],
    [2307.692307, "2,308"],
    [3846.153846, "3,846"],
    [7692.307692, "7,692"],
    [23076.923076, "23,077"],
    [1.5, "2"],
    ["769.230769", "769"],
    ["2307.692307", "2,308"],
    ["3846.153846", "3,846"],
    ["7692.307692", "7,692"],
    ["23076.923076", "23,077"],
    ["1.5", "2"],
  ])("rounds %s for a whole-token display", (number, expected) => {
    const data = Object.freeze({ id: "attribute-id", number });
    const view = Component({
      variant: "default",
      isServer: false,
      language: "en",
      data,
      field: "number",
      maximumFractionDigits: 0,
    } as any);

    expect(view.props.children[0].props.children).toBe(expected);
    expect(data.number).toBe(number);
  });

  it("uses Russian grouping for whole tokens", () => {
    const view = Component({
      variant: "default",
      isServer: false,
      language: "ru",
      data: { id: "attribute-id", number: "2307.692307" },
      field: "number",
      maximumFractionDigits: 0,
    } as any);

    expect(view.props.children[0].props.children).toBe("2\u00a0308");
  });

  it("preserves a price's decimals when no rounding is requested", () => {
    const view = Component({
      variant: "default",
      isServer: false,
      language: "ru",
      data: { id: "attribute-id", number: "29.99" },
      field: "number",
    } as any);

    expect(view.props.children[0].props.children).toBe("29.99");
  });

  it("does not reinterpret numeric-looking text as a token quantity", () => {
    const view = Component({
      variant: "default",
      isServer: false,
      language: "en",
      data: { id: "attribute-id", string: { en: "1.5" } },
      field: "string",
      maximumFractionDigits: 0,
    } as any);
    expect(view.props.children[0].props.children).toBe("1.5");
  });
});
