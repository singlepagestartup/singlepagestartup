/**
 * PostgreSQL coverage for failed purchases, repeated carts and Subject Roles.
 * Payment confirmation, order reads and fulfillment use the owning services.
 */
import { api as channelApi } from "@sps/broadcast/models/channel/sdk/server";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { CRUDService, consistencyContext } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { logger } from "@sps/backend-utils";
import { bootstrap as bootstrapOrder } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { Service as SubjectService } from "../../index";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Proceed } from "./proceed";
import { Service as Grants } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Service as Balances } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Handler as PaymentCheck } from "@sps/ecommerce/models/order/backend/app/api/src/lib/controller/startup/find-by-id/check";
import { Handler as OrderUpdate } from "@sps/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update";

const paths = {
  store: "@sps/ecommerce/models/store",
  role: "@sps/rbac/models/role",
  owners: "@sps/rbac/relations/subjects-to-ecommerce-module-orders",
  stores: "@sps/ecommerce/relations/stores-to-orders",
  productRoles: "@sps/rbac/relations/roles-to-ecommerce-module-products",
  grants: "@sps/rbac/relations/subjects-to-roles",
  balances: "@sps/rbac/relations/subjects-to-billing-module-currencies",
  profiles: "@sps/rbac/relations/subjects-to-social-module-profiles",
  identities: "@sps/rbac/relations/subjects-to-identities",
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

function where(column: string, value: string) {
  return { params: { filters: { and: [{ column, method: "eq", value }] } } };
}

function track(service: any) {
  const create = service.create.bind(service);
  service.create = async (props: any) => {
    const entity = await create(props);
    if (entity?.id) {
      cleanup.push(async () => {
        if (await service.repository.findFirstByField("id", entity.id)) {
          await service.repository.deleteFirstByField("id", entity.id);
        }
      });
    }
    return entity;
  };
  return service;
}

async function fixture(type = "one_off") {
  const suffix = randomUUID();
  const subjectRepository = new SubjectRepository(new SubjectConfiguration());
  const subjects = track(new CRUDService(subjectRepository));
  const buyer = await subjects.create({
    data: { slug: `retry-buyer-${suffix}` },
  });
  const stranger = await subjects.create({
    data: { slug: `retry-stranger-${suffix}` },
  });
  const { app: orderApp } = await bootstrapOrder();
  const order = track(orderApp.controller.service) as any;
  // Receipt rendering and notifications are external to payment/Role delivery.
  jest.spyOn(order.fileStorageModule.file, "find").mockResolvedValue([]);
  jest.spyOn(logger, "error").mockImplementation((message, context: any) => {
    throw context?.error ?? new Error(String(message));
  });
  const services: Record<string, any> = {};
  for (const [key, path] of Object.entries(paths)) {
    const { Repository } = await import(
      `${path}/backend/app/api/src/lib/repository`
    );
    const { Configuration } = await import(
      `${path}/backend/app/api/src/lib/configuration`
    );
    const repository = new Repository(new Configuration());
    let service: any = new CRUDService(repository);
    if (key === "grants") {
      service = new Grants(repository);
    } else if (key === "balances") {
      service = new Balances(repository);
    }
    services[key] = track(service);
  }
  const product = track(order.product);
  const attribute = track(product.attribute);
  const attributeKey = track(product.attributeKey);
  const productAttributes = track(product.productsToAttributes);
  const attributeKeys = track(product.attributeKeysToAttributes);
  const attributeCurrencies = track(
    product.attributesToBillingModuleCurrencies,
  );
  const currency = track(order.billingModule.currency);
  const intents = track(order.billingModule.paymentIntent);
  const invoices = track(order.billingModule.invoice);
  const intentInvoices = track(order.billingModule.paymentIntentsToInvoices);
  const intentCurrencies = track(
    order.billingModule.paymentIntentsToCurrencies,
  );
  const lines = track(order.ordersToProducts);
  const orderCurrencies = track(order.ordersToBillingModuleCurrencies);
  const orderIntents = track(order.ordersToBillingModulePaymentIntents);
  const money = await currency.create({
    data: {
      slug: `retry-money-${suffix}`,
      title: "Retry fixture",
      symbol: "T",
    },
  });
  const item = await product.create({
    data: { slug: `retry-product-${suffix}`, type },
  });
  const store = await services.store.create({
    data: { slug: `retry-store-${suffix}` },
  });
  const role = await services.role.create({
    data: {
      slug: `retry-role-${suffix}`,
      title: `Purchased fixture role ${suffix}`,
    },
  });
  await services.productRoles.create({
    data: { roleId: role.id, ecommerceModuleProductId: item.id },
  });
  const priceKey = await attributeKey.create({
    data: { slug: `retry-price-${suffix}`, type: "price" },
  });
  const price = await attribute.create({ data: { number: "100" } });
  await productAttributes.create({
    data: { productId: item.id, attributeId: price.id },
  });
  await attributeKeys.create({
    data: { attributeKeyId: priceKey.id, attributeId: price.id },
  });
  await attributeCurrencies.create({
    data: { attributeId: price.id, billingModuleCurrencyId: money.id },
  });
  if (type === "subscription") {
    const intervalKey = await attributeKey.create({
      data: { slug: `retry-interval-${suffix}`, type: "interval" },
    });
    const interval = await attribute.create({
      data: { string: { en: "day", ru: "day" } },
    });
    await productAttributes.create({
      data: { productId: item.id, attributeId: interval.id },
    });
    await attributeKeys.create({
      data: { attributeKeyId: intervalKey.id, attributeId: interval.id },
    });
  }
  const ecommerceModule: any = {
    order,
    product,
    attribute,
    attributeKey,
    productsToAttributes: productAttributes,
    attributeKeysToAttributes: attributeKeys,
    attributesToBillingModuleCurrencies: attributeCurrencies,
    ordersToProducts: lines,
    ordersToBillingModuleCurrencies: orderCurrencies,
    ordersToBillingModulePaymentIntents: orderIntents,
    store: services.store,
    storesToOrders: services.stores,
  };
  const billingModule: any = {
    currency,
    paymentIntent: intents,
    invoice: invoices,
    paymentIntentsToInvoices: intentInvoices,
    paymentIntentsToCurrencies: intentCurrencies,
  };
  const proceed = new Proceed(
    subjectRepository,
    {} as any,
    ecommerceModule,
    {} as any,
    {} as any,
    services.role,
    services.productRoles,
    services.owners,
    services.grants,
    services.profiles,
    services.balances,
    services.identities,
    async () => {
      throw new Error("Unexpected automatic checkout");
    },
  );
  jest.spyOn(proceed, "notifyAdmin").mockResolvedValue(undefined);
  jest.spyOn(proceed, "notifyOrderOwner").mockResolvedValue(undefined);
  const subject = new SubjectService(
    {} as any,
    subjectRepository,
    {} as any,
    ecommerceModule,
    billingModule,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    services.role,
    {} as any,
    {} as any,
    services.productRoles,
    {} as any,
    {} as any,
    proceed,
    services.identities,
    services.profiles,
    services.grants,
    services.owners,
    services.balances,
    {} as any,
    {} as any,
  );
  subject.configureRoleRevocation();

  // SDK self-HTTP uses the actual Order routes, without a listening server.
  const http = new Hono().route("/api/ecommerce/orders", orderApp.hono);
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(input as any, init);
    if (!new URL(request.url).pathname.startsWith("/api/ecommerce/orders")) {
      throw new Error(
        `Unexpected fixture request: ${request.method} ${new URL(request.url).pathname}`,
      );
    }
    return http.fetch(request);
  });
  const check = async (id: string) => {
    const response = await http.request(`/api/ecommerce/orders/${id}/check`, {
      method: "POST",
    });
    expect(response.status).toBe(200);
  };
  const grantRows = (subjectId = buyer.id) =>
    services.grants.find(where("subjectId", subjectId));
  const cartsFor = async (subjectId = buyer.id) => {
    const owners = await services.owners.find(where("subjectId", subjectId));
    return order.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: owners.map((link: any) => link.ecommerceModuleOrderId),
            },
            { column: "type", method: "eq", value: "cart" },
            { column: "status", method: "eq", value: "new" },
          ],
        },
      },
    });
  };
  const createCart = async (productId = item.id, subjectId = buyer.id) => {
    await subject.ecommerceModuleOrderCreate({
      subjectId,
      productId,
      storeId: store.id,
      quantity: 1,
      billingModuleCurrencyId: money.id,
    });
    const carts = await cartsFor(subjectId);
    expect(carts).toHaveLength(1);
    return carts[0];
  };
  const graph = async (id: string) => {
    const [entity, products, stores, currencies, owners] = await Promise.all([
      order.findById({ id }),
      lines.find(where("orderId", id)),
      services.stores.find(where("orderId", id)),
      orderCurrencies.find(where("orderId", id)),
      services.owners.find(where("ecommerceModuleOrderId", id)),
    ]);
    return { entity, products, stores, currencies, owners };
  };
  const attachPayment = async (
    orderId: string,
    status = "processing",
    invoiceStatus = "open",
  ) => {
    const intent = await intents.create({
      data: {
        amount: 100,
        status,
        type: "one_off",
        interval: type === "subscription" ? "day" : null,
      },
    });
    const invoice = await invoices.create({
      data: { amount: 100, status: invoiceStatus, provider: "dummy" },
    });
    await intentInvoices.create({
      data: { paymentIntentId: intent.id, invoiceId: invoice.id },
    });
    await intentCurrencies.create({
      data: { paymentIntentId: intent.id, currencyId: money.id },
    });
    await orderIntents.create({
      data: { orderId, billingModulePaymentIntentId: intent.id },
    });
    await order.update({
      id: orderId,
      data: { type: "history", status: "paying" },
    });
    return { intent, invoice };
  };
  const settle = (invoiceId: string) =>
    intents.settlePayment({
      invoiceId,
      provider: "dummy",
      amount: 100,
    });
  const createAlternativeProduct = async () => {
    const alternative = await product.create({
      data: { slug: `retry-alternative-${randomUUID()}`, type },
    });
    const attributes = await productAttributes.find(
      where("productId", item.id),
    );
    for (const link of attributes) {
      await productAttributes.create({
        data: { productId: alternative.id, attributeId: link.attributeId },
      });
    }
    await services.productRoles.create({
      data: { roleId: role.id, ecommerceModuleProductId: alternative.id },
    });
    return alternative;
  };
  return {
    buyer,
    stranger,
    subject,
    proceed,
    services,
    order,
    lines,
    role,
    intents,
    invoices,
    createCart,
    attachPayment,
    grantRows,
    check,
    settle,
    createAlternativeProduct,
    cartsFor,
    graph,
  };
}

