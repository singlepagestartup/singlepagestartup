/**
 * BDD Suite: repeat a profile's history order as a new purchase.
 *
 * Given: isolated profile carts, order history and payment graphs in PostgreSQL.
 * When: a history order replaces the cart, a write fails, or checkout/merge races.
 * Then: replacement is atomic, old payments survive, and profile writers serialize.
 */
import { randomUUID } from "node:crypto";
import { CRUDService } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Service as CheckoutAttributes } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/startup/find-by-id/checkout-attributes";
import type { IModel as IOrder } from "@sps/ecommerce/models/order/sdk/model";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Repeat } from "./repeat";
import { Service as ResolveProfile } from "./resolve-profile";
import { Service as AssertAccess } from "./access";
import { Service as ResolveCurrency } from "./resolve-currency";
import { Service as CheckoutClaim } from "./checkout-claim";
import { Service as MergeGuestCart } from "./merge-guest-cart";

const paths = {
  product: "@sps/ecommerce/models/product",
  store: "@sps/ecommerce/models/store",
  currency: "@sps/billing/models/currency",
  order: "@sps/ecommerce/models/order",
  profile: "@sps/social/models/profile",
  owners: "@sps/social/relations/profiles-to-ecommerce-module-orders",
  principalProfiles: "@sps/rbac/relations/subjects-to-social-module-profiles",
  lines: "@sps/ecommerce/relations/orders-to-products",
  stores: "@sps/ecommerce/relations/stores-to-orders",
  currencies: "@sps/ecommerce/relations/orders-to-billing-module-currencies",
  attributeKey: "@sps/ecommerce/models/attribute-key",
  attribute: "@sps/ecommerce/models/attribute",
  productsToAttributes: "@sps/ecommerce/relations/products-to-attributes",
  attributeKeysToAttributes:
    "@sps/ecommerce/relations/attribute-keys-to-attributes",
  attributesToBillingModuleCurrencies:
    "@sps/ecommerce/relations/attributes-to-billing-module-currencies",
  paymentIntent: "@sps/billing/models/payment-intent",
  invoice: "@sps/billing/models/invoice",
  intentInvoices: "@sps/billing/relations/payment-intents-to-invoices",
  orderIntents:
    "@sps/ecommerce/relations/orders-to-billing-module-payment-intents",
};

const cleanup: (() => Promise<unknown>)[] = [];

afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of cleanup.splice(0).reverse()) {
    await remove();
  }
});

afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const subjects = new SubjectRepository(new SubjectConfiguration());
  const services: Record<string, any> = {};
  for (const [key, path] of Object.entries(paths)) {
    const { Repository } = await import(
      `${path}/backend/app/api/src/lib/repository`
    );
    const { Configuration } = await import(
      `${path}/backend/app/api/src/lib/configuration`
    );
    const repository = new Repository(new Configuration());
    const service = new CRUDService(repository) as any;
    if (key === "order") {
      service.lockForLifecycle = repository.lockForLifecycle.bind(repository);
    }
    const create = service.create.bind(service);
    service.create = async (props: any) => {
      const entity = await create(props);
      cleanup.push(async () => {
        if (await repository.findFirstByField("id", entity.id)) {
          await repository.deleteFirstByField("id", entity.id);
        }
      });
      return entity;
    };
    services[key] = service;
  }
  const checkoutAttributes = new CheckoutAttributes(
    services.attributeKey,
    services.lines,
    services.product,
    services.productsToAttributes,
    services.attributeKeysToAttributes,
    services.attribute,
    services.attributesToBillingModuleCurrencies,
  );
  services.order.findByIdCheckoutAttributesByCurrency =
    checkoutAttributes.execute.bind(checkoutAttributes);
  const makeSubject = async () => {
    const subject = await subjects.insert({ slug: `repeat-${randomUUID()}` });
    if (!subject.id) {
      throw new Error("Fixture Subject has no ID");
    }
    cleanup.push(() => subjects.deleteFirstByField("id", subject.id));
    return subject;
  };
  const makeProfile = async (subjectId: string) => {
    const profile = await services.profile.create({
      data: { slug: `repeat-profile-${randomUUID()}` },
    });
    await services.principalProfiles.create({
      data: { subjectId, socialModuleProfileId: profile.id },
    });
    return profile;
  };
  const subject = await makeSubject();
  const profile = await makeProfile(subject.id);
  const store = await services.store.create({
    data: { slug: `repeat-store-${randomUUID()}` },
  });
  const currency = await services.currency.create({
    data: {
      slug: `repeat-currency-${randomUUID()}`,
      title: "Repeat test",
      symbol: "test",
    },
  });
  const priceKey = await services.attributeKey.create({
    data: {
      slug: `repeat-price-${randomUUID()}`,
      type: "price",
      field: "number",
    },
  });
  const makeProduct = async () => {
    const product = await services.product.create({
      data: { slug: `repeat-product-${randomUUID()}` },
    });
    const attribute = await services.attribute.create({
      data: { slug: `repeat-attribute-${randomUUID()}`, number: "150" },
    });
    await services.attributeKeysToAttributes.create({
      data: { attributeKeyId: priceKey.id, attributeId: attribute.id },
    });
    await services.productsToAttributes.create({
      data: { productId: product.id, attributeId: attribute.id },
    });
    const priceCurrency =
      await services.attributesToBillingModuleCurrencies.create({
        data: {
          attributeId: attribute.id,
          billingModuleCurrencyId: currency.id,
        },
      });
    return { ...product, priceCurrencyId: priceCurrency.id };
  };
  const product = await makeProduct();
  const makeOrder = async (
    scope: {
      profileId?: string;
      type?: string;
      status?: string;
      lines?: { productId: string; quantity: number }[];
    } = {},
  ) => {
    const order = await services.order.create({
      data: {
        type: scope.type ?? "cart",
        status: scope.status ?? "new",
        ...(scope.type === "history"
          ? { receipt: "original receipt", comment: "original comment" }
          : {}),
      },
    });
    await services.owners.create({
      data: {
        profileId: scope.profileId ?? profile.id,
        ecommerceModuleOrderId: order.id,
      },
    });
    for (const line of scope.lines ?? [
      { productId: product.id, quantity: 2 },
    ]) {
      await services.lines.create({ data: { orderId: order.id, ...line } });
    }
    await services.stores.create({
      data: { orderId: order.id, storeId: store.id },
    });
    await services.currencies.create({
      data: { orderId: order.id, billingModuleCurrencyId: currency.id },
    });
    return order;
  };
  const orderRows = (key: string, orderId: string) =>
    services[key].find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
  const profileOrders = async (profileId = profile.id): Promise<IOrder[]> => {
    const links = await services.owners.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: profileId }],
        },
      },
    });
    const orders: IOrder[] = [];
    for (const link of links) {
      orders.push(
        await services.order.findById({ id: link.ecommerceModuleOrderId }),
      );
    }
    return orders;
  };
  const ecommerceModule = {
    order: services.order,
    product: services.product,
    store: services.store,
    ordersToProducts: services.lines,
    storesToOrders: services.stores,
    ordersToBillingModuleCurrencies: services.currencies,
    ordersToBillingModulePaymentIntents: services.orderIntents,
    attributeKey: services.attributeKey,
    productsToAttributes: services.productsToAttributes,
    attributeKeysToAttributes: services.attributeKeysToAttributes,
    attributesToBillingModuleCurrencies:
      services.attributesToBillingModuleCurrencies,
  };
  const billingModule = {
    currency: services.currency,
    paymentIntent: services.paymentIntent,
    paymentIntentsToInvoices: services.intentInvoices,
  };
  const service = {
    ecommerceModule,
    billingModule,
    socialModule: {
      profile: services.profile,
      profilesToEcommerceModuleOrders: services.owners,
    },
    subjectsToSocialModuleProfiles: services.principalProfiles,
    ecommerceModuleResolveProfile: async (scope: any): Promise<string> =>
      new ResolveProfile(service as any).execute(scope),
    ecommerceModuleOrderAssertAccess: async (scope: any): Promise<void> => {
      const profileId = await service.ecommerceModuleResolveProfile(scope);
      await new AssertAccess({
        profilesToOrders: services.owners,
        ordersToProducts: services.lines,
      }).execute({ ...scope, socialModuleProfileId: profileId });
    },
    ecommerceModuleResolveOrderCurrency: async (scope: any): Promise<string> =>
      new ResolveCurrency({
        ecommerceModule: ecommerceModule as any,
        billingModule: billingModule as any,
      }).execute(scope),
  };
  const repeat = new Repeat({ repository: subjects, service: service as any });
  const source = await makeOrder({ type: "history", status: "completed" });
  const cart = await makeOrder({
    lines: [{ productId: product.id, quantity: 9 }],
  });
  const props = {
    subjectId: subject.id,
    socialModuleProfileId: profile.id,
    orderId: source.id,
  };
  return {
    subjects,
    services,
    subject,
    profile,
    product,
    currency,
    store,
    service,
    source,
    cart,
    props,
    repeat,
    makeSubject,
    makeProfile,
    makeProduct,
    makeOrder,
    orderRows,
    profileOrders,
  };
}

