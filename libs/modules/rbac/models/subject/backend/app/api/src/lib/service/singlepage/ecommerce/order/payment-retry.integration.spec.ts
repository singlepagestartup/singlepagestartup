import { Service as OrderLifecycleService } from "@sps/ecommerce/models/order/backend/app/api/src/lib/service/startup/lifecycle";
/**
 * PostgreSQL coverage for failed purchases, repeated carts and Subject Roles.
 * Payment confirmation, order reads and fulfillment use the owning services.
 */
import { api as channelApi } from "@sps/broadcast/models/channel/sdk/server";
import { api as subjectPaymentApi } from "@sps/rbac/models/subject/sdk/server";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { Handler as ProviderHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/payment-intent/provider";
import { Service as Checkout } from "./checkout";
import { Service as RetryableIds } from "./retryable-ids";
import {
  CRUDService,
  consistencyContext,
  createAppAssembly,
} from "@sps/shared-backend-api";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import { createModule } from "../../../module";
import { serviceBootstrap as ownersBootstrap } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as productRolesBootstrap } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as grantsBootstrap } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as balancesBootstrap } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as profilesBootstrap } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as identitiesBootstrap } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storeBootstrap } from "@sps/ecommerce/models/store/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as storeOrdersBootstrap } from "@sps/ecommerce/relations/stores-to-orders/backend/app/api/src/lib/bootstrap";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { logger, signJwt } from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { Service as PasswordAuthentication } from "../../../startup/authentication/email-and-password";
import { Handler as PasswordLogin } from "../../../../controller/singlepage/authentication/email-and-password/authentication";
import { Service as MergeGuestCart } from "./merge-guest-cart";
import {
  createOrderBootstrap,
  serviceBootstrap as orderBootstrap,
} from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { createService as createReservationService } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/backend/app/api/src/lib/bootstrap";
import { Service as SubjectService } from "../../index";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Proceed } from "./proceed";
import { Service as Grants } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Service as Balances } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Handler as PaymentCheck } from "@sps/ecommerce/models/order/backend/app/api/src/lib/controller/startup/find-by-id/check";
import { Handler as OrderUpdate } from "@sps/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update";
import { db } from "@sps/providers-db";
import { eq } from "drizzle-orm";
import { Table as AttributeKeyTable } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import { createService as createOfferService } from "@sps/ecommerce/relations/stores-to-products/backend/app/api/src/lib/bootstrap";
import { Repository as OfferAttributeRepository } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/repository";
import { Configuration as OfferAttributeConfiguration } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/app/api/src/lib/configuration";

let mockStripeClient: any;
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  STRIPE_SECRET_KEY: "sk_test_local_period_fixture",
}));
jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockStripeClient),
}));

const paths = {
  store: "@sps/ecommerce/models/store",
  owners: "@sps/rbac/relations/subjects-to-ecommerce-module-orders",
  stores: "@sps/ecommerce/relations/stores-to-orders",
  productRoles: "@sps/rbac/relations/roles-to-ecommerce-module-products",
  grants: "@sps/rbac/relations/subjects-to-roles",
  balances: "@sps/rbac/relations/subjects-to-billing-module-currencies",
  profiles: "@sps/rbac/relations/subjects-to-social-module-profiles",
  identities: "@sps/rbac/relations/subjects-to-identities",
  offerLinks: "@sps/ecommerce/relations/offers-to-offers",
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
  return {
    params: { filters: { and: [{ column, method: "eq" as const, value }] } },
  };
}