it.each(["processing", "failed"])(
  "does not grant a Role for a %s payment",
  async (paymentStatus) => {
    const f = await fixture();
    const cart = await f.createCart();
    await f.attachPayment(
      cart.id,
      paymentStatus,
      paymentStatus === "failed" ? "failed" : "open",
    );
    await f.check(cart.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.grantRows()).toHaveLength(0);
    expect(await f.grantRows(f.stranger.id)).toHaveLength(0);
    const current = await f.order.findById({ id: cart.id });
    expect(current.status).toBe(
      paymentStatus === "failed" ? "canceled" : "paying",
    );
  },
);

it("resumes a shared legacy invoice only when checkout includes every billed order", async () => {
  const f = await fixture();
  const observe = jest
    .spyOn(channelApi, "pushMessage")
    .mockResolvedValue(undefined);
  const first = await f.createCart();
  await f.order.update({
    id: first.id,
    data: { type: "history", status: "paying" },
  });
  const second = await f.createCart((await f.createAlternativeProduct()).id);
  await f.order.update({ id: first.id, data: { type: "cart", status: "new" } });

  const intent = await f.intents.create({
    data: { amount: 200, status: "processing", type: "one_off" },
  });
  const invoice = await f.invoices.create({
    data: {
      amount: 200,
      status: "open",
      provider: "dummy",
      paymentUrl: "https://pay.test/grouped",
    },
  });
  await f.order.billingModule.paymentIntentsToInvoices.create({
    data: { paymentIntentId: intent.id, invoiceId: invoice.id },
  });
  for (const order of [first, second]) {
    await f.order.ordersToBillingModulePaymentIntents.create({
      data: { orderId: order.id, billingModulePaymentIntentId: intent.id },
    });
  }

  const checkout = (orderIds: string[]) =>
    f.subject.ecommerceOrderCheckout({
      id: f.buyer.id,
      provider: "dummy",
      email: "buyer@example.test",
      ecommerceModule: { orders: orderIds.map((id) => ({ id })) },
    });
  await expect(checkout([first.id])).rejects.toThrow("unresolved payment");
  expect(observe).not.toHaveBeenCalled();
  expect((await f.cartsFor()).map((order) => order.id).sort()).toEqual(
    [first.id, second.id].sort(),
  );
  const result = await checkout([first.id, second.id]);
  expect(result.billingModule.invoices.map((entry) => entry.id)).toEqual([
    invoice.id,
  ]);
  expect(await f.cartsFor()).toHaveLength(0);
});