it.each(["paying", "failed", "canceled", "completed"])(
  "replaces only the selected profile's open carts from %s history and preserves its invoice graph",
  async (status) => {
    const f = await fixture();
    await f.services.order.update({ id: f.source.id, data: { status } });
    const secondProduct = await f.makeProduct();
    await f.services.lines.create({
      data: { orderId: f.source.id, productId: secondProduct.id, quantity: 4 },
    });
    const secondCart = await f.makeOrder({
      lines: [{ productId: secondProduct.id, quantity: 7 }],
    });
    const otherProfile = await f.makeProfile(f.subject.id);
    const otherCart = await f.makeOrder({ profileId: otherProfile.id });
    const paying = await f.makeOrder({ type: "history", status: "paying" });
    const intent = await f.services.paymentIntent.create({
      data: { status: "requires_payment_method" },
    });
    const invoice = await f.services.invoice.create({
      data: { status: "open", paymentUrl: "https://example.com/original" },
    });
    const sourceIntent = await f.services.orderIntents.create({
      data: { orderId: f.source.id, billingModulePaymentIntentId: intent.id },
    });
    const intentInvoice = await f.services.intentInvoices.create({
      data: { paymentIntentId: intent.id, invoiceId: invoice.id },
    });
    const sourceBefore = await f.services.order.findById({ id: f.source.id });
    const sourceLines = await f.orderRows("lines", f.source.id);
    const result = await f.repeat.execute(f.props);
    expect(result.orderIds).toHaveLength(1);
    const [id] = result.orderIds;
    expect(await f.services.order.findById({ id: f.cart.id })).toBeUndefined();
    expect(
      await f.services.order.findById({ id: secondCart.id }),
    ).toBeUndefined();
    expect(await f.services.order.findById({ id: otherCart.id })).toEqual(
      otherCart,
    );
    expect(await f.services.order.findById({ id: paying.id })).toEqual(paying);
    expect(await f.services.order.findById({ id: f.source.id })).toEqual(
      sourceBefore,
    );
    expect(await f.orderRows("lines", f.source.id)).toEqual(sourceLines);
    expect(await f.services.order.findById({ id })).toMatchObject({
      type: "cart",
      status: "new",
      receipt: "",
      comment: null,
      subscriptionPeriodStartsAt: null,
      subscriptionPeriodEndsAt: null,
      subscriptionPeriodInvoiceId: null,
      subscriptionRevokedAt: null,
    });
    const lines = await f.orderRows("lines", id);
    expect(
      lines.map((line: any) => [line.productId, line.quantity]).sort(),
    ).toEqual(
      [
        [f.product.id, 2],
        [secondProduct.id, 4],
      ].sort(),
    );
    expect(
      lines.every(
        (line: any) =>
          !sourceLines.some((original: any) => original.id === line.id),
      ),
    ).toBe(true);
    expect(await f.orderRows("stores", id)).toEqual([
      expect.objectContaining({ storeId: f.store.id }),
    ]);
    expect(await f.orderRows("currencies", id)).toEqual([
      expect.objectContaining({ billingModuleCurrencyId: f.currency.id }),
    ]);
    expect(await f.orderRows("orderIntents", id)).toEqual([]);
    expect(await f.orderRows("orderIntents", f.source.id)).toEqual([
      sourceIntent,
    ]);
    expect(await f.services.paymentIntent.findById({ id: intent.id })).toEqual(
      intent,
    );
    expect(await f.services.invoice.findById({ id: invoice.id })).toEqual(
      invoice,
    );
    expect(
      await f.services.intentInvoices.findById({ id: intentInvoice.id }),
    ).toEqual(intentInvoice);
  },
);

