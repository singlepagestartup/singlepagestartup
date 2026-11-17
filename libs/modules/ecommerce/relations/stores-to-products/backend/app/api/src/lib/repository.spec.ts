import { Repository } from "./repository";
import { Table as Offer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as Product } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as Link } from "@sps/ecommerce/relations/offers-to-offers/backend/repository/database";
const mockTrack = jest.fn();
jest.mock("@sps/shared-backend-api", () => ({
  ...jest.requireActual("@sps/shared-backend-api"),
  trackRepositoryRead: (...args: unknown[]) => mockTrack(...args),
}));

function setup(receiptMethod?: string) {
  const repository: Repository = Object.create(Repository.prototype);
  const rows = new Map<unknown, unknown[]>([
    [
      Offer,
      [
        {
          id: "shipping",
          productId: "product",
          variant: "default",
          settings: { receiptMethod },
        },
      ],
    ],
    [Product, [{ id: "product", kind: "service", variant: "default" }]],
    [Link, [{ id: "link" }]],
  ]);
  const select = jest.fn((_columns: Record<string, unknown>) => ({
    from: (table: unknown) => ({
      where: () => ({
        then: (resolve: (value: unknown[]) => void) =>
          Promise.resolve(rows.get(table) ?? []).then(resolve),
        limit: () => Promise.resolve(rows.get(table) ?? []),
      }),
    }),
  }));
  Object.defineProperty(repository, "db", {
    value: { select },
    configurable: true,
  });
  return { repository, select, rows };
}
beforeEach(() => mockTrack.mockReset().mockResolvedValue(undefined));

it("reads only offer settings and public Product fields through tracked lookups", async () => {
  const { repository, select } = setup("shipping");
  expect(await repository.addressSuggestionsOffer("shipping")).toMatchObject({
    offer: { id: "shipping" },
    product: { id: "product" },
    hasDeliveryLink: false,
  });
  expect(mockTrack.mock.calls.map(([table]) => table)).toEqual([
    Offer,
    Product,
  ]);
  expect(mockTrack.mock.calls.map(([, , filters]) => filters)).toEqual([
    { and: [{ column: "id", method: "eq", value: "shipping" }] },
    { and: [{ column: "id", method: "eq", value: "product" }] },
  ]);
  expect(Object.keys(select.mock.calls[0][0])).toEqual([
    "id",
    "productId",
    "variant",
    "settings",
  ]);
  expect(Object.keys(select.mock.calls[1][0])).toEqual([
    "id",
    "kind",
    "variant",
  ]);
});
it("looks up incoming delivery links only when the method needs its delivery default", async () => {
  const { repository, select } = setup();
  expect(
    (await repository.addressSuggestionsOffer("shipping"))?.hasDeliveryLink,
  ).toBe(true);
  expect(select).toHaveBeenCalledTimes(3);
  expect(mockTrack).toHaveBeenLastCalledWith(Link, expect.anything(), {
    and: [
      { column: "targetOfferId", method: "eq", value: "shipping" },
      { column: "variant", method: "eq", value: "delivery" },
    ],
  });
});
it("stops after a missing offer without loading unrelated catalog data", async () => {
  const { repository, rows, select } = setup("shipping");
  rows.set(Offer, []);
  expect(await repository.addressSuggestionsOffer("missing")).toBeUndefined();
  expect(select).toHaveBeenCalledTimes(1);
});