it("keeps an existing one-off Role when an unpaid purchase is canceled", async () => {
  const f = await fixture();
  const membership = await f.services.grants.create({
    data: { subjectId: f.buyer.id, roleId: f.role.id },
  });
  const cart = await f.createCart();
  await f.attachPayment(cart.id, "failed", "failed");
  await f.check(cart.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect((await f.order.findById({ id: cart.id })).status).toBe("canceled");
  expect((await f.grantRows()).map((grant: any) => grant.id)).toEqual([
    membership.id,
  ]);
});

it.each(["one_off", "subscription"])(
  "fulfills a repeated %s purchase once for its buyer while preserving the failed attempt",
  async (type) => {
    const f = await fixture(type);
    const original = await f.createCart();
    const failed = await f.attachPayment(original.id, "failed", "failed");
    await f.check(original.id);
    const source = await f.order.findById({ id: original.id });
    const sourceLines = await f.lines.find(where("orderId", original.id));
    const sourceIntent = await f.intents.findById({ id: failed.intent.id });
    const sourceInvoice = await f.invoices.findById({ id: failed.invoice.id });
    expect(await f.grantRows()).toHaveLength(0);
    const repeated = await f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: original.id,
    });
    expect(repeated.orderIds).toHaveLength(1);
    const [orderId] = repeated.orderIds;
    expect(orderId).not.toBe(original.id);
    expect(await f.order.findById({ id: original.id })).toEqual(source);
    expect(await f.lines.find(where("orderId", original.id))).toEqual(
      sourceLines,
    );
    expect(await f.intents.findById({ id: failed.intent.id })).toEqual(
      sourceIntent,
    );
    expect(await f.invoices.findById({ id: failed.invoice.id })).toEqual(
      sourceInvoice,
    );
    const next = await f.attachPayment(orderId);
    await f.check(orderId);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.grantRows()).toHaveLength(0);
    await f.settle(next.invoice.id);
    await f.check(orderId);
    const paid = await f.order.findById({ id: orderId });
    const delivery = {
      order: paid,
      extendedOrder: await f.order.findByIdExtended({ id: orderId }),
      subjectToEcommerceModuleOrder: {
        subjectId: f.buyer.id,
        ecommerceModuleOrderId: orderId,
      },
    };
    await Promise.all(
      Array.from({ length: 4 }, () => f.proceed.fromPaidStatus(delivery)),
    );
    await f.proceed.execute({ subjectId: f.buyer.id });
    await f.settle(next.invoice.id);
    await f.check(orderId);
    await f.proceed.execute({ subjectId: f.buyer.id });
    const grants = await f.grantRows();
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      subjectId: f.buyer.id,
      roleId: f.role.id,
    });
    expect(await f.grantRows(f.stranger.id)).toHaveLength(0);
    expect((await f.order.findById({ id: original.id })).status).toBe(
      "canceled",
    );
    expect((await f.order.findById({ id: orderId })).status).toBe(
      type === "subscription" ? "delivering" : "approving",
    );
  },
);

