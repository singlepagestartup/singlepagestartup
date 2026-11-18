import { paymentProviderPrecision } from "./index";
import { providerMinorUnits } from "@sps/backend-utils";

it("allows an exact provider after PayKeeper cannot represent a three-place amount", () => {
  const currency = { slug: "bhd", minorUnitDigits: 3 };
  expect(() =>
    providerMinorUnits(
      "1.005",
      paymentProviderPrecision("paykeeper", currency),
    ),
  ).toThrow("cannot represent");
  expect(
    providerMinorUnits("1.005", paymentProviderPrecision("dummy", currency)),
  ).toBe(1005);
  expect(() => paymentProviderPrecision("stripe", currency)).toThrow(
    "choose another",
  );
  expect(paymentProviderPrecision("telegram-star", "telegram-star")).toBe(0);
  expect(
    providerMinorUnits("12.34", paymentProviderPrecision("stripe", "usd")),
  ).toBe(1234);
});