it("checks every source product's current price before replacing any cart", async () => {
  const f = await fixture();
  const unavailable = await f.makeProduct();
  await f.services.lines.create({
    data: { orderId: f.source.id, productId: unavailable.id, quantity: 3 },
  });
  await f.services.attributesToBillingModuleCurrencies.delete({
    id: unavailable.priceCurrencyId,
  });
  await expect(f.repeat.execute(f.props)).rejects.toThrow("available currency");
  expect(await f.services.order.findById({ id: f.cart.id })).toEqual(f.cart);
  expect(
    (await f.profileOrders()).filter((order) => order.type === "cart"),
  ).toHaveLength(1);
});

it("keeps the cart if historical products now have incompatible checkout types", async () => {
  const f = await fixture();
  const changedProduct = await f.makeProduct();
  await f.services.lines.create({
    data: { orderId: f.source.id, productId: changedProduct.id, quantity: 3 },
  });
  await f.services.product.update({
    id: changedProduct.id,
    data: { type: "subscription" },
  });
  await expect(f.repeat.execute(f.props)).rejects.toThrow(
    "multiple product types",
  );
  expect(await f.services.order.findById({ id: f.cart.id })).toEqual(f.cart);
  expect(
    (await f.profileOrders()).filter((order) => order.type === "cart"),
  ).toHaveLength(1);
});

it("rolls back deleted carts and a partial replacement when its last relation write fails", async () => {
  const f = await fixture();
  const cartLines = await f.orderRows("lines", f.cart.id);
  const failed = jest
    .spyOn(f.services.currencies, "create")
    .mockRejectedValueOnce(new Error("repeat relation failure"));
  await expect(f.repeat.execute(f.props)).rejects.toThrow(
    "repeat relation failure",
  );
  expect(await f.services.order.findById({ id: f.cart.id })).toEqual(f.cart);
  expect(await f.orderRows("lines", f.cart.id)).toEqual(cartLines);
  expect(await f.profileOrders()).toHaveLength(2);
  failed.mockRestore();
  await expect(f.repeat.execute(f.props)).resolves.toEqual({
    orderIds: [expect.any(String)],
  });
});

it("rejects history from another selected profile or another Subject", async () => {
  const f = await fixture();
  const otherProfile = await f.makeProfile(f.subject.id);
  await expect(
    f.repeat.execute({ ...f.props, socialModuleProfileId: otherProfile.id }),
  ).rejects.toThrow("does not belong");
  const otherSubject = await f.makeSubject();
  await expect(
    f.repeat.execute({ ...f.props, subjectId: otherSubject.id }),
  ).rejects.toThrow("current subject");
  expect(await f.services.order.findById({ id: f.cart.id })).toEqual(f.cart);
});