it("rolls back local payment preparation and leaves the original cart editable", async () => {
  const f = await fixture();
  const cart = await f.createCart();
  const original = await f.graph(cart.id);
  const relations =
    f.subject.ecommerceModule.ordersToBillingModulePaymentIntents;
  const create = relations.create.bind(relations);
  let intentId: string | undefined;
  jest.spyOn(relations, "create").mockImplementationOnce(async (props) => {
    const link = await create(props);
    intentId = link.billingModulePaymentIntentId;
    throw new Error("local-preparation-failed");
  });
  await expect(
    f.subject.ecommerceOrderCheckout({
      id: f.buyer.id,
      provider: "stripe",
      email: "buyer@example.test",
      ecommerceModule: { orders: [{ id: cart.id }] },
    }),
  ).rejects.toThrow("local-preparation-failed");
  expect(await f.graph(cart.id)).toEqual(original);
  expect(await relations.find(where("orderId", cart.id))).toEqual([]);
  expect(intentId).toBeTruthy();
  expect(await f.intents.findById({ id: intentId! })).toBeUndefined();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

it.each(["repeat", "add"])(
  "serializes a concurrent %s behind failed local preparation and preserves the later empty cart",
  async (mutation) => {
    const f = await fixture();
    const source = await f.createCart();
    await f.attachPayment(source.id, "failed", "failed");
    await f.check(source.id);
    const cart = await f.createCart();
    const original = await f.graph(cart.id);
    let announcePreparation!: () => void;
    const preparationEntered = new Promise<void>((resolve) => {
      announcePreparation = resolve;
    });
    let releasePreparation!: () => void;
    const preparationRelease = new Promise<void>((resolve) => {
      releasePreparation = resolve;
    });
    const relations =
      f.subject.ecommerceModule.ordersToBillingModulePaymentIntents;
    const create = relations.create.bind(relations);
    jest.spyOn(relations, "create").mockImplementationOnce(async (props) => {
      await create(props);
      announcePreparation();
      await preparationRelease;
      throw new Error("local-preparation-failed");
    });
    const checkout = f.subject
      .ecommerceOrderCheckout({
        id: f.buyer.id,
        provider: "stripe",
        email: "buyer@example.test",
        ecommerceModule: { orders: [{ id: cart.id }] },
      })
      .catch((error) => error);
    await preparationEntered;
    let mutationComplete = false;
    const laterMutation = (
      mutation === "repeat"
        ? f.subject.ecommerceModuleOrderRepeat({
            subjectId: f.buyer.id,
            orderId: source.id,
          })
        : f.subject.ecommerceModuleOrderCreate({
            subjectId: f.buyer.id,
            productId: original.products[0].productId,
            storeId: original.stores[0].storeId,
            billingModuleCurrencyId:
              original.currencies[0].billingModuleCurrencyId,
            quantity: 1,
          })
    ).then(
      (result) => {
        mutationComplete = true;
        return result;
      },
      (error) => {
        mutationComplete = true;
        return error;
      },
    );
    // A separate request still sees the committed cart while preparation holds its lock.
    expect(await f.graph(cart.id)).toEqual(original);
    expect(mutationComplete).toBe(false);
    releasePreparation();
    expect(await checkout).toEqual(new Error("local-preparation-failed"));
    const result = await laterMutation;
    if (mutation === "repeat") {
      expect(result.orderIds).toHaveLength(1);
      expect(await f.order.findById({ id: cart.id })).toBeUndefined();
    } else {
      expect(result).toEqual(
        new Error("Conflict error. Product is already in the cart"),
      );
      expect(await f.graph(cart.id)).toEqual(original);
    }
    const carts = await f.cartsFor();
    expect(carts).toHaveLength(1);
    await f.subject.ecommerceModuleOrderMutateCart({
      subjectId: f.buyer.id,
      orderId: carts[0].id,
    });
    expect(await f.cartsFor()).toEqual([]);
    expect(await f.order.findById({ id: cart.id })).toBeUndefined();
  },
);

it("rejects repeat after Billing confirms payment before the Order check runs", async () => {
  const f = await fixture();
  const original = await f.createCart();
  const pending = await f.attachPayment(original.id);
  await f.settle(pending.invoice.id);
  expect((await f.order.findById({ id: original.id })).status).toBe("paying");
  await expect(
    f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: original.id,
    }),
  ).rejects.toThrow("Only an unpaid history order can be repeated");
  expect(await f.grantRows()).toHaveLength(0);
  await f.check(original.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect(await f.grantRows()).toHaveLength(1);
});

it("preserves the successful one-off retry Role when late confirmation precedes failed-source cleanup", async () => {
  const f = await fixture();
  const source = await f.createCart();
  const failed = await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  const repeated = await f.subject.ecommerceModuleOrderRepeat({
    subjectId: f.buyer.id,
    orderId: source.id,
  });
  const [orderId] = repeated.orderIds;
  const payment = await f.attachPayment(orderId);
  await f.settle(payment.invoice.id);
  await f.check(orderId);
  const paid = await f.order.findById({ id: orderId });
  await f.proceed.fromPaidStatus({
    order: paid,
    extendedOrder: await f.order.findByIdExtended({ id: orderId }),
    subjectToEcommerceModuleOrder: {
      subjectId: f.buyer.id,
      ecommerceModuleOrderId: orderId,
    },
  });
  const [grant] = await f.grantRows();
  expect(grant).toBeTruthy();
  await f.settle(failed.invoice.id);
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect((await f.order.findById({ id: source.id })).status).toBe("approving");
  expect((await f.grantRows()).map((row: any) => row.id)).toEqual([grant.id]);
  expect(await f.grantRows(f.stranger.id)).toHaveLength(0);
  await expect(
    f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: source.id,
    }),
  ).rejects.toThrow("Only an unpaid history order can be repeated");
});

