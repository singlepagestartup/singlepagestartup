import { Service } from "./index";
import type { Repository } from "../../repository";
import type { Table } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/repository/database";
import type { IReservationLine } from "./reservation";

type Entity = typeof Table.$inferSelect;

function fixture() {
  const rows = new Map<string, Entity>();
  const defaults = {
    id: "relation",
    orderId: "order",
    billingModulePaymentIntentId: "intent",
    orderLineId: null,
    offerId: null,
    reservationQuantity: 0,
    reservationStatus: "none",
    purchaseSnapshot: null,
  };
  const repository = {
    find: jest.fn(async (props?: any) =>
      [...rows.values()].filter((row) =>
        (props?.params?.filters?.and ?? []).every((filter: any) => {
          const value = row[filter.column as keyof Entity];
          if (filter.method === "inArray") {
            return filter.value.includes(value);
          }
          if (filter.method === "ne") {
            return value !== filter.value;
          }
          return value === filter.value;
        }),
      ),
    ),
    insert: jest.fn(async (data) => {
      const row = { ...defaults, ...data } as Entity;
      rows.set(row.id, row);
      return row;
    }),
    updateFirstByField: jest.fn(async (_field, id, data) => {
      const row = { ...rows.get(id), ...data } as Entity;
      rows.set(id, row);
      return row;
    }),
    lockOffers: jest.fn(async () => undefined),
    stockRowsForOffers: jest.fn(async () => [
      { offerId: "offer", attributeId: "stock", number: "2" },
    ]),
  };
  const attribute = {
    update: jest.fn(async (props) => ({ id: "stock", ...props.data })),
  };
  const service = new Service(
    repository as unknown as Repository,
    attribute as unknown as Service["attribute"],
  );
  const line: IReservationLine = {
    orderId: "order",
    orderLineId: "line",
    offerId: "offer",
    quantity: 1,
    snapshot: {
      version: 1,
      currencyId: "currency",
      amount: "12.34",
      orderAmount: "12.34",
      purchaseType: "one_off",
      parentLineId: null,
      quoteVersion: "fixture",
      quoteExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      charge: {
        offerId: "offer",
        productId: "product",
        storeId: "store",
        providerStoreId: "store",
        role: "product",
        recurrence: "each",
        quantity: 1,
        stockQuantity: 2,
        amount: "12.34",
        formula: "unit_price * quantity",
        formulaVersion: "v1",
        inputs: { unit_price: "12.34", quantity: "1" },
      },
      destination: {},
    },
  };
  return { rows, repository, attribute, service, line };
}

it("settles through Attribute's service after removing its active hold", async () => {
  const f = fixture();
  const create = jest.spyOn(f.service, "create");
  const update = jest.spyOn(f.service, "update");
  await f.service.reserveCharges({
    paymentIntentId: "intent",
    lines: [f.line],
  });
  expect(
    await f.service.reservedQuantities({ offerIds: ["offer", "other"] }),
  ).toEqual({ offer: 1, other: 0 });
  f.attribute.update.mockImplementation(async (props) => {
    expect(f.rows.get("relation")?.reservationStatus).toBe("consumed");
    return props.data;
  });
  await expect(
    f.service.settleReservations({ paymentIntentIds: ["intent"] }),
  ).resolves.toEqual({ reconciliationPaymentIntentIds: [] });
  expect(f.attribute.update).toHaveBeenCalledWith({
    id: "stock",
    data: { number: "1" },
  });
  expect(create).toHaveBeenCalledWith({
    data: expect.objectContaining({ reservationStatus: "held" }),
  });
  expect(update).toHaveBeenCalledWith({
    id: "relation",
    data: expect.objectContaining({ reservationStatus: "consumed" }),
  });
  await f.service.settleReservations({ paymentIntentIds: ["intent"] });
  expect(f.attribute.update).toHaveBeenCalledTimes(1);
  expect(await f.service.reservedQuantities({ offerIds: ["offer"] })).toEqual({
    offer: 0,
  });
});

it("counts only active holds for requested offers and can exclude an attempt", async () => {
  const f = fixture();
  await f.service.reserveCharges({
    paymentIntentId: "intent",
    lines: [f.line],
  });
  const reserved = f.rows.get("relation")!;
  for (const [id, reservationStatus, reservationQuantity, offerId] of [
    ["other-held", "held", 2, "offer"],
    ["review", "reconciliation", 3, "offer"],
    ["negative", "held", -5, "offer"],
    ["released", "released", 10, "offer"],
    ["consumed", "consumed", 10, "offer"],
    ["outside", "held", 10, "outside"],
  ] as const) {
    f.rows.set(id, {
      ...reserved,
      id,
      billingModulePaymentIntentId: "other-intent",
      reservationStatus,
      reservationQuantity,
      offerId,
    });
  }
  expect(
    await f.service.reservedQuantities({
      offerIds: ["offer", "empty"],
      excludePaymentIntentId: "intent",
    }),
  ).toEqual({ offer: 5, empty: 0 });
  f.repository.find.mockClear();
  expect(await f.service.reservedQuantities({ offerIds: [] })).toEqual({});
  expect(f.repository.find).not.toHaveBeenCalled();
});

it.each([null, "-1", "1.5", "9007199254740992"])(
  "rejects invalid stock before creating a hold: %p",
  async (number) => {
    const f = fixture();
    f.repository.stockRowsForOffers.mockResolvedValue([
      { offerId: "offer", attributeId: "stock", number },
    ] as any);
    await expect(
      f.service.reserveCharges({ paymentIntentId: "intent", lines: [f.line] }),
    ).rejects.toThrow("stock is invalid or ambiguous");
    expect(f.repository.insert).not.toHaveBeenCalled();
  },
);
