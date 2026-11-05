import { randomUUID } from "node:crypto";
import { CRUDService } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as SubjectRepository } from "../../../repository";
import { Configuration as SubjectConfiguration } from "../../../configuration";
import { Service as Free } from "./free-subscription";
import { Service as Proceed } from "../ecommerce/order/proceed";
import { Service as Period } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period";
import { Service as Balances } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as Grants } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";

// Fixed owning repository paths; no configured Product, Store or account is edited.
const paths = {
  order: "@sps/ecommerce/models/order",
  product: "@sps/ecommerce/models/product",
  store: "@sps/ecommerce/models/store",
  currency: "@sps/billing/models/currency",
  intent: "@sps/billing/models/payment-intent",
  invoice: "@sps/billing/models/invoice",
  identity: "@sps/rbac/models/identity",
  role: "@sps/rbac/models/role",
  owners: "@sps/rbac/relations/subjects-to-ecommerce-module-orders",
  identities: "@sps/rbac/relations/subjects-to-identities",
  lines: "@sps/ecommerce/relations/orders-to-products",
  stores: "@sps/ecommerce/relations/stores-to-orders",
  currencies: "@sps/ecommerce/relations/orders-to-billing-module-currencies",
  orderIntents:
    "@sps/ecommerce/relations/orders-to-billing-module-payment-intents",
  intentCurrencies: "@sps/billing/relations/payment-intents-to-currencies",
  intentInvoices: "@sps/billing/relations/payment-intents-to-invoices",
  productRoles: "@sps/rbac/relations/roles-to-ecommerce-module-products",
  grants: "@sps/rbac/relations/subjects-to-roles",
  balances: "@sps/rbac/relations/subjects-to-billing-module-currencies",
};
const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of cleanup.splice(0).reverse()) await remove();
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const suffix = randomUUID();
  const subjectRepository = new SubjectRepository(new SubjectConfiguration());
  const subject = await subjectRepository.insert({
    slug: `issue376-free-${suffix}`,
  });
  cleanup.push(() => subjectRepository.deleteFirstByField("id", subject.id));
  const repositories: Record<string, any> = {};
  const services: Record<string, any> = {};
  for (const [key, path] of Object.entries(paths)) {
    const { Repository } = await import(
      `${path}/backend/app/api/src/lib/repository`
    );
    const { Configuration } = await import(
      `${path}/backend/app/api/src/lib/configuration`
    );
    const repository = new Repository(new Configuration());
    repositories[key] = repository;
    const service: any =
      key === "balances"
        ? new Balances(repository)
        : key === "grants"
          ? new Grants(repository)
          : new CRUDService(repository);
    const create = service.create.bind(service);
    service.create = async (props: any) => {
      const entity = await create(props);
      cleanup.push(async () => {
        if (await repository.findFirstByField("id", entity.id))
          await repository.deleteFirstByField("id", entity.id);
      });
      return entity;
    };
    services[key] = service;
  }
  const identity = await services.identity.create({
    data: { email: `issue376-${suffix}@example.invalid`, provider: "email" },
  });
  await services.identities.create({
    data: { subjectId: subject.id, identityId: identity.id },
  });
  const freeProduct = await services.product.create({
    data: { slug: `issue376-free-${suffix}`, type: "subscription" },
  });
  const store = await services.store.create({
    data: { slug: `issue376-store-${suffix}` },
  });
  const currency = await services.currency.create({
    data: {
      slug: `issue376-money-${suffix}`,
      symbol: "test",
      title: "Test zero settlement",
    },
  });
  const token = await services.currency.create({
    data: {
      slug: `issue376-credit-${suffix}`,
      symbol: "test",
      title: "Test credits",
    },
  });
  const role = await services.role.create({
    data: { slug: `issue376-role-${suffix}`, title: "Disposable Free role" },
  });
  await services.productRoles.create({
    data: { roleId: role.id, ecommerceModuleProductId: freeProduct.id },
  });
  const attribute = (type: string, data: object, currencies: any[] = []) => ({
    attribute: {
      ...data,
      attributeKeysToAttribute: [{ attributeKey: { type } }],
      attributesToBillingModuleCurrencies: currencies.map(
        (billingModuleCurrency) => ({
          billingModuleCurrencyId: billingModuleCurrency.id,
          billingModuleCurrency,
        }),
      ),
    },
  });
  // Only this fixture's graph reader aliases synthetic slugs for the internal policy.
  // Product/Store/Currency, ownership, settlement, grants and wallet writes are real.
  const tokenProjection = { ...token, slug: "token" };
  const freeProjection = {
    ...freeProduct,
    slug: "free-subscription",
    productsToAttributes: [
      attribute("price", { number: "0" }, [currency]),
      attribute("interval", { string: { en: "day", ru: "day" } }),
      attribute("topup", { number: "3000" }, [tokenProjection]),
    ],
  };
  const products = new Map<string, any>([[freeProduct.id, freeProjection]]);
  const forOrder = (id: string) => ({
    params: {
      filters: { and: [{ column: "orderId", method: "eq", value: id }] },
    },
  });
  const readExtended = async ({ id }: { id: string }) => {
    const order = await services.order.findById({ id });
    const lines = await services.lines.find(forOrder(id));
    const intents = await services.orderIntents.find(forOrder(id));
    return {
      ...order,
      ordersToProducts: lines.map((line: any) => ({
        ...line,
        product: products.get(line.productId),
      })),
      ordersToFileStorageModuleFiles: [],
      checkoutAttributesByCurrency: {
        amount: 0,
        type: products.get(lines[0]?.productId)?.type,
        interval: "day",
      },
      ordersToBillingModulePaymentIntents: await Promise.all(
        intents.map(async (link: any) => {
          const intent = await services.intent.findById({
            id: link.billingModulePaymentIntentId,
          });
          const params = {
            params: {
              filters: {
                and: [
                  { column: "paymentIntentId", method: "eq", value: intent.id },
                ],
              },
            },
          };
          return {
            ...link,
            billingModulePaymentIntent: {
              ...intent,
              paymentIntentsToCurrencies: (
                await services.intentCurrencies.find(params)
              ).map((item: any) => ({ ...item, currency })),
              paymentIntentsToInvoices: await Promise.all(
                (await services.intentInvoices.find(params)).map(
                  async (item: any) => ({
                    ...item,
                    invoice: await services.invoice.findById({
                      id: item.invoiceId,
                    }),
                  }),
                ),
              ),
            },
          };
        }),
      ),
    };
  };
  const period = new Period({
    findById: (props) => services.order.findById(props),
    findByIdExtended: readExtended,
    writeSubscriptionPeriod: (props) =>
      repositories.order.writeSubscriptionPeriod(props),
  });
  const ecommerceModule: any = {
    order: Object.assign(services.order, {
      findByIdExtended: readExtended,
      lockForLifecycle: (props: any) =>
        repositories.order.lockForLifecycle(props),
      assertSubscriptionPayment: (props: any) => period.assertPayment(props),
      acceptSubscriptionPeriod: (props: any) => period.execute(props),
    }),
    product: {
      find: async () => [freeProjection],
      findByIdExtended: async ({ id }: any) => products.get(id),
    },
    store: { find: async () => [store] },
    ordersToProducts: services.lines,
    storesToOrders: services.stores,
    ordersToBillingModuleCurrencies: services.currencies,
    ordersToBillingModulePaymentIntents: services.orderIntents,
  };
  const proceed = new Proceed(
    subjectRepository,
    { attribute: { find: async () => [] } } as any,
    ecommerceModule,
    { template: { find: async () => [] } } as any,
    services.identity,
    services.role,
    services.productRoles,
    services.owners,
    services.grants,
    { find: async () => [] } as any,
    services.balances,
    services.identities,
    async () => {
      throw new Error("Unexpected checkout transport");
    },
  );
  jest.spyOn(proceed, "notifyAdmin").mockResolvedValue(undefined);
  jest.spyOn(proceed, "notifyOrderOwner").mockResolvedValue(undefined);
  const dispatch = jest.fn((effect) => proceed.dispatchPaidEffects(effect));
  const free = new Free({
    repository: subjectRepository,
    ecommerceModule,
    subjectsToIdentities: services.identities,
    subjectsToEcommerceModuleOrders: services.owners,
    billingModule: {
      currency: services.currency,
      paymentIntent: services.intent,
      invoice: services.invoice,
      paymentIntentsToCurrencies: services.intentCurrencies,
      paymentIntentsToInvoices: services.intentInvoices,
    },
    fulfillPaidOrderInTransaction: (scope) =>
      proceed.fulfillPaidOrderInTransaction(scope),
    dispatchPaidEffects: dispatch,
  } as any);
  const balance = async () =>
    (
      await services.balances.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: subject.id },
              {
                column: "billingModuleCurrencyId",
                method: "eq",
                value: token.id,
              },
            ],
          },
        },
      })
    )[0];
  const makePaidOrder = async (product: any) => {
    const order = await services.order.create({
      data: { type: "history", status: "paid" },
    });
    await services.owners.create({
      data: { subjectId: subject.id, ecommerceModuleOrderId: order.id },
    });
    await services.lines.create({
      data: { orderId: order.id, productId: product.id, quantity: 1 },
    });
    await services.stores.create({
      data: { orderId: order.id, storeId: store.id },
    });
    await services.currencies.create({
      data: { orderId: order.id, billingModuleCurrencyId: currency.id },
    });
    const intent = await services.intent.create({
      data: { amount: 0, status: "succeeded", type: "one_off" },
    });
    await services.orderIntents.create({
      data: { orderId: order.id, billingModulePaymentIntentId: intent.id },
    });
    await services.intentCurrencies.create({
      data: { paymentIntentId: intent.id, currencyId: currency.id },
    });
    const invoice = await services.invoice.create({
      data: { amount: 0, status: "paid", provider: "dummy" },
    });
    await services.intentInvoices.create({
      data: { paymentIntentId: intent.id, invoiceId: invoice.id },
    });
    return order;
  };
  return {
    subject,
    free,
    freeProduct,
    freeProjection,
    proceed,
    services,
    dispatch,
    balance,
    products,
    attribute,
    tokenProjection,
    makePaidOrder,
  };
}