it.each([
  ["one_off", false],
  ["one_off", true],
  ["subscription", false],
  ["subscription", true],
])(
  "fulfills a late confirmed %s source once after cleanup=%s",
  async (type, cleanupBeforeConfirmation) => {
    const f = await fixture(type as string);
    const source = await f.createCart();
    const failed = await f.attachPayment(source.id, "failed", "failed");
    await f.check(source.id);
    if (cleanupBeforeConfirmation) {
      await f.proceed.execute({ subjectId: f.buyer.id });
    }
    const failedSource = await f.order.findById({ id: source.id });
    expect(failedSource.status).toBe(
      cleanupBeforeConfirmation ? "canceled" : "canceling",
    );
    expect(failedSource.paymentFailureCanceledAt).toBeTruthy();
    expect(await f.grantRows()).toHaveLength(0);
    await f.settle(failed.invoice.id);
    await Promise.all([
      f.check(source.id),
      f.proceed.execute({ subjectId: f.buyer.id }),
    ]);
    await f.check(source.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    const delivered = await f.order.findById({ id: source.id });
    expect(delivered.status).toBe(
      type === "subscription" ? "delivering" : "approving",
    );
    expect(delivered.paymentFailureCanceledAt).toBeNull();
    expect(await f.grantRows()).toHaveLength(1);
    expect(await f.grantRows(f.stranger.id)).toHaveLength(0);
    await f.settle(failed.invoice.id);
    await f.check(source.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.order.findById({ id: source.id })).toEqual(delivered);
    expect(await f.grantRows()).toHaveLength(1);
    if (type === "subscription") {
      expect(delivered.subscriptionPeriodInvoiceId).toBe(failed.invoice.id);
    }
  },
);

it.each(["canceling", "canceled"])(
  "leaves explicit and unmarked legacy %s orders canceled after late settlement",
  async (status) => {
    const f = await fixture("subscription");
    const source = await f.createCart();
    const failed = await f.attachPayment(source.id, "failed", "failed");
    await f.check(source.id);
    await f.order.update({ id: source.id, data: { status } });
    expect(
      (await f.order.findById({ id: source.id })).paymentFailureCanceledAt,
    ).toBeNull();
    await f.settle(failed.invoice.id);
    await f.check(source.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect((await f.order.findById({ id: source.id })).status).toBe("canceled");
    expect(await f.grantRows()).toHaveLength(0);
  },
);

it("preserves explicit cancellation when a stale late-payment check tries to publish paid", async () => {
  const f = await fixture();
  const source = await f.createCart();
  const failed = await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  await f.settle(failed.invoice.id);
  const transition = f.order.completePaymentStatus.bind(f.order);
  jest
    .spyOn(f.order, "completePaymentStatus")
    .mockImplementationOnce(async (props: any) => {
      await f.order.update({ id: source.id, data: { status: "canceled" } });
      return transition(props);
    });
  const hook = jest.spyOn(PaymentCheck.prototype as any, "onPaymentSucceeded");
  const receipts = jest.spyOn(OrderUpdate.prototype, "onPaymentStatusUpdated");
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect((await f.order.findById({ id: source.id })).status).toBe("canceled");
  expect(await f.grantRows()).toHaveLength(0);
  expect(hook).not.toHaveBeenCalled();
  expect(receipts).not.toHaveBeenCalled();
});

it("runs one successful project hook and receipt pass for simultaneous late-payment checks", async () => {
  const f = await fixture("subscription");
  const source = await f.createCart();
  const failed = await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  await f.settle(failed.invoice.id);
  const hook = jest.spyOn(PaymentCheck.prototype as any, "onPaymentSucceeded");
  const receipts = jest.spyOn(OrderUpdate.prototype, "onPaymentStatusUpdated");
  await Promise.all(Array.from({ length: 4 }, () => f.check(source.id)));
  expect(hook).toHaveBeenCalledTimes(1);
  expect(receipts).toHaveBeenCalledTimes(1);
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect(await f.grantRows()).toHaveLength(1);
});

it("allows the project hook to create an Order child through an independent database connection", async () => {
  const f = await fixture();
  const source = await f.createCart();
  const payment = await f.attachPayment(source.id);
  await f.settle(payment.invoice.id);
  const [line] = await f.lines.find(where("orderId", source.id));
  const hook = jest.spyOn(PaymentCheck.prototype as any, "onPaymentSucceeded");
  hook.mockImplementationOnce(async () => {
    const context = consistencyContext.getStore();
    await consistencyContext.run({ ...context, database: undefined }, () =>
      f.lines.create({
        data: { orderId: source.id, productId: line.productId, quantity: 1 },
      }),
    );
    await f.order.update({
      id: source.id,
      data: { comment: "Project payment hook finished" },
    });
  });
  await f.check(source.id);
  expect(await f.lines.find(where("orderId", source.id))).toHaveLength(2);
  expect(await f.order.findById({ id: source.id })).toMatchObject({
    status: "paid",
    comment: "Project payment hook finished",
  });
});

it("retains automatically canceled payment history during cleanup and rejects stale cleanup after recovery", async () => {
  const f = await fixture();
  const source = await f.createCart();
  const failed = await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  const cleanup = {
    id: source.id,
    createdBefore: new Date(Date.now() + 10000),
  };
  await f.order.deleteCanceledWithoutPayment(cleanup);
  expect((await f.order.findById({ id: source.id })).status).toBe("canceled");
  await f.settle(failed.invoice.id);
  await f.check(source.id);
  await f.order.deleteCanceledWithoutPayment(cleanup);
  expect((await f.order.findById({ id: source.id })).status).toBe("paid");
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect(await f.grantRows()).toHaveLength(1);
});

it("does not restore an unpaid subscription revoked before its late payment", async () => {
  const f = await fixture("subscription");
  const membership = await f.services.grants.create({
    data: { subjectId: f.buyer.id, roleId: f.role.id },
  });
  const source = await f.createCart();
  const failed = await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  await f.services.grants.delete({ id: membership.id });
  expect(
    (await f.order.findById({ id: source.id })).subscriptionRevokedAt,
  ).toBeTruthy();
  await f.settle(failed.invoice.id);
  await f.check(source.id);
  await f.proceed.execute({ subjectId: f.buyer.id });
  expect((await f.order.findById({ id: source.id })).status).toBe("canceled");
  expect(await f.grantRows()).toHaveLength(0);
});

it.each([false, true])(
  "keeps the active plan through unpaid replacement and cancels only an exclusively owned paid plan, shared=%s",
  async (shared) => {
    const f = await fixture("subscription");
    const original = await f.createCart();
    const first = await f.attachPayment(original.id);
    await f.settle(first.invoice.id);
    await f.check(original.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    const active = await f.order.findById({ id: original.id });
    expect(active.status).toBe("delivering");
    if (shared) {
      await f.services.owners.create({
        data: { subjectId: f.stranger.id, ecommerceModuleOrderId: original.id },
      });
    }
    const alternative = await f.createAlternativeProduct();
    const attempted = await f.createCart(alternative.id);
    await f.attachPayment(attempted.id, "failed", "failed");
    await f.check(attempted.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.order.findById({ id: original.id })).toEqual(active);
    expect(await f.grantRows()).toHaveLength(1);
    const repeated = await f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: attempted.id,
    });
    const [orderId] = repeated.orderIds;
    const replacement = await f.attachPayment(orderId);
    await f.check(orderId);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.order.findById({ id: original.id })).toEqual(active);
    await f.settle(replacement.invoice.id);
    await f.check(orderId);
    await f.proceed.execute({ subjectId: f.buyer.id });
    const canceledPlan = await f.order.findById({ id: original.id });
    expect(canceledPlan).toMatchObject({
      status: shared ? "delivering" : "requested_cancelation",
      subscriptionPeriodInvoiceId: active.subscriptionPeriodInvoiceId,
      subscriptionPeriodEndsAt: active.subscriptionPeriodEndsAt,
    });
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.order.findById({ id: original.id })).toEqual(canceledPlan);
    expect((await f.order.findById({ id: orderId })).status).toBe("delivering");
    expect(await f.grantRows()).toHaveLength(1);
  },
);

