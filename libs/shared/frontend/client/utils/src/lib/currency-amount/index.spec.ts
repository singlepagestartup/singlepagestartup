import { formatCurrencyAmount } from "./index";

describe("quoted currency amounts", () => {
  it.each([
    ["5000.00", "ru", "5\u00a0000"],
    ["1234.56", "ru", "1\u00a0234,56"],
    ["1234.56", "en", "1,234.56"],
    ["12.34000000", "ru", "12,34"],
    ["0.00000001", "ru", "0,00000001"],
    ["-0.00120000", "ru", "-0,0012"],
    ["0.00", "ru", "0"],
    ["9007199254740993.12345678", "en", "9,007,199,254,740,993.12345678"],
    ["1234.56", "ar-EG", "١٬٢٣٤٫٥٦"],
  ])(
    "formats %s in %s without changing its value",
    (amount, locale, expected) => {
      expect(formatCurrencyAmount(amount, locale)).toBe(expected);
    },
  );

  it("formats numeric values already supplied by the API", () => {
    expect(formatCurrencyAmount(1234.5, "ru")).toBe("1\u00a0234,5");
    expect(formatCurrencyAmount(1e-8, "ru")).toBe("0,00000001");
  });
});
