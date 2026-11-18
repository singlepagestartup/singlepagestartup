import type { IModel } from "./index";
import { getEligibleRetailOffers, selectRetailOffer } from "./retail-offer";

const product = { id: "product", kind: "physical" };
const offer = {
  id: "offer-b",
  productId: product.id,
  storeId: "store-b",
  variant: "default",
  createdAt: new Date("2026-01-02T00:00:00Z"),
  settings: {},
} as IModel;

it("selects the earliest retail association across stores without mutating the input", () => {
  const earlier = {
    ...offer,
    id: "offer-z",
    storeId: "store-z",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  };
  const offers = [offer, earlier];
  expect(selectRetailOffer({ offers, product })).toBe(earlier);
  expect(selectRetailOffer({ offers: [...offers].reverse(), product })).toBe(
    earlier,
  );
  expect(offers).toEqual([offer, earlier]);
});

it("breaks equal timestamps by stable offer id, including serialized timestamps", () => {
  const first = { ...offer, id: "offer-a" };
  const serialized = { ...offer, createdAt: offer.createdAt.toISOString() };
  expect(
    selectRetailOffer({
      offers: [serialized as unknown as IModel, first],
      product,
    }),
  ).toBe(first);
});

it("keeps the explicit eligible selection and does not substitute an invalid one", () => {
  const later = { ...offer, id: "later", createdAt: new Date("2026-02-01") };
  expect(
    selectRetailOffer({ offers: [offer, later], product, offerId: later.id }),
  ).toBe(later);
  expect(
    selectRetailOffer({ offers: [offer], product, offerId: "missing" }),
  ).toBeUndefined();
  expect(
    selectRetailOffer({ offers: [offer], product, storeId: "other-store" }),
  ).toBeUndefined();
});

it("excludes hidden, provider, grant and unrelated associations before selecting", () => {
  const ineligible = [
    { ...offer, id: "hidden", variant: "hidden" },
    { ...offer, id: "provider", variant: "provider" },
    { ...offer, id: "grant", settings: { initialGrant: true } },
    { ...offer, id: "unrelated", productId: "other-product" },
  ];
  expect(
    getEligibleRetailOffers({ offers: [...ineligible, offer], product }),
  ).toEqual([offer]);
  expect(
    selectRetailOffer({ offers: ineligible, product, offerId: "grant" }),
  ).toBeUndefined();
  expect(
    selectRetailOffer({ offers: [offer], product: { ...product, id: "" } }),
  ).toBeUndefined();
});

it("permits a service only when its offer is sold standalone", () => {
  const standalone = {
    ...offer,
    id: "standalone",
    settings: { standalone: true },
  };
  expect(
    selectRetailOffer({
      offers: [offer, standalone],
      product: { ...product, kind: "service" },
    }),
  ).toBe(standalone);
});

it("orders missing or invalid timestamps after dated offers, then by id", () => {
  const invalid = { ...offer, id: "a", createdAt: new Date("invalid") };
  const missing = {
    ...offer,
    id: "z",
    createdAt: undefined,
  } as unknown as IModel;
  expect(
    getEligibleRetailOffers({ offers: [missing, invalid, offer], product }),
  ).toEqual([offer, invalid, missing]);
});