it.each(["one_off", "subscription"])(
  "retains the supported Role cleanup for fulfilled %s delivery",
  async (type) => {
    const f = await fixture(type);
    const cart = await f.createCart();
    const payment = await f.attachPayment(cart.id);
    await f.settle(payment.invoice.id);
    await f.check(cart.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.grantRows()).toHaveLength(1);
    await f.order.update({
      id: cart.id,
      data: { status: type === "subscription" ? "canceling" : "delivered" },
    });
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(await f.grantRows()).toHaveLength(0);
    const completed = await f.order.findById({ id: cart.id });
    expect(completed.status).toBe(
      type === "subscription" ? "canceled" : "completed",
    );
    if (type === "subscription") {
      expect(completed.subscriptionRevokedAt).toBeTruthy();
    }
  },
);

it("serializes simultaneous repeats into one complete cart and leaves the other Subject untouched", async () => {
  const f = await fixture();
  const source = await f.createCart();
  await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  const foreignCart = await f.createCart(undefined, f.stranger.id);
  const foreignGraph = await f.graph(foreignCart.id);
  const sourceGraph = await f.graph(source.id);
  await expect(
    f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.stranger.id,
      orderId: source.id,
    }),
  ).rejects.toThrow("Order does not belong to the current subject");
  const repeated = await Promise.all([
    f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: source.id,
    }),
    f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: source.id,
    }),
  ]);
  const carts = await f.cartsFor();
  expect(carts).toHaveLength(1);
  expect(repeated.some((result) => result.orderIds.includes(carts[0].id))).toBe(
    true,
  );
  const cartGraph = await f.graph(carts[0].id);
  expect(cartGraph.products).toHaveLength(1);
  expect(cartGraph.stores).toHaveLength(1);
  expect(cartGraph.currencies).toHaveLength(1);
  expect(cartGraph.owners).toHaveLength(1);
  expect(cartGraph.products[0]).toMatchObject({
    productId: sourceGraph.products[0].productId,
    quantity: sourceGraph.products[0].quantity,
  });
  expect(cartGraph.owners[0].subjectId).toBe(f.buyer.id);
  expect(await f.graph(source.id)).toEqual(sourceGraph);
  expect(await f.graph(foreignCart.id)).toEqual(foreignGraph);
});

