import { Service } from "./payment-purchaser";

function fixture() {
  const owners = [{ profileId: "assistant", ecommerceModuleOrderId: "order" }];
  const intents = [
    { orderId: "order", billingModulePaymentIntentId: "payment" },
  ];
  const purchasers = [
    {
      subjectId: "buyer",
      variant: "purchaser",
      billingModulePaymentIntentId: "payment",
    },
  ];
  const find = (rows: any[]) =>
    jest.fn(async (props: any) =>
      rows
        .filter((row) =>
          props.params.filters.and.every((filter: any) =>
            filter.method === "inArray"
              ? filter.value.includes(row[filter.column])
              : row[filter.column] === filter.value,
          ),
        )
        .slice(
          props.params.offset ?? 0,
          (props.params.offset ?? 0) + (props.params.limit ?? rows.length),
        ),
    );
  const dependencies = {
    purchasers: {
      find: find(purchasers),
      create: jest.fn(async ({ data }) => {
        purchasers.push(data);
        return data;
      }),
    },
    ecommerceModule: {
      ordersToBillingModulePaymentIntents: { find: find(intents) },
    },
    socialModule: { profilesToEcommerceModuleOrders: { find: find(owners) } },
  };
  return {
    owners,
    intents,
    purchasers,
    dependencies,
    service: new Service(dependencies as any),
  };
}

it("resolves the buyer of an assistant's order without reading the profile's managers", async () => {
  const { service } = fixture();
  expect(await service.resolveOrder("order")).toEqual({
    subjectId: "buyer",
    profileId: "assistant",
    ecommerceModuleOrderId: "order",
  });
});

it("keeps the original buyer and rejects assigning payment to a second account", async () => {
  const { service, dependencies } = fixture();
  await service.assign({ subjectId: "buyer", paymentIntentId: "payment" });
  await expect(
    service.assign({ subjectId: "manager", paymentIntentId: "payment" }),
  ).rejects.toThrow("ambiguous");
  expect(dependencies.purchasers.create).not.toHaveBeenCalled();
});

it.each(["missing", "different", "ambiguous"])(
  "rejects %s purchasers before fulfillment",
  async (kind) => {
    const { service, intents, purchasers } = fixture();
    if (kind === "missing") {
      purchasers.length = 0;
    } else if (kind === "different") {
      intents.push({
        orderId: "order",
        billingModulePaymentIntentId: "second",
      });
      purchasers.push({
        subjectId: "other",
        variant: "purchaser",
        billingModulePaymentIntentId: "second",
      });
    } else {
      purchasers.push({
        subjectId: "other",
        variant: "purchaser",
        billingModulePaymentIntentId: "payment",
      });
    }
    await expect(service.resolveOrder("order")).rejects.toThrow(/purchaser/);
  },
);

it("finds purchases across the buyer's profiles while excluding another buyer", async () => {
  const { service, owners, intents, purchasers } = fixture();
  owners.push({
    profileId: "personal",
    ecommerceModuleOrderId: "personal-order",
  });
  owners.push({
    profileId: "assistant",
    ecommerceModuleOrderId: "other-order",
  });
  intents.push({
    orderId: "personal-order",
    billingModulePaymentIntentId: "personal-payment",
  });
  intents.push({
    orderId: "other-order",
    billingModulePaymentIntentId: "other-payment",
  });
  purchasers.push({
    subjectId: "buyer",
    variant: "purchaser",
    billingModulePaymentIntentId: "personal-payment",
  });
  purchasers.push({
    subjectId: "other",
    variant: "purchaser",
    billingModulePaymentIntentId: "other-payment",
  });
  expect(await service.orderIdsForSubject("buyer")).toEqual([
    "order",
    "personal-order",
  ]);
});

it("includes purchases beyond the first page of payment intents", async () => {
  const { service, intents, purchasers } = fixture();
  for (let index = 0; index < 150; index++) {
    intents.push({
      orderId: `order-${index}`,
      billingModulePaymentIntentId: `payment-${index}`,
    });
    purchasers.push({
      subjectId: "buyer",
      variant: "purchaser",
      billingModulePaymentIntentId: `payment-${index}`,
    });
  }
  const orders = await service.orderIdsForSubject("buyer");
  expect(orders).toHaveLength(151);
  expect(orders).toContain("order-149");
});
