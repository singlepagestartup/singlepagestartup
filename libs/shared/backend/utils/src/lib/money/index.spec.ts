import {
  addMoney,
  moneyMinorUnits,
  parseExactMonetaryAmount,
  providerMinorUnits,
} from "./index";

describe("exact monetary amounts", () => {
  it("preserves integer amounts and fractional main units", () => {
    expect(parseExactMonetaryAmount(5000)).toBe(5000);
    expect(parseExactMonetaryAmount("12.34")).toBe(12.34);
    expect(addMoney(0.1, 0.2)).toBe(0.3);
    expect(providerMinorUnits(12.34)).toBe(1234);
    expect(providerMinorUnits("20.00", 0)).toBe(20);
    expect(moneyMinorUnits("0.00000001")).toBe(1n);
  });

  it("rejects truncation, invalid values and unsafe provider amounts", () => {
    for (const value of [
      "",
      " 1",
      "-1",
      "NaN",
      "1e2",
      "0.000000001",
      NaN,
      Infinity,
      -1,
    ]) {
      expect(() => parseExactMonetaryAmount(value)).toThrow();
    }
    expect(() => providerMinorUnits("1.001")).toThrow();
    expect(() => providerMinorUnits("1.5", 0)).toThrow();
    expect(() => providerMinorUnits("90071992547409.92")).toThrow();
    expect(() => parseExactMonetaryAmount("9007199254740990.01")).toThrow();
  });
});