it("restores the replaced cart and its lines when the last currency relation fails", async () => {
  const f = await fixture();
  const source = await f.createCart();
  await f.attachPayment(source.id, "failed", "failed");
  await f.check(source.id);
  const previous = await f.createCart();
  const [line] = await f.lines.find(where("orderId", previous.id));
  await f.lines.update({ id: line.id, data: { quantity: 3 } });
  const foreignCart = await f.createCart(undefined, f.stranger.id);
  const previousGraph = await f.graph(previous.id);
  const sourceGraph = await f.graph(source.id);
  const foreignGraph = await f.graph(foreignCart.id);
  const failure = jest
    .spyOn(f.order.ordersToBillingModuleCurrencies, "create")
    .mockRejectedValueOnce(
      new Error("Injected final currency relation failure"),
    );
  await expect(
    f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: source.id,
    }),
  ).rejects.toThrow("Injected final currency relation failure");
  failure.mockRestore();
  expect((await f.cartsFor()).map((cart: any) => cart.id)).toEqual([
    previous.id,
  ]);
  expect(await f.graph(previous.id)).toEqual(previousGraph);
  expect(await f.graph(source.id)).toEqual(sourceGraph);
  expect(await f.graph(foreignCart.id)).toEqual(foreignGraph);
});

it.each(["source-first", "retry-first"])(
  "keeps one renewable subscription and credits both paid retries with %s settlement",
  async (sequence) => {
    const f = await fixture("subscription");
    const source = await f.createCart();
    const token = await f.order.billingModule.currency.create({
      data: {
        slug: `retry-token-${randomUUID()}`,
        title: "Token",
        symbol: "T",
      },
    });
    const topupKey = await f.order.product.attributeKey.create({
      data: { slug: `retry-topup-${randomUUID()}`, type: "topup" },
    });
    const topup = await f.order.product.attribute.create({
      data: { number: "5000" },
    });
    const [line] = await f.lines.find(where("orderId", source.id));
    await f.order.product.productsToAttributes.create({
      data: { productId: line.productId, attributeId: topup.id },
    });
    await f.order.product.attributeKeysToAttributes.create({
      data: { attributeKeyId: topupKey.id, attributeId: topup.id },
    });
    await f.order.product.attributesToBillingModuleCurrencies.create({
      data: { attributeId: topup.id, billingModuleCurrencyId: token.id },
    });
    const originalPayment = await f.attachPayment(
      source.id,
      "failed",
      "failed",
    );
    await f.check(source.id);
    const repeated = await f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: source.id,
    });
    const [retryId] = repeated.orderIds;
    const retryPayment = await f.attachPayment(retryId);
    const attempts = [
      { orderId: source.id, invoiceId: originalPayment.invoice.id },
      { orderId: retryId, invoiceId: retryPayment.invoice.id },
    ];
    if (sequence === "retry-first") {
      attempts.reverse();
    }
    for (const attempt of attempts) {
      await f.settle(attempt.invoiceId);
      await f.check(attempt.orderId);
      await f.proceed.execute({ subjectId: f.buyer.id });
    }
    for (const attempt of attempts) {
      await f.settle(attempt.invoiceId);
      await f.check(attempt.orderId);
      await f.proceed.execute({ subjectId: f.buyer.id });
    }
    const original = await f.order.findById({ id: source.id });
    const retry = await f.order.findById({ id: retryId });
    expect(original.status).toBe("requested_cancelation");
    expect(retry.status).toBe("delivering");
    expect(original.subscriptionPeriodInvoiceId).toBe(
      originalPayment.invoice.id,
    );
    expect(retry.subscriptionPeriodInvoiceId).toBe(retryPayment.invoice.id);
    expect(original.subscriptionRevokedAt).toBeNull();
    expect(retry.subscriptionRevokedAt).toBeNull();
    expect(await f.grantRows()).toHaveLength(1);
    const balances = await f.services.balances.find(
      where("subjectId", f.buyer.id),
    );
    expect(
      balances.find(
        (balance: any) => balance.billingModuleCurrencyId === token.id,
      ).amount,
    ).toBe("10000");
  },
);
