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

describe("price preview bounds", () => {
  const distance = { min: "0" };
  const quantity = { min: "1", max: "3" };

  it("proves a base charge with unbounded road distance using the same decimal precision as the quote", () => {
    const expression = compileTariffFormula("base + rate * distance");
    const bounds = expression.evaluateRange({
      base: { min: "4.15", max: "4.15" },
      rate: { min: "0.25", max: "0.25" },
      distance,
    });
    expect(bounds?.min.toFixed(2)).toBe("4.15");
    expect(bounds?.max).toBeUndefined();
  });

  it("handles fixed, decreasing and explicitly free tariffs", () => {
    const flat = compileTariffFormula("5.75");
    expect(flat.evaluateRange({})?.max?.toString()).toBe("5.75");
    const decreasing = compileTariffFormula("8 - quantity * 2");
    const bounds = decreasing.evaluateRange({ quantity });
    expect(bounds?.min.toString()).toBe("2");
    expect(bounds?.max?.toString()).toBe("6");
    const zero = compileTariffFormula("0 * distance").evaluateRange({
      distance,
    });
    expect(zero?.min.toString()).toBe("0");
    expect(zero?.max?.toString()).toBe("0");
  });

  it("withholds amounts when the lower bound cannot be attained or the formula can divide by zero", () => {
    for (const source of [
      "quantity / quantity",
      "1 / (distance + 1)",
      "100 / distance",
      "10 - distance",
      "missing + 1",
    ]) {
      expect(
        compileTariffFormula(source).evaluateRange({ quantity, distance }),
      ).toBeUndefined();
    }
  });

  it("refuses invalid and inverted bounds and oversized amounts", () => {
    const expression = compileTariffFormula("q");
    for (const q of [
      { min: "" },
      { min: "1", max: "0" },
      { min: "0", max: "NaN" },
      { min: "9007199254740992" },
    ]) {
      expect(expression.evaluateRange({ q })).toBeUndefined();
    }
  });
});
