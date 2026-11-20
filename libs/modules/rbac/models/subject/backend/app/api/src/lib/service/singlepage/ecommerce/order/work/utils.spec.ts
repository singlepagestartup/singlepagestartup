import { calculateConfirmedResultPrice } from "./utils";

const settlement = (id: string, currencyId: string, workAmount: string) => ({
  id,
  currencyId,
  settlement: { workAmount },
});
const observedAt = "2026-11-19T00:00:00.000Z";
const quotedAt = "2026-11-19T01:00:00.000Z";
const rate = {
  fromCurrencyId: "expense",
  toCurrencyId: "sale",
  source: "Fixture exchange rate",
  rate: "0.01",
  observedAt,
};
const input = {
  reservations: [
    settlement("settled-first", "sale", "2.345"),
    settlement("settled-second", "expense", "0.5"),
  ],
  currencyId: "sale",
  precision: 2,
  quotedAt,
  tariff: {
    kind: "confirmed-cost" as const,
    multiplier: "1.5",
    conversions: [rate],
  },
};

it("prices confirmed work using recorded exchange rates and rounds the final total once", () => {
  expect(calculateConfirmedResultPrice(input)).toEqual({
    price: "3.53",
    costs: [
      {
        currencyId: "sale",
        amount: "2.345",
        reservationIds: ["settled-first"],
      },
      {
        currencyId: "expense",
        amount: "0.5",
        reservationIds: ["settled-second"],
        conversion: rate,
      },
    ],
  });
});

it("refuses a missing or future exchange rate and a zero result price", () => {
  expect(() =>
    calculateConfirmedResultPrice({
      ...input,
      tariff: { ...input.tariff, conversions: [] },
    }),
  ).toThrow("No exchange rate");
  expect(() =>
    calculateConfirmedResultPrice({
      ...input,
      quotedAt: "2026-11-18T00:00:00.000Z",
    }),
  ).toThrow("dated in the future");
  expect(() =>
    calculateConfirmedResultPrice({
      ...input,
      reservations: [settlement("zero", "sale", "0")],
    }),
  ).toThrow("positive result price");
});