it("serializes Free and ordinary delivery, survives unknown response and rejects a duplicate legacy gift", async () => {
  const f = await fixture();
  const pack = await f.services.product.create({
    data: { slug: `issue376-pack-${randomUUID()}`, type: "one_off" },
  });
  f.products.set(pack.id, {
    ...pack,
    productsToAttributes: [
      f.attribute("topup", { number: "100" }, [f.tokenProjection]),
    ],
  });
  const paid = await f.makePaidOrder(pack);
  const transport = jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("Free must not use network transport"));
  await Promise.all([
    f.free.execute({ id: f.subject.id }),
    f.free.execute({ id: f.subject.id }),
    f.proceed.fromPaidStatus({
      order: paid,
      extendedOrder: paid,
      subjectToEcommerceModuleOrder: {
        subjectId: f.subject.id,
        ecommerceModuleOrderId: paid.id,
      },
    } as any),
  ]);
  expect((await f.balance()).amount).toBe("3100");
  const freeLines = await f.services.lines.find({
    params: {
      filters: {
        and: [{ column: "productId", method: "eq", value: f.freeProduct.id }],
      },
    },
  });
  expect(freeLines).toHaveLength(1);
  const accepted = await f.services.order.findById({
    id: freeLines[0].orderId,
  });
  expect(accepted.status).toBe("delivering");
  expect(accepted.subscriptionPeriodInvoiceId).toBeTruthy();
  expect(
    (
      await f.services.invoice.findById({
        id: accepted.subscriptionPeriodInvoiceId,
      })
    ).status,
  ).toBe("paid");
  expect(f.dispatch).toHaveBeenCalledTimes(1);
  expect(await f.free.execute({ id: f.subject.id })).toBeNull();
  const duplicate = await f.makePaidOrder(f.freeProjection);
  await f.proceed.fromPaidStatus({
    order: duplicate,
    extendedOrder: duplicate,
    subjectToEcommerceModuleOrder: {
      subjectId: f.subject.id,
      ecommerceModuleOrderId: duplicate.id,
    },
  } as any);
  expect((await f.balance()).amount).toBe("3100");
  expect(transport).not.toHaveBeenCalled();
});

