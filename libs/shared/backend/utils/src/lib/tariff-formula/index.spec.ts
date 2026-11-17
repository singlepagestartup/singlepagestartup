import { compileTariffFormula } from "./index";

describe("tariff formula", () => {
  it("uses decimal inputs and arithmetic precedence", () => {
    const expression = compileTariffFormula("(base + 0.2) * quantity - -1");
    expect(expression.variables).toEqual(["base", "quantity"]);
    expect(expression.evaluate({ base: "0.1", quantity: "3" }).toString()).toBe(
      "1.9",
    );
  });
  it.each(["", "4 +", "(x", "x()", "a b", "1.2.3", "a;b", "1 neg 2"])(
    "rejects invalid arithmetic: %s",
    (source) => {
      expect(() => compileTariffFormula(source)).toThrow();
    },
  );
  it("rejects a missing input, division by zero and negative charges", () => {
    for (const formula of ["missing", "2/0", "-(2+3)"]) {
      expect(() => compileTariffFormula(formula).evaluate({})).toThrow();
    }
  });
});