function track(service: any) {
  const create = service.create.bind(service);
  jest.spyOn(service, "create").mockImplementation(async (props: any) => {
    const entity = await create(props);
    if (entity?.id) {
      cleanup.push(async () => {
        if (await service.repository.findFirstByField("id", entity.id)) {
          await service.repository.deleteFirstByField("id", entity.id);
        }
      });
    }
    return entity;
  });
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
  let orderAppBootstrap: ReturnType<typeof createOrderBootstrap>;
  const assembly = createAppAssembly(
    ({ overrideService, overrideServiceWith }) => {
      overrideServiceWith(orderBootstrap, (scope) =>
        orderAppBootstrap.createService(scope),
      );
      overrideService(ownersBootstrap, services.owners);
      overrideService(productRolesBootstrap, services.productRoles);
      overrideService(grantsBootstrap, services.grants);
      overrideService(balancesBootstrap, services.balances);
      overrideService(profilesBootstrap, services.profiles);
      overrideService(identitiesBootstrap, services.identities);
      overrideService(storeBootstrap, services.store);
      overrideService(storeOrdersBootstrap, services.stores);
    },
  );
  services.role = track(assembly.getOrCreate(createModule).role);
  orderAppBootstrap = createOrderBootstrap(createReservationService(assembly));
  const { app: orderApp } = await orderAppBootstrap.bootstrap(assembly);
  const order = track(orderApp.controller.service) as any;
  const createNextPeriodCart = order.createNextPeriodCart.bind(order);
  jest
    .spyOn(order, "createNextPeriodCart")
    .mockImplementation(async (props: any) => {
      const next = await createNextPeriodCart(props);
      cleanup.push(async () => {
        if (await order.repository.findFirstByField("id", next.id)) {
          await order.repository.deleteFirstByField("id", next.id);
        }
      });
      return next;
    });
  // Receipt rendering and notifications are external to payment/Role delivery.
  jest.spyOn(order.modules.fileStorage.file, "find").mockResolvedValue([]);
  jest.spyOn(logger, "error").mockImplementation((message, context: any) => {
    throw context?.error ?? new Error(String(message));
  });
  const product = track(order.module.product);
  const attribute = track(product.module.attribute);
  const attributeKey = track(
    assembly.getOrCreate(createModules).ecommerce.attributeKey,
  );
  const productAttributes = track(product.module.productsToAttributes);
  const attributeKeys = track(attributeKey.module.attributeKeysToAttributes);
  const attributeCurrencies = track(
    attribute.module.attributesToBillingModuleCurrencies,
  );
  const currency = track(order.modules.billing.currency);
  const intents = track(order.paymentIntent);
  const invoices = track(order.modules.billing.invoice);
  const intentInvoices = track(order.modules.billing.paymentIntentsToInvoices);
  const intentCurrencies = track(
    order.modules.billing.paymentIntentsToCurrencies,
  );
  const lines = track(order.module.ordersToProducts);
  const orderCurrencies = track(order.module.ordersToBillingModuleCurrencies);
  const orderIntents = track(order.ordersToBillingModulePaymentIntents);
  const offers = track(createOfferService(assembly));
  const offerAttributes = track(
    new CRUDService(
      new OfferAttributeRepository(new OfferAttributeConfiguration()),
    ),
  );
  const money = await currency.create({
    data: {
      slug: `retry-money-${suffix}`,
      title: "Retry fixture",
      symbol: "T",
    },
  });
  const item = await product.create({
    data: { slug: `retry-product-${suffix}`, type, kind: "digital" },
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
    data: { slug: `retry-price-${suffix}`, type: "price", field: "number" },
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
  for (const [slug, text] of [
    ["price_formula", "unit_price * quantity"],
    ["formula_version", "v1"],
  ]) {
    await db
      .insert(AttributeKeyTable)
      .values({ slug, field: "string" })
      .onConflictDoNothing();
    const [key] = await db
      .select()
      .from(AttributeKeyTable)
      .where(eq(AttributeKeyTable.slug, slug));
    const value = await attribute.create({ data: { string: { en: text } } });
    await attributeKeys.create({
      data: { attributeKeyId: key.id, attributeId: value.id },
    });
    await productAttributes.create({
      data: { productId: item.id, attributeId: value.id },
    });
  }
  const attachOffer = async (productId: string) => {
    const offer = await offers.create({
      data: {
        productId,
        storeId: store.id,
        sku: `retry-offer-${randomUUID()}`,
      },
    });
    await offerAttributes.create({
      data: { storesToProductsId: offer.id, attributeId: price.id },
    });
    return offer;
  };
  await attachOffer(item.id);
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
  const module = assembly.getOrCreate(createModule);
  const modules = assembly.getOrCreate(createModules);
  const proceed = new Proceed({
    repository: subjectRepository,
    module,
    modules,
    ecommerceProductCheckout: async () => {
      throw new Error("Unexpected automatic checkout");
    },
  });
  jest.spyOn(proceed, "notifyAdmin").mockResolvedValue(undefined);
  jest.spyOn(proceed, "notifyOrderOwner").mockResolvedValue(undefined);
  const subject = new SubjectService(
    subjectRepository,
    {} as any,
    {} as any,
    {} as any,
    proceed,
    {} as any,
  ).withAppAssembly(assembly);
  subject.configureRoleRevocation();

  // SDK self-HTTP uses the actual Order routes, without a listening server.
  const http = new Hono().route("/api/ecommerce/orders", orderApp.hono);
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(input as any, init);
    if (
      !new URL(request.url).pathname.startsWith("/api/ecommerce/orders") &&
      !new URL(request.url).pathname.startsWith("/api/billing/") &&
      !new URL(request.url).pathname.startsWith(
        "/api/rbac/subjects/ecommerce-module/orders/payment-intents/",
      )
    ) {
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
    const currentLines = await lines.find(where("orderId", orderId));
    const prepared = await offers.quote(
      order.module.ordersToProducts.offerSelection(currentLines, money.id),
    );
    if (prepared.amount === null || prepared.issues.length) {
      throw new Error("Fixture payment has no accepted offer quote");
    }
    const amount = Number(prepared.amount);
    const intent = await intents.create({
      data: {
        amount,
        status,
        type: "one_off",
        interval: type === "subscription" ? "day" : null,
      },
    });
    const invoice = await invoices.create({
      data: { amount, status: invoiceStatus, provider: "dummy" },
    });
    await intentInvoices.create({
      data: { paymentIntentId: intent.id, invoiceId: invoice.id },
    });
    await intentCurrencies.create({
      data: { paymentIntentId: intent.id, currencyId: money.id },
    });
    for (const charge of prepared.charges) {
      const line = currentLines.find((line) => line.id === charge.lineId)!;
      await orderIntents.create({
        data: {
          orderId,
          billingModulePaymentIntentId: intent.id,
          orderLineId: line.id,
          offerId: charge.offerId,
          reservationQuantity: charge.quantity,
          reservationStatus:
            status === "failed"
              ? "released"
              : status === "succeeded"
                ? "consumed"
                : "held",
          purchaseSnapshot: {
            version: 1,
            currencyId: money.id,
            amount: charge.amount,
            orderAmount: prepared.amount,
            purchaseType: type,
            interval: type === "subscription" ? "day" : undefined,
            parentLineId: line.parentLineId,
            quoteVersion: prepared.version,
            quoteExpiresAt: prepared.expiresAt,
            charge,
            destination: prepared.destination ?? {},
          },
        },
      });
    }
    await order.update({
      id: orderId,
      data: { type: "history", status: "paying" },
    });
    return { intent, invoice };
  };
  const settle = async (invoiceId: string) => {
    const invoice = await invoices.findById({ id: invoiceId });
    return intents.settlePayment({
      invoiceId,
      provider: "dummy",
      amount: invoice.amount,
    });
  };
  const createAlternativeProduct = async () => {
    const alternative = await product.create({
      data: {
        slug: `retry-alternative-${randomUUID()}`,
        type,
        kind: "digital",
      },
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
    await attachOffer(alternative.id);
    return alternative;
  };
  return {
    http,
    subjectRepository,
    price,
    money,
    buyer,
    stranger,
    subject,
    proceed,
    services,
    order,
    lines,
    role,
    attributeKey,
    attribute,
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
    offers,
    offerAttributes,
    item,
    store,
  };
}

async function freshCheckout() {
  const subjectRepository = new SubjectRepository(new SubjectConfiguration());
  const subjects = new CRUDService(subjectRepository);
  let orderAppBootstrap: ReturnType<typeof createOrderBootstrap>;
  const assembly = createAppAssembly(({ overrideServiceWith }) => {
    overrideServiceWith(orderBootstrap, (scope) =>
      orderAppBootstrap.createService(scope),
    );
  });
  orderAppBootstrap = createOrderBootstrap(createReservationService(assembly));
  await orderAppBootstrap.bootstrap(assembly);
  const module = assembly.getOrCreate(createModule);
  const modules = assembly.getOrCreate(createModules);
  jest
    .spyOn(modules.ecommerce.storesToProducts, "quoteMany")
    .mockRejectedValue(new Error("Recovery must not re-quote"));
  const paymentRecords = new RetryableIds({ module, modules });
  return new Checkout({
    repository: subjectRepository,
    assertPaymentStage: async () => {},
    findById: ({ id }) => subjects.findById({ id }),
    settledOrderIds: (input) => paymentRecords.settledIds(input),
    module,
    modules,
  });
}

async function committedPreparedCheckout(
  f: Awaited<ReturnType<typeof fixture>>,
) {
  const cart = await f.createCart();
  const input = {
    id: f.buyer.id,
    provider: "stripe",
    email: "original@example.test",
    comment: "Original buyer terms",
    ecommerceModule: { orders: [{ id: cart.id }] },
  };
  const lock = f.subjectRepository.withSubjectLock.bind(f.subjectRepository);
  let depth = 0;
  const crash = jest
    .spyOn(f.subjectRepository, "withSubjectLock")
    .mockImplementation(async (scope, run) => {
      const outer = depth++ === 0;
      try {
        const result = await lock(scope, run);
        if (outer) {
          throw new Error("simulated-process-stop-after-reservation-commit");
        }
        return result;
      } finally {
        depth--;
      }
    });
  jest.spyOn(channelApi, "pushMessage").mockResolvedValue({} as any);
  const provider = jest.spyOn(
    subjectPaymentApi,
    "ecommerceModuleOrderPaymentProvider",
  );
  await expect(f.subject.ecommerceOrderCheckout(input)).rejects.toThrow(
    "simulated-process-stop-after-reservation-commit",
  );
  crash.mockRestore();
  expect(provider).not.toHaveBeenCalled();
  provider.mockRestore();
  expect(consistencyContext.getStore()?.database).toBeUndefined();
  const allocations = await f.order.ordersToBillingModulePaymentIntents.find(
    where("orderId", cart.id),
  );
  expect(allocations).toHaveLength(1);
  const intent = await f.intents.findById({
    id: allocations[0].billingModulePaymentIntentId,
  });
  expect(intent).toMatchObject({
    checkoutDispatchState: "prepared",
    checkoutProvider: "stripe",
    checkoutCurrencyId: f.money.id,
    amount: 100,
  });
  expect(allocations[0]).toMatchObject({
    reservationStatus: "held",
    reservationQuantity: 1,
    purchaseSnapshot: { amount: "100.00", currencyId: f.money.id },
  });
  expect(
    await f.order.modules.billing.paymentIntentsToInvoices.find(
      where("paymentIntentId", intent.id),
    ),
  ).toEqual([]);
  return { cart, input, intent, allocations };
}

it("recovers a committed unsent reservation through fresh services and sends concurrent retries only once", async () => {
  const f = await fixture();
  const saved = await committedPreparedCheckout(f);
  await f.order.module.product.module.attribute.update({
    id: f.price.id,
    data: { number: "999" },
  });
  const adapter = jest
    .spyOn(f.intents, "stripe")
    .mockImplementation(async (props: any) => {
      expect(props).toMatchObject({
        entity: { id: saved.intent.id, amount: 100 },
        email: "original@example.test",
      });
      const invoice = await f.invoices.create({
        data: {
          amount: props.entity.amount,
          provider: "stripe",
          status: "open",
          paymentUrl: "https://fixture.test/original-allocation",
        },
      });
      await f.order.modules.billing.paymentIntentsToInvoices.create({
        data: { paymentIntentId: props.entity.id, invoiceId: invoice.id },
      });
      return invoice;
    });
  jest.spyOn(f.intents, "isProviderAllowed").mockReturnValue(true);
  f.http.post(
    "/api/rbac/subjects/ecommerce-module/orders/payment-intents/:uuid/providers/:provider",
    (c, next) =>
      new ProviderHandler(
        f.subject.ecommerceModuleOrderPaymentDispatch,
      ).execute(c, next),
  );
  f.http.post("/api/billing/payment-intents-to-currencies", async (c) => {
    const body = await c.req.parseBody();
    const result =
      await f.order.modules.billing.paymentIntentsToCurrencies.create({
        data: JSON.parse(String(body.data)),
      });
    return c.json({ data: result }, 201);
  });
  const first = await freshCheckout();
  const second = await freshCheckout();
  const altered = {
    ...saved.input,
    provider: "paykeeper",
    email: "changed@example.test",
    comment: "Changed terms",
    billingModule: { currency: { id: randomUUID() } },
  };
  const concurrent = await Promise.allSettled([
    first.execute(altered),
    second.execute(altered),
  ]);
  expect(concurrent.some((result) => result.status === "fulfilled")).toBe(true);
  for (const result of concurrent) {
    if (result.status === "rejected") {
      expect(String(result.reason)).toMatch(/in progress|unknown/);
    }
  }
  expect(adapter).toHaveBeenCalledTimes(1);
  const retry = await (await freshCheckout()).execute(altered);
  expect(retry.billingModule.invoices).toHaveLength(1);
  expect(retry.billingModule.invoices[0]).toMatchObject({
    amount: 100,
    status: "open",
    provider: "stripe",
    paymentUrl: "https://fixture.test/original-allocation",
  });
  expect(
    await f.order.ordersToBillingModulePaymentIntents.find(
      where("orderId", saved.cart.id),
    ),
  ).toEqual(saved.allocations);
  const recovered = await f.intents.findById({ id: saved.intent.id });
  expect(recovered.checkoutDispatchState).toBe("exposed");
  expect(recovered.checkoutMetadata).toEqual(saved.intent.checkoutMetadata);
  expect((await f.order.findById({ id: saved.cart.id })).comment).toBe(
    "Original buyer terms",
  );
  await f.intents.settlePayment({
    invoiceId: retry.billingModule.invoices[0].id,
    provider: "stripe",
    amount: 100,
  });
  expect((await f.intents.findById({ id: saved.intent.id })).status).toBe(
    "succeeded",
  );
});

it("preserves an unknown provider outcome after dispatch started instead of inferring unsent from a missing invoice", async () => {
  const f = await fixture();
  const saved = await committedPreparedCheckout(f);
  expect(
    await f.intents.claimCheckoutDispatch({
      id: saved.intent.id,
      provider: "stripe",
    }),
  ).toBeTruthy();
  const provider = jest.spyOn(
    subjectPaymentApi,
    "ecommerceModuleOrderPaymentProvider",
  );
  await expect((await freshCheckout()).execute(saved.input)).rejects.toThrow(
    "provider outcome is unknown",
  );
  expect(provider).not.toHaveBeenCalled();
  expect(
    await f.order.ordersToBillingModulePaymentIntents.find(
      where("orderId", saved.cart.id),
    ),
  ).toEqual(saved.allocations);
  expect(
    (await f.intents.findById({ id: saved.intent.id })).checkoutDispatchState,
  ).toBe("dispatching");
});

it("rejects buyer-written dispatch state and recovery metadata through generic PaymentIntent writes", async () => {
  const f = await fixture();
  const saved = await committedPreparedCheckout(f);
  await expect(
    f.intents.create({
      data: {
        checkoutDispatchState: "prepared",
        checkoutMetadata: { email: "forged@example.test" },
      },
    }),
  ).rejects.toThrow("server managed");
  await expect(
    f.intents.update({
      id: saved.intent.id,
      data: {
        checkoutProvider: "dummy",
        checkoutMetadata: { email: "forged@example.test" },
      },
    }),
  ).rejects.toThrow("server managed");
  await expect(
    f.intents.findOrCreate({
      data: {
        checkoutDispatchState: "prepared",
        checkoutMetadata: { invalid: true },
      },
    }),
  ).rejects.toThrow("server managed");
  await expect(
    f.intents.update({ id: saved.intent.id, data: { amount: 101 } }),
  ).rejects.toThrow("amount is immutable");
  expect(
    (await f.intents.findById({ id: saved.intent.id })).checkoutMetadata,
  ).toEqual(saved.intent.checkoutMetadata);
});

it("requires the buyer to select the store in an older cart before checkout can reserve stock", async () => {
  const f = await fixture();
  const cart = await f.createCart();
  const [line] = (await f.graph(cart.id)).products;
  await f.lines.repository.updateFirstByField("id", line.id, {
    offerId: null,
    quoteVersion: null,
    quoteExpiresAt: null,
  });
  const input = {
    id: f.buyer.id,
    email: "buyer@example.test",
    provider: "dummy",
    ecommerceModule: { orders: [{ id: cart.id }] },
  };
  await expect(f.subject.ecommerceOrderCheckout(input)).rejects.toThrow(
    "Select and save a store offer",
  );
  expect((await f.graph(cart.id)).products[0].offerId).toBeNull();
  await f.subject.ecommerceModuleOrderSelection({
    subjectId: f.buyer.id,
    orderId: cart.id,
    data: {
      action: "save",
      lineId: line.id,
      selections: [
        {
          offerId: line.offerId!,
          currencyId: f.money.id,
          quantity: line.quantity,
        },
      ],
      expectedSelectionUpdatedAt: new Date(
        line.selectionUpdatedAt,
      ).toISOString(),
    },
  });
  const prepared = await f.graph(cart.id);
  expect(prepared.products[0].offerId).toBe(line.offerId);
  expect(prepared.entity).toMatchObject({ type: "cart", status: "new" });
  expect(
    await f.order.ordersToBillingModulePaymentIntents.find(
      where("orderId", cart.id),
    ),
  ).toHaveLength(0);
  jest.spyOn(channelApi, "pushMessage").mockResolvedValue({} as any);
  jest
    .spyOn(subjectPaymentApi, "ecommerceModuleOrderPaymentProvider")
    .mockImplementation(async ({ id, data }: any) => {
      const intent = await f.intents.findById({ id });
      const invoice = await f.invoices.create({
        data: {
          amount: intent.amount,
          provider: "dummy",
          status: "open",
          paymentUrl: "https://fixture.test/pay",
        },
      });
      await f.order.modules.billing.paymentIntentsToInvoices.create({
        data: { paymentIntentId: id, invoiceId: invoice.id },
      });
      await f.order.modules.billing.paymentIntentsToCurrencies.create({
        data: { paymentIntentId: id, currencyId: data.currencyId },
      });
      return invoice;
    });
  await f.subject.ecommerceOrderCheckout(input);
  const holds = await f.order.ordersToBillingModulePaymentIntents.find(
    where("orderId", cart.id),
  );
  expect(holds).toHaveLength(1);
  expect(holds[0]).toMatchObject({
    offerId: line.offerId,
    reservationStatus: "held",
    reservationQuantity: 1,
  });
  expect(holds[0].purchaseSnapshot.amount).toBe("100.00");
});

it.each(["ambiguous", "multiple-products", "sold-out", "delivery-required"])(
  "does not bill an unresolved legacy cart: %s",
  async (state) => {
    const f = await fixture();
    const cart = await f.createCart();
    const [line] = (await f.graph(cart.id)).products;
    await f.lines.repository.updateFirstByField("id", line.id, {
      offerId: null,
      quoteVersion: null,
      quoteExpiresAt: null,
    });
    if (state === "ambiguous") {
      await f.offers.create({
        data: {
          productId: f.item.id,
          storeId: f.store.id,
          sku: `second-${randomUUID()}`,
        },
      });
    } else if (state === "multiple-products") {
      await f.lines.create({
        data: { orderId: cart.id, productId: f.item.id, quantity: 1 },
      });
    } else if (state === "sold-out") {
      await db
        .insert(AttributeKeyTable)
        .values({ slug: "stock_quantity", field: "number" })
        .onConflictDoNothing();
      const [key] = await db
        .select()
        .from(AttributeKeyTable)
        .where(eq(AttributeKeyTable.slug, "stock_quantity"));
      const stock = await f.order.module.product.module.attribute.create({
        data: { number: "0" },
      });
      await f.attributeKey.module.attributeKeysToAttributes.create({
        data: { attributeKeyId: key.id, attributeId: stock.id },
      });
      await f.offerAttributes.create({
        data: { storesToProductsId: line.offerId, attributeId: stock.id },
      });
    } else {
      const offer = await f.offers.findById({ id: line.offerId });
      await f.offers.update({
        id: offer.id,
        data: { ...offer, settings: { requiredDelivery: true } },
      });
    }
    await expect(
      f.subject.ecommerceOrderCheckout({
        id: f.buyer.id,
        email: "buyer@example.test",
        provider: "dummy",
        ecommerceModule: { orders: [{ id: cart.id }] },
      }),
    ).rejects.toThrow("Conflict error");
    expect(
      await f.order.ordersToBillingModulePaymentIntents.find(
        where("orderId", cart.id),
      ),
    ).toHaveLength(0);
    expect((await f.graph(cart.id)).entity).toMatchObject({
      type: "cart",
      status: "new",
    });
  },
);

it("reopens a durable historical invoice without guessing a legacy line offer or repricing its archived catalog", async () => {
  const f = await fixture();
  const cart = await f.createCart();
  const payment = await f.attachPayment(cart.id);
  await f.invoices.update({
    id: payment.invoice.id,
    data: { ...payment.invoice, paymentUrl: "https://fixture.test/existing" },
  });
  const [line] = (await f.graph(cart.id)).products;
  await f.lines.repository.updateFirstByField("id", line.id, { offerId: null });
  const offer = await f.offers.findById({ id: line.offerId });
  await f.offers.update({
    id: offer.id,
    data: { ...offer, variant: "hidden" },
  });
  jest.spyOn(channelApi, "pushMessage").mockResolvedValue({} as any);
  const result = await f.subject.ecommerceOrderCheckout({
    id: f.buyer.id,
    email: "buyer@example.test",
    provider: "dummy",
    ecommerceModule: { orders: [{ id: cart.id }] },
  });
  expect(result.billingModule.invoices.map((invoice) => invoice.id)).toEqual([
    payment.invoice.id,
  ]);
  expect(
    await f.order.ordersToBillingModulePaymentIntents.find(
      where("orderId", cart.id),
    ),
  ).toHaveLength(1);
});

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
  await f.order.modules.billing.paymentIntentsToInvoices.create({
    data: { paymentIntentId: intent.id, invoiceId: invoice.id },
  });
  for (const order of [first, second]) {
    await f.order.ordersToBillingModulePaymentIntents.create({
      data: { orderId: order.id, billingModulePaymentIntentId: intent.id },
    });
  }

  const comment = "Please call before arrival.\nUse the side entrance.";
  const checkout = (orderIds: string[]) =>
    f.subject.ecommerceOrderCheckout({
      id: f.buyer.id,
      provider: "dummy",
      comment,
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
  for (const id of [first.id, second.id]) {
    expect((await f.order.findById({ id })).comment).toBe(comment);
  }
});

it("returns only the buyer's own charge when a historical invoice covers two subjects", async () => {
  const f = await fixture();
  const mine = await f.createCart();
  const other = await f.createCart(f.item.id, f.stranger.id);
  const { intent, invoice } = await f.attachPayment(
    mine.id,
    "succeeded",
    "paid",
  );
  await f.order.ordersToBillingModulePaymentIntents.create({
    data: { orderId: other.id, billingModulePaymentIntentId: intent.id },
  });
  await f.invoices.update({ id: invoice.id, data: { amount: 200 } });
  const [entry] = await f.subject.ecommerceModuleOrderPurchaseDetails({
    subjectId: f.buyer.id,
    orders: [await f.order.findById({ id: mine.id })],
  });
  expect(entry.purchaseDetails.invoiceShares).toEqual([]);
  expect(entry.purchaseDetails.totals.map((row) => Number(row.total))).toEqual([
    100,
  ]);
  expect(entry.purchaseDetails.paymentUrl).toBeUndefined();
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

it("releases the committed reservation when checkout observer registration fails", async () => {
  const f = await fixture();
  const cart = await f.createCart();
  jest
    .spyOn(channelApi, "pushMessage")
    .mockRejectedValue(new Error("checkout-observer-failed"));
  const provider = jest.spyOn(
    subjectPaymentApi,
    "ecommerceModuleOrderPaymentProvider",
  );

  await expect(
    f.subject.ecommerceOrderCheckout({
      id: f.buyer.id,
      provider: "stripe",
      email: "buyer@example.test",
      ecommerceModule: { orders: [{ id: cart.id }] },
    }),
  ).rejects.toThrow("checkout-observer-failed");

  const reservations = await f.order.ordersToBillingModulePaymentIntents.find(
    where("orderId", cart.id),
  );
  expect(reservations).toHaveLength(1);
  expect(reservations[0].reservationStatus).toBe("released");
  const failedIntent = await f.intents.findById({
    id: reservations[0].billingModulePaymentIntentId,
  });
  expect(failedIntent.status).toBe("failed");
  const reservedQuantities =
    await f.order.ordersToBillingModulePaymentIntents.reservedQuantities({
      offerIds: [reservations[0].offerId],
    });
  expect(reservedQuantities).toEqual({ [reservations[0].offerId]: 0 });
  expect(provider).not.toHaveBeenCalled();
});

it("rolls back local payment preparation and leaves the original cart editable", async () => {
  const f = await fixture();
  const cart = await f.createCart();
  const original = await f.graph(cart.id);
  const relations =
    f.subject.modules.ecommerce.order.ordersToBillingModulePaymentIntents;
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
      f.subject.modules.ecommerce.order.ordersToBillingModulePaymentIntents;
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
    const context = consistencyContext.getStore() ?? {
      dependencies: new Map(),
      resources: new Set(),
      complete: true,
      isCovered: async () => false,
    };
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
    .spyOn(f.order.module.ordersToBillingModuleCurrencies, "create")
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
    const token = await f.order.modules.billing.currency.create({
      data: {
        slug: `retry-token-${randomUUID()}`,
        title: "Token",
        symbol: "T",
      },
    });
    const topupKey = await f.attributeKey.create({
      data: { slug: `retry-topup-${randomUUID()}`, type: "topup" },
    });
    const topup = await f.order.module.product.module.attribute.create({
      data: { number: "5000" },
    });
    const [line] = await f.lines.find(where("orderId", source.id));
    await f.order.module.product.module.productsToAttributes.create({
      data: { productId: line.productId, attributeId: topup.id },
    });
    await f.attributeKey.module.attributeKeysToAttributes.create({
      data: { attributeKeyId: topupKey.id, attributeId: topup.id },
    });
    await f.attribute.module.attributesToBillingModuleCurrencies.create({
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

async function accessToken(
  subjectId: string,
  type: "access" | "refresh" = "access",
) {
  return signJwt({ subjectId, type, lifetimeInSeconds: 600 }, RBAC_JWT_SECRET!);
}

it("keeps the account product and adds two guest top-ups on password sign-in", async () => {
  const f = await fixture();
  const accountProduct = await f.createAlternativeProduct();
  const pro = await f.createCart(accountProduct.id);
  const guestCart = await f.createCart(undefined, f.stranger.id);
  const [line] = (await f.graph(guestCart.id)).products;
  await f.subject.ecommerceModuleOrderMutateCart({
    subjectId: f.stranger.id,
    orderId: guestCart.id,
    lines: [{ id: line.id, quantity: 2 }],
  });
  const guestToken = await accessToken(f.stranger.id);
  const tokens = {
    jwt: await accessToken(f.buyer.id),
    refresh: await accessToken(f.buyer.id, "refresh"),
  };
  const authenticate = jest
    .spyOn(PasswordAuthentication.prototype, "execute")
    .mockResolvedValue(tokens);
  jest
    .spyOn(f.subject, "socialModuleProfileOwnershipEnsure")
    .mockResolvedValue(undefined as any);
  jest.spyOn(f.subject, "freeSubscriptionEnsure").mockResolvedValue(undefined);
  const handler = new PasswordLogin(f.subject);
  const http = new Hono().post("/login", (c, next) => handler.execute(c, next));
  const login = () => {
    const body = new FormData();
    body.set(
      "data",
      JSON.stringify({ login: "visitor@example.test", password: "fixture" }),
    );
    return http.request("/login", {
      method: "POST",
      body,
      headers: { Authorization: "Bearer " + guestToken },
    });
  };
  authenticate.mockRejectedValueOnce(
    new Error("Authentication error. Invalid credentials"),
  );
  expect((await login()).status).not.toBe(201);
  expect((await f.graph(guestCart.id)).owners[0].subjectId).toBe(f.stranger.id);
  expect((await login()).status).toBe(201);
  expect((await login()).status).toBe(201);
  expect(
    (await f.cartsFor()).map((cart: { id: string }) => cart.id).sort(),
  ).toEqual([guestCart.id, pro.id].sort());
  const transferred = await f.graph(guestCart.id);
  expect(transferred.owners).toHaveLength(1);
  expect(transferred.owners[0].subjectId).toBe(f.buyer.id);
  expect(transferred.products).toEqual([
    expect.objectContaining({ id: line.id, quantity: 2 }),
  ]);
  expect((await f.graph(pro.id)).products[0]).toMatchObject({
    productId: accountProduct.id,
    quantity: 1,
  });
  expect(await f.cartsFor(f.stranger.id)).toHaveLength(0);
});

it.each(["guest", "account", "tie"])(
  "keeps the latest quantity for duplicates (%s) across concurrent logins",
  async (latest) => {
    const f = await fixture();
    const account = await f.createCart();
    const guest = await f.createCart(undefined, f.stranger.id);
    const [accountLine] = (await f.graph(account.id)).products;
    const [guestLine] = (await f.graph(guest.id)).products;
    const earlier = new Date("2026-01-01T00:00:00Z");
    const later = new Date("2026-01-02T00:00:00Z");
    await f.lines.repository.updateFirstByField("id", guestLine.id, {
      quantity: 2,
      updatedAt: latest === "account" ? earlier : later,
      selectionUpdatedAt: latest === "account" ? earlier : later,
    });
    await f.lines.repository.updateFirstByField("id", accountLine.id, {
      quantity: 3,
      updatedAt: latest === "guest" ? earlier : later,
      selectionUpdatedAt: latest === "guest" ? earlier : later,
    });
    const props = {
      guestToken: await accessToken(f.stranger.id),
      subjectId: f.buyer.id,
    };
    await Promise.all([
      new MergeGuestCart(f.subject).execute(props),
      new MergeGuestCart(f.subject).execute(props),
    ]);
    const [cart] = await f.cartsFor();
    expect(await f.cartsFor()).toHaveLength(1);
    expect((await f.graph(cart.id)).products).toEqual([
      expect.objectContaining({ quantity: latest === "guest" ? 2 : 3 }),
    ]);
    expect(await f.cartsFor(f.stranger.id)).toHaveLength(0);
  },
);

it("leaves a guest's payment with its owner while transferring an independent open order", async () => {
  const f = await fixture();
  const history = await f.createCart(undefined, f.stranger.id);
  await f.attachPayment(history.id);
  const open = await f.createCart(undefined, f.stranger.id);
  await new MergeGuestCart(f.subject).execute({
    guestToken: await accessToken(f.stranger.id),
    subjectId: f.buyer.id,
  });
  expect((await f.graph(history.id)).owners[0].subjectId).toBe(f.stranger.id);
  expect((await f.graph(open.id)).owners[0].subjectId).toBe(f.buyer.id);
  expect(await f.grantRows()).toHaveLength(0);
});

it("preserves a cart with a payment attempt and ignores sessions that do not prove an anonymous visitor", async () => {
  const f = await fixture();
  const cart = await f.createCart(undefined, f.stranger.id);
  const merge = new MergeGuestCart(f.subject);
  const valid = await accessToken(f.stranger.id);
  const props = { subjectId: f.buyer.id, guestToken: valid };
  await merge.execute({
    ...props,
    guestToken: await accessToken(f.stranger.id, "refresh"),
  });
  await merge.execute({ ...props, guestToken: "invalid" });
  const identities = jest
    .spyOn(f.subject.module.subjectsToIdentities, "find")
    .mockResolvedValueOnce([{ subjectId: f.stranger.id }] as any);
  await merge.execute(props);
  identities.mockRestore();
  expect((await f.graph(cart.id)).owners[0].subjectId).toBe(f.stranger.id);
  await f.attachPayment(cart.id);
  await f.order.update({ id: cart.id, data: { type: "cart", status: "new" } });
  await merge.execute(props);
  expect((await f.graph(cart.id)).owners[0].subjectId).toBe(f.stranger.id);
});

it("rolls back a duplicate removal when changing the owner fails and allows retry", async () => {
  const f = await fixture();
  const account = await f.createCart();
  const guest = await f.createCart(undefined, f.stranger.id);
  const [userLine] = (await f.graph(account.id)).products;
  await f.lines.repository.updateFirstByField("id", userLine.id, {
    updatedAt: new Date("2025-01-01"),
  });
  const merge = new MergeGuestCart(f.subject);
  const props = {
    subjectId: f.buyer.id,
    guestToken: await accessToken(f.stranger.id),
  };
  const update = jest
    .spyOn(f.subject.module.subjectsToEcommerceModuleOrders, "update")
    .mockRejectedValueOnce(new Error("fixture write failed"));
  await expect(merge.execute(props)).rejects.toThrow("fixture write failed");
  update.mockRestore();
  expect((await f.graph(account.id)).products).toHaveLength(1);
  expect((await f.graph(guest.id)).owners[0].subjectId).toBe(f.stranger.id);
  await merge.execute(props);
  expect((await f.graph(guest.id)).owners[0].subjectId).toBe(f.buyer.id);
});

it("keeps both selections when the account already started paying for the same product", async () => {
  const f = await fixture();
  const account = await f.createCart();
  const guest = await f.createCart(undefined, f.stranger.id);
  await f.attachPayment(account.id);
  await f.order.update({
    id: account.id,
    data: { type: "cart", status: "new" },
  });
  await new MergeGuestCart(f.subject).execute({
    subjectId: f.buyer.id,
    guestToken: await accessToken(f.stranger.id),
  });
  expect((await f.graph(account.id)).owners[0].subjectId).toBe(f.buyer.id);
  expect((await f.graph(guest.id)).owners[0].subjectId).toBe(f.stranger.id);
  expect((await f.graph(guest.id)).products).toHaveLength(1);
});

it("does not move a cart after the guest session has logged out", async () => {
  const f = await fixture();
  const cart = await f.createCart(undefined, f.stranger.id);
  const guestToken = await accessToken(f.stranger.id);
  await f.subject.repository.updateFirstByField("id", f.stranger.id, {
    tokensValidAfter: new Date(),
  });
  await new MergeGuestCart(f.subject).execute({
    subjectId: f.buyer.id,
    guestToken,
  });
  expect((await f.graph(cart.id)).owners[0].subjectId).toBe(f.stranger.id);
});

it("keeps the saved amount in total, extended and Subject history readers after price and availability changes", async () => {
  const f = await fixture();
  const cart = await f.createCart();
  const payment = await f.attachPayment(cart.id);
  await f.settle(payment.invoice.id);
  const [line] = (await f.graph(cart.id)).products;
  const prices = await f.offerAttributes.find(
    where("storesToProductsId", line.offerId),
  );
  const price = await f.order.module.product.module.attribute.findById({
    id: prices[0].attributeId,
  });
  await f.order.module.product.module.attribute.update({
    id: price.id,
    data: { ...price, number: "200" },
  });
  const offer = await f.offers.findById({ id: line.offerId });
  await f.offers.update({
    id: offer.id,
    data: { ...offer, variant: "hidden" },
  });
  expect((await f.order.findByIdTotal({ id: cart.id })).totals[0].total).toBe(
    100,
  );
  expect(
    (await f.order.findByIdExtended({ id: cart.id }))
      .checkoutAttributesByCurrency.amount,
  ).toBe(100);
  const currentSlug = `renamed-${f.item.id}`;
  await f.order.module.product.update({
    id: f.item.id,
    data: { slug: currentSlug },
  });
  const history = await f.subject.ecommerceModuleOrderPurchaseDetails({
    subjectId: f.buyer.id,
    orders: [await f.order.findById({ id: cart.id })],
  });
  expect(history[0].purchaseDetails.totals[0].total).toBe(100);
  expect(history[0].purchaseDetails.primaryProductSlug).toBe(currentSlug);
  expect(history[0].purchaseDetails.charges?.[0].amount).toBe("100.00");
  expect((await f.invoices.findById({ id: payment.invoice.id })).amount).toBe(
    100,
  );
});

it.each(["first", "each"] as const)(
  "keeps %s contractor fulfillment on its saved schedule through renewal reads, edits and payment",
  async (recurrence) => {
    const f = await fixture("subscription");
    await f.order.module.product.update({
      id: f.item.id,
      data: { kind: "physical" },
    });
    const contractor = await f.services.store.create({
      data: { slug: `renewal-contractor-${randomUUID()}` },
    });
    const delivery = await f.order.module.product.create({
      data: {
        slug: `renewal-receipt-${randomUUID()}`,
        type: "one_off",
        kind: "service",
      },
    });
    const attributes =
      await f.order.module.product.module.productsToAttributes.find(
        where("productId", f.item.id),
      );
    for (const link of attributes) {
      await f.order.module.product.module.productsToAttributes.create({
        data: { productId: delivery.id, attributeId: link.attributeId },
      });
    }
    const receipt = await f.offers.create({
      data: {
        productId: delivery.id,
        storeId: contractor.id,
        sku: `renewal-receipt-${randomUUID()}`,
        settings: { receiptMethod: "electronic" },
      },
    });
    await f.offerAttributes.create({
      data: { storesToProductsId: receipt.id, attributeId: f.price.id },
    });
    const [merchandise] = await f.offers.find(where("productId", f.item.id));
    await f.services.offerLinks.create({
      data: {
        sourceOfferId: merchandise.id,
        targetOfferId: receipt.id,
        variant: "delivery",
        recurrence,
      },
    });
    const source = await f.createCart();
    const originalPayment = await f.attachPayment(source.id);
    await f.settle(originalPayment.invoice.id);
    await f.check(source.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    const paid = await f.order.findById({ id: source.id });
    expect(paid.subscriptionPeriodInvoiceId).toBe(originalPayment.invoice.id);
    await new OrderLifecycleService(f.order.repository).writeSubscriptionPeriod(
      {
        id: source.id,
        before: paid,
        startsAt: new Date(Date.now() - 2 * 86400000),
        endsAt: new Date(Date.now() - 86400000),
        invoiceId: originalPayment.invoice.id,
        status: "expired",
      },
    );
    const next = await f.subject.ecommerceModuleOrderRepeat({
      subjectId: f.buyer.id,
      orderId: source.id,
      mode: "next-period",
    });
    const nextId = next.orderIds[0];
    cleanup.push(async () => {
      await f.order.repository.deleteFirstByField("id", nextId);
    });
    const created = await f.graph(nextId);
    expect(created.products.filter((line) => line.parentLineId)).toHaveLength(
      recurrence === "each" ? 1 : 0,
    );
    const firstRead = await f.subject.ecommerceModuleOrderCartDetails({
      subjectId: f.buyer.id,
      orderId: nextId,
    });
    expect(firstRead.unpriced).toEqual([]);
    expect(firstRead.totals[0].total).toBe(recurrence === "each" ? 200 : 100);
    expect(
      firstRead.offerQuotes![0].charges.filter(
        (charge) => charge.role === "delivery",
      ),
    ).toHaveLength(recurrence === "each" ? 1 : 0);
    const primary = created.products.find((line) => !line.parentLineId);
    await f.subject.ecommerceModuleOrderMutateCart({
      subjectId: f.buyer.id,
      orderId: nextId,
      lines: [{ id: primary.id, quantity: 2 }],
    });
    const edited = await f.subject.ecommerceModuleOrderCartDetails({
      subjectId: f.buyer.id,
      orderId: nextId,
    });
    expect(edited.unpriced).toEqual([]);
    const expectedAmount = recurrence === "each" ? 400 : 200;
    expect(edited.totals[0].total).toBe(expectedAmount);
    jest.spyOn(channelApi, "pushMessage").mockResolvedValue({} as any);
    jest
      .spyOn(subjectPaymentApi, "ecommerceModuleOrderPaymentProvider")
      .mockImplementation(async ({ id, data }: any) => {
        const intent = await f.intents.findById({ id });
        const invoice = await f.invoices.create({
          data: {
            amount: intent.amount,
            provider: "dummy",
            status: "open",
            paymentUrl: "https://fixture.test/pay",
          },
        });
        await f.order.modules.billing.paymentIntentsToInvoices.create({
          data: { paymentIntentId: id, invoiceId: invoice.id },
        });
        await f.order.modules.billing.paymentIntentsToCurrencies.create({
          data: { paymentIntentId: id, currencyId: data.currencyId },
        });
        return invoice;
      });
    await f.subject.ecommerceOrderCheckout({
      id: f.buyer.id,
      provider: "dummy",
      email: "buyer@example.test",
      ecommerceModule: { orders: [{ id: nextId }] },
    });
    const reservations = await f.order.ordersToBillingModulePaymentIntents.find(
      where("orderId", nextId),
    );
    expect(reservations).toHaveLength(recurrence === "each" ? 2 : 1);
    const payment = await f.intents.findById({
      id: reservations[0].billingModulePaymentIntentId,
    });
    expect(payment).toMatchObject({ amount: expectedAmount, type: "one_off" });
    const deliveries = reservations.filter(
      (link) => link.purchaseSnapshot.charge.role === "delivery",
    );
    expect(deliveries).toHaveLength(recurrence === "each" ? 1 : 0);
    if (recurrence === "each") {
      expect(deliveries[0].purchaseSnapshot.charge).toMatchObject({
        offerId: receipt.id,
        storeId: contractor.id,
        providerStoreId: contractor.id,
        recurrence: "each",
      });
    }
  },
);

it.each(["digital", "legacy-digital", "physical", "physical-cancel"])(
  "prepares one local Stripe period on the final day with %s fulfillment",
  async (kind) => {
    const f = await fixture("subscription");
    let stockAttributeId: string | undefined;
    if (kind.startsWith("physical")) {
      await f.order.module.product.update({
        id: f.item.id,
        data: { kind: "physical" },
      });
      const delivery = await f.order.module.product.create({
        data: {
          slug: `stripe-delivery-${randomUUID()}`,
          type: "one_off",
          kind: "service",
        },
      });
      const attributes =
        await f.order.module.product.module.productsToAttributes.find(
          where("productId", f.item.id),
        );
      for (const link of attributes) {
        await f.order.module.product.module.productsToAttributes.create({
          data: { productId: delivery.id, attributeId: link.attributeId },
        });
      }
      const receipt = await f.offers.create({
        data: {
          productId: delivery.id,
          storeId: f.store.id,
          sku: `stripe-receipt-${randomUUID()}`,
          settings: { receiptMethod: "electronic" },
        },
      });
      await f.offerAttributes.create({
        data: { storesToProductsId: receipt.id, attributeId: f.price.id },
      });
      const [merchandise] = await f.offers.find(where("productId", f.item.id));
      await f.services.offerLinks.create({
        data: {
          sourceOfferId: merchandise.id,
          targetOfferId: receipt.id,
          variant: "delivery",
          recurrence: "each",
        },
      });
      await db
        .insert(AttributeKeyTable)
        .values({ slug: "stock_quantity", field: "number" })
        .onConflictDoNothing();
      const [stockKey] = await db
        .select()
        .from(AttributeKeyTable)
        .where(eq(AttributeKeyTable.slug, "stock_quantity"));
      const stock = await f.order.module.product.module.attribute.create({
        data: { number: "3" },
      });
      stockAttributeId = stock.id;
      await f.attributeKey.module.attributeKeysToAttributes.create({
        data: { attributeKeyId: stockKey.id, attributeId: stock.id },
      });
      await f.offerAttributes.create({
        data: { storesToProductsId: merchandise.id, attributeId: stock.id },
      });
    }
    const cart = await f.createCart();
    const payment = await f.attachPayment(
      cart.id,
      "requires_payment_method",
      "open",
    );
    const periodAmount = payment.intent.amount;
    await f.intents.update({
      id: payment.intent.id,
      data: { ...payment.intent, type: "subscription" },
    });
    await f.invoices.update({
      id: payment.invoice.id,
      data: {
        ...payment.invoice,
        provider: "stripe",
        providerId: `in_initial_${cart.id}`,
      },
    });
    await f.subjectRepository.withSubjectLock({ subjectId: f.buyer.id }, () =>
      f.intents.prepareCheckoutDispatch({
        id: payment.intent.id,
        provider: "stripe",
        currencyId: f.money.id,
        metadata: { email: "period@example.test" },
      }),
    );
    (f.proceed as any).ecommerceOrderRenewal = (props: any) =>
      f.subject.ecommerceModuleOrderRenewal(props);
    const firstStart = Math.floor(Date.now() / 1000) - 3600;
    const subscription = {
      id: `sub_${cart.id}`,
      metadata: { paymentIntentId: payment.intent.id },
      status: "active",
    };
    const remote = (id: string, start: number, reason: string) => ({
      id,
      object: "invoice",
      subscription: subscription.id,
      created: start,
      billing_reason: reason,
      currency: f.money.slug,
      status: "paid",
      amount_due: periodAmount * 100,
      amount_paid: periodAmount * 100,
      lines: {
        has_more: false,
        data: [
          {
            currency: f.money.slug,
            parent: {
              subscription_item_details: {
                subscription: subscription.id,
                proration: false,
              },
            },
            period: { start, end: start + 86400 },
          },
        ],
      },
    });
    const first = remote(
      `in_initial_${cart.id}`,
      firstStart,
      "subscription_create",
    );
    const cycle = remote(
      `in_cycle_${cart.id}`,
      firstStart + 86400,
      "subscription_cycle",
    );
    const remoteInvoices = [first];
    const createRemote = jest.fn(() => {
      throw new Error(
        "Scheduled preparation must not create a provider charge",
      );
    });
    mockStripeClient = {
      invoices: {
        retrieve: jest.fn(async (id) =>
          remoteInvoices.find((invoice) => invoice.id === id),
        ),
        list: jest.fn(() => ({
          async *[Symbol.asyncIterator]() {
            yield* remoteInvoices;
          },
        })),
      },
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue(subscription),
        create: createRemote,
        update: jest.fn(),
      },
      checkout: { sessions: { create: createRemote } },
    };
    await f.subject.ecommerceModuleOrderStripePayment.webhook({
      data: { object: first },
    } as any);
    await f.check(cart.id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    expect(
      await f.order.find(where("subscriptionSourceOrderId", cart.id)),
    ).toHaveLength(0);
    if (kind === "legacy-digital") {
      const legacyLines = await f.lines.find(where("orderId", cart.id));
      for (const line of legacyLines) {
        await f.lines.repository.updateFirstByField("id", line.id, {
          offerId: null,
        });
      }
      const legacyPayments =
        await f.order.ordersToBillingModulePaymentIntents.find(
          where("orderId", cart.id),
        );
      for (const link of legacyPayments) {
        await f.order.ordersToBillingModulePaymentIntents.repository.updateFirstByField(
          "id",
          link.id,
          { purchaseSnapshot: null, offerId: null, orderLineId: null },
        );
      }
      const accepted = await f.order.findById({ id: cart.id });
      await f.order.repository.updateFirstByField("id", cart.id, {
        subscriptionPeriodStartsAt: new Date(
          accepted.subscriptionPeriodStartsAt.getTime() + 789,
        ),
        subscriptionPeriodEndsAt: new Date(
          accepted.subscriptionPeriodEndsAt.getTime() + 789,
        ),
        subscriptionScheduledStartsAt: null,
        subscriptionScheduledEndsAt: null,
        subscriptionProviderInvoiceId: null,
      });
    }
    const original = await f.order.findById({ id: cart.id });
    expect(original.subscriptionPeriodInvoiceId).toBe(payment.invoice.id);
    expect(await f.grantRows()).toHaveLength(1);
    const provider = jest.spyOn(
      subjectPaymentApi,
      "ecommerceModuleOrderPaymentProvider",
    );
    const preparations = await Promise.all([
      f.subject.ecommerceModuleOrderRenewal({
        subjectId: f.buyer.id,
        orderId: cart.id,
      }),
      f.subject.ecommerceModuleOrderRenewal({
        subjectId: f.buyer.id,
        orderId: cart.id,
      }),
    ]);
    const next = await f.order.find(
      where("subscriptionSourceOrderId", cart.id),
    );
    expect(next).toHaveLength(1);
    expect(preparations).toEqual([
      { orderId: next[0].id },
      { orderId: next[0].id },
    ]);
    const links = await f.order.ordersToBillingModulePaymentIntents.find(
      where("orderId", next[0].id),
    );
    const intentIds = [
      ...new Set<string>(
        links.map((link: any) => link.billingModulePaymentIntentId),
      ),
    ];
    expect(intentIds).toHaveLength(1);
    const invoiceLinks =
      await f.order.modules.billing.paymentIntentsToInvoices.find(
        where("paymentIntentId", intentIds[0]),
      );
    expect(invoiceLinks).toHaveLength(1);
    const draft = await f.invoices.findById({ id: invoiceLinks[0].invoiceId });
    expect(draft).toMatchObject({
      provider: "stripe",
      providerId: null,
      status: "draft",
      amount: periodAmount,
    });
    if (stockAttributeId) {
      expect(
        (
          await f.order.module.product.module.attribute.findById({
            id: stockAttributeId,
          })
        ).number,
      ).toBe("2");
      expect(
        links.find(
          (link: any) => link.purchaseSnapshot.charge.role === "product",
        ).reservationStatus,
      ).toBe("held");
    }
    if (kind === "physical-cancel") {
      await f.order.update({
        id: cart.id,
        data: { status: "requested_cancelation" },
      });
      await f.proceed.execute({ subjectId: f.buyer.id });
      expect((await f.order.findById({ id: next[0].id })).status).toBe(
        "canceled",
      );
      expect((await f.invoices.findById({ id: draft.id })).status).toBe("void");
      const released = await f.order.ordersToBillingModulePaymentIntents.find(
        where("orderId", next[0].id),
      );
      expect(
        released.every((link: any) => link.reservationStatus === "released"),
      ).toBe(true);
      expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(
        subscription.id,
        { cancel_at_period_end: true },
      );
      expect(createRemote).not.toHaveBeenCalled();
      expect(provider).not.toHaveBeenCalled();
      return;
    }
    expect(provider).not.toHaveBeenCalled();
    remoteInvoices.push(cycle);
    await Promise.all([
      f.subject.ecommerceModuleOrderStripePayment.webhook({
        data: { object: cycle },
      } as any),
      f.subject.ecommerceModuleOrderStripePayment.webhook({
        data: { object: cycle },
      } as any),
    ]);
    await f.check(next[0].id);
    await f.proceed.execute({ subjectId: f.buyer.id });
    await f.proceed.execute({ subjectId: f.buyer.id });
    const settled = await f.invoices.findById({ id: draft.id });
    expect(settled).toMatchObject({
      id: draft.id,
      status: "paid",
      providerId: cycle.id,
    });
    expect(
      await f.order.modules.billing.paymentIntentsToInvoices.find(
        where("paymentIntentId", intentIds[0]),
      ),
    ).toHaveLength(1);
    const originalAfter = await f.order.findById({ id: cart.id });
    expect(originalAfter.subscriptionPeriodInvoiceId).toBe(
      original.subscriptionPeriodInvoiceId,
    );
    expect(originalAfter.subscriptionPeriodStartsAt).toEqual(
      original.subscriptionPeriodStartsAt,
    );
    expect(originalAfter.subscriptionPeriodEndsAt).toEqual(
      original.subscriptionPeriodEndsAt,
    );
    const accepted = await f.order.findById({ id: next[0].id });
    expect(accepted.subscriptionPeriodInvoiceId).toBe(draft.id);
    expect(accepted.subscriptionPeriodStartsAt).toEqual(
      new Date(cycle.lines.data[0].period.start * 1000),
    );
    expect(await f.grantRows()).toHaveLength(1);
    if (stockAttributeId) {
      expect(
        (
          await f.order.module.product.module.attribute.findById({
            id: stockAttributeId,
          })
        ).number,
      ).toBe("1");
    }
    expect(createRemote).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  },
);