it.each(["graph", "settlement", "balance"])(
  "rolls real graph, Invoice, Role and balance back after a %s failure, then retries once",
  async (phase) => {
    const f = await fixture();
    if (phase === "balance")
      await f.services.balances.create({
        data: {
          subjectId: f.subject.id,
          billingModuleCurrencyId: f.tokenProjection.id,
          amount: "700",
        },
      });
    const target =
      phase === "graph"
        ? f.services.lines
        : phase === "settlement"
          ? f.services.invoice
          : f.services.balances;
    const method = phase === "balance" ? "updateAmountIfUnchanged" : "create";
    const original = target[method].bind(target);
    let failedEntity: any;
    const injection = jest
      .spyOn(target, method)
      .mockImplementationOnce(async (props) => {
        failedEntity = await original(props);
        throw new Error(`Injected ${phase} failure`);
      });
    await expect(f.free.execute({ id: f.subject.id })).rejects.toThrow(
      `Injected ${phase} failure`,
    );
    const owned = await f.services.owners.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
        },
      },
    });
    expect(owned).toHaveLength(0);
    if (phase === "balance") expect((await f.balance()).amount).toBe("700");
    else {
      expect(await f.balance()).toBeUndefined();
      expect(await target.findById({ id: failedEntity.id })).toBeUndefined();
    }
    expect(
      await f.services.grants.find({
        params: {
          filters: {
            and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
          },
        },
      }),
    ).toHaveLength(0);
    expect(f.dispatch).not.toHaveBeenCalled();
    injection.mockRestore();
    await f.free.execute({ id: f.subject.id });
    expect((await f.balance()).amount).toBe(
      phase === "balance" ? "3700" : "3000",
    );
    expect(await f.free.execute({ id: f.subject.id })).toBeNull();
    expect((await f.balance()).amount).toBe(
      phase === "balance" ? "3700" : "3000",
    );
  },
);