it("preserves all existing carts if one has an invoice, even when its intent failed", async () => {
  const f = await fixture();
  const intent = await f.services.paymentIntent.create({
    data: { status: "failed" },
  });
  const invoice = await f.services.invoice.create({
    data: { status: "canceled" },
  });
  await f.services.orderIntents.create({
    data: { orderId: f.cart.id, billingModulePaymentIntentId: intent.id },
  });
  await f.services.intentInvoices.create({
    data: { paymentIntentId: intent.id, invoiceId: invoice.id },
  });
  await expect(f.repeat.execute(f.props)).rejects.toThrow(
    "payment attempt and cannot be replaced",
  );
  expect(await f.services.order.findById({ id: f.cart.id })).toEqual(f.cart);
  expect(await f.services.invoice.findById({ id: invoice.id })).toEqual(
    invoice,
  );
});

it("preserves a failed payment attempt without an invoice rather than detaching its order", async () => {
  const f = await fixture();
  const intent = await f.services.paymentIntent.create({
    data: { status: "failed" },
  });
  const link = await f.services.orderIntents.create({
    data: { orderId: f.cart.id, billingModulePaymentIntentId: intent.id },
  });
  await expect(f.repeat.execute(f.props)).rejects.toThrow(
    "payment attempt and cannot be replaced",
  );
  expect(await f.services.order.findById({ id: f.cart.id })).toEqual(f.cart);
  expect(await f.orderRows("orderIntents", f.cart.id)).toEqual([link]);
  expect(await f.services.paymentIntent.findById({ id: intent.id })).toEqual(
    intent,
  );
});