it("resumes a real existing paid zero graph and survives an unknown committed response with the same IDs", async () => {
  const f = await fixture();
  const partial = await f.makePaidOrder(f.freeProjection);
  const beforeLines = await f.services.lines.find({
    params: {
      filters: {
        and: [{ column: "orderId", method: "eq", value: partial.id }],
      },
    },
  });
  f.dispatch.mockRejectedValueOnce(new Error("Unknown committed response"));
  await expect(f.free.execute({ id: f.subject.id })).rejects.toThrow(
    "Unknown committed response",
  );
  expect((await f.balance()).amount).toBe("3000");
  expect(await f.free.execute({ id: f.subject.id })).toBeNull();
  expect((await f.balance()).amount).toBe("3000");
  const links = await f.services.owners.find({
    params: {
      filters: {
        and: [{ column: "subjectId", method: "eq", value: f.subject.id }],
      },
    },
  });
  expect(links.map((link: any) => link.ecommerceModuleOrderId)).toEqual([
    partial.id,
  ]);
  const afterLines = await f.services.lines.find({
    params: {
      filters: {
        and: [{ column: "orderId", method: "eq", value: partial.id }],
      },
    },
  });
  expect(afterLines.map((line: any) => line.id)).toEqual(
    beforeLines.map((line: any) => line.id),
  );
});