function barrier() {
  let enter!: () => void;
  let release!: () => void;
  const entered = new Promise<void>((resolve) => {
    enter = resolve;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const hold = async <T>(operation: () => Promise<T>): Promise<T> => {
    enter();
    await released;
    return operation();
  };
  return { entered, release, hold };
}

it("serializes competing repeats across repositories and leaves one complete replacement", async () => {
  const f = await fixture();
  const otherSource = await f.makeOrder({
    type: "history",
    lines: [{ productId: f.product.id, quantity: 6 }],
  });
  const gate = barrier();
  const first = new Repeat({
    repository: {
      withProfileLock: (scope, operation) =>
        f.subjects.withProfileLock(scope, () => gate.hold(operation)),
    },
    service: f.service as any,
  });
  const second = new Repeat({
    repository: new SubjectRepository(new SubjectConfiguration()),
    service: f.service as any,
  });
  const firstOutcome = first.execute(f.props);
  await gate.entered;
  const secondOutcome = second.execute({ ...f.props, orderId: otherSource.id });
  gate.release();
  const firstResult = await firstOutcome;
  const secondResult = await secondOutcome;
  expect(
    await f.services.order.findById({ id: firstResult.orderIds[0] }),
  ).toBeUndefined();
  const carts = (await f.profileOrders()).filter(
    (order) => order.type === "cart",
  );
  expect(carts.map((order) => order.id)).toEqual(secondResult.orderIds);
  expect(await f.orderRows("lines", carts[0].id)).toEqual([
    expect.objectContaining({ productId: f.product.id, quantity: 6 }),
  ]);
  expect(await f.services.order.findById({ id: f.source.id })).toEqual(
    f.source,
  );
  expect(await f.services.order.findById({ id: otherSource.id })).toEqual(
    otherSource,
  );
});

it.each(["checkout", "repeat"])(
  "serializes repeat and checkout when %s obtains the profile lock first",
  async (first) => {
    const f = await fixture();
    const gate = barrier();
    const otherRepository = new SubjectRepository(new SubjectConfiguration());
    const heldRepository = {
      withProfileLock: <T>(
        scope: { profileId: string },
        operation: () => Promise<T>,
      ) => f.subjects.withProfileLock(scope, () => gate.hold(operation)),
    };
    const repeat = new Repeat({
      repository: first === "repeat" ? heldRepository : otherRepository,
      service: f.service as any,
    });
    const claim = new CheckoutClaim({
      repository: first === "checkout" ? heldRepository : otherRepository,
      ecommerceModule: f.service.ecommerceModule as any,
      socialModule: f.service.socialModule as any,
    });
    const checkoutOperation = () =>
      claim.execute({ profileId: f.profile.id, orderIds: [f.cart.id] });
    const firstOutcome =
      first === "checkout" ? checkoutOperation() : repeat.execute(f.props);
    await gate.entered;
    const secondOutcome = (
      first === "checkout" ? repeat.execute(f.props) : checkoutOperation()
    ).then(
      () => null,
      (error) => error,
    );
    gate.release();
    await firstOutcome;
    const error = await secondOutcome;
    const carts = (await f.profileOrders()).filter(
      (order) => order.type === "cart",
    );
    expect(carts).toHaveLength(1);
    expect(await f.orderRows("lines", carts[0].id)).toEqual([
      expect.objectContaining({ productId: f.product.id, quantity: 2 }),
    ]);
    if (first === "checkout") {
      expect(error).toBeNull();
      expect(await f.services.order.findById({ id: f.cart.id })).toMatchObject({
        type: "history",
        status: "paying",
      });
    } else {
      expect(error?.message).toContain("no longer belongs");
      expect(
        await f.services.order.findById({ id: f.cart.id }),
      ).toBeUndefined();
    }
    expect(await f.services.order.findById({ id: f.source.id })).toEqual(
      f.source,
    );
  },
);

it.each(["merge", "repeat"])(
  "serializes repeat and guest merge when %s obtains the profile lock first",
  async (first) => {
    const f = await fixture();
    const guest = await f.makeSubject();
    const guestProfile = await f.makeProfile(guest.id);
    const guestCart = await f.makeOrder({
      profileId: guestProfile.id,
      lines: [{ productId: f.product.id, quantity: 6 }],
    });
    for (const line of await f.orderRows("lines", guestCart.id)) {
      await f.services.lines.update({
        id: line.id,
        data: { createdAt: new Date("2025-01-01T00:00:00Z") },
      });
    }
    const gate = barrier();
    const otherRepository = new SubjectRepository(new SubjectConfiguration());
    const repeat = new Repeat({
      repository:
        first === "repeat"
          ? {
              withProfileLock: (scope, operation) =>
                f.subjects.withProfileLock(scope, () => gate.hold(operation)),
            }
          : otherRepository,
      service: f.service as any,
    });
    const mergeRepository =
      first === "merge"
        ? {
            withSubjectLock: f.subjects.withSubjectLock.bind(f.subjects),
            withProfilesLock: <T>(
              scope: { profileIds: string[] },
              operation: () => Promise<T>,
            ) => f.subjects.withProfilesLock(scope, () => gate.hold(operation)),
          }
        : otherRepository;
    const merge = new MergeGuestCart({
      ...f.service,
      repository: mergeRepository,
      findById: ({ id }: { id: string }) =>
        f.subjects.findFirstByField("id", id),
      subjectsToIdentities: { find: async () => [] },
      socialModuleProfileOwnershipEnsure: async () => ({ profile: f.profile }),
    } as any);
    const mergeOperation = () =>
      merge.execute({
        sourceSubjectId: guest.id,
        subjectId: f.subject.id,
        socialModuleProfileId: f.profile.id,
      });
    const firstOutcome =
      first === "merge" ? mergeOperation() : repeat.execute(f.props);
    await gate.entered;
    const secondOutcome =
      first === "merge" ? repeat.execute(f.props) : mergeOperation();
    gate.release();
    await firstOutcome;
    await secondOutcome;
    expect(await f.profileOrders(guestProfile.id)).toHaveLength(0);
    const carts = (await f.profileOrders()).filter(
      (order) => order.type === "cart",
    );
    expect(carts).toHaveLength(1);
    expect(await f.orderRows("lines", carts[0].id)).toEqual([
      expect.objectContaining({ productId: f.product.id, quantity: 2 }),
    ]);
    expect(await f.services.order.findById({ id: f.source.id })).toEqual(
      f.source,
    );
  },
);
