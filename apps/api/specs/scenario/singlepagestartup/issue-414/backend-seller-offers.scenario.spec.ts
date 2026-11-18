import { randomUUID } from "node:crypto";
import { sign } from "hono/jwt";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { api as roleApi } from "@sps/rbac/models/role/sdk/server";
import { api as subjectsToRolesApi } from "@sps/rbac/relations/subjects-to-roles/sdk/server";
import { api as rolesToPermissionsApi } from "@sps/rbac/relations/roles-to-permissions/sdk/server";
import { api as storeApi } from "@sps/ecommerce/models/store/sdk/server";
import { api as productApi } from "@sps/ecommerce/models/product/sdk/server";
import { api as offerApi } from "@sps/ecommerce/relations/stores-to-products/sdk/server";
import { api as linksApi } from "@sps/ecommerce/relations/offers-to-offers/sdk/server";
import { api as attributeApi } from "@sps/ecommerce/models/attribute/sdk/server";
import { api as keyApi } from "@sps/ecommerce/models/attribute-key/sdk/server";
import { api as keyAttributesApi } from "@sps/ecommerce/relations/attribute-keys-to-attributes/sdk/server";
import { api as productAttributesApi } from "@sps/ecommerce/relations/products-to-attributes/sdk/server";
import { api as offerAttributesApi } from "@sps/ecommerce/relations/stores-to-products-to-attributes/sdk/server";
import { api as currencyApi } from "@sps/billing/models/currency/sdk/server";
import { api as orderApi } from "@sps/ecommerce/models/order/sdk/server";
import { api as linesApi } from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { api as attemptsApi } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/server";
import { api as intentApi } from "@sps/billing/models/payment-intent/sdk/server";
import { api as invoiceApi } from "@sps/billing/models/invoice/sdk/server";
import { api as intentInvoicesApi } from "@sps/billing/relations/payment-intents-to-invoices/sdk/server";
import type {
  ICatalogCreateOfferInput,
  ICatalogCreateOfferResult,
} from "@sps/rbac/models/subject/sdk/model";
import { getApiUrl, getRequiredEnv } from "../issue-154/test-utils/env";

interface IActor {
  id: string;
  email: string;
  options: { headers: Record<string, string> };
}
const actors = new Map<string, string>();
const cleanup: (() => Promise<unknown>)[] = [];
const attributes = new Set<string>();
const newKeys = new Set<string>();
let originalKeys = new Set<string>();
const suffix = randomUUID();
const operator = () => ({
  headers: {
    "X-RBAC-SECRET-KEY": getRequiredEnv("RBAC_SECRET_KEY"),
    "Cache-Control": "no-store",
  },
});

async function create(
  api: any,
  data: Record<string, unknown>,
  options: { headers: Record<string, string> } = operator(),
) {
  const subjectId = actors.get(options.headers.Authorization);
  const entity =
    api === storeApi
      ? "stores"
      : api === productApi
        ? "products"
        : api === offerApi
          ? "stores-to-products"
          : api === linksApi
            ? "offers-to-offers"
            : undefined;
  const record =
    subjectId && entity
      ? await subjectApi.ecommerceModuleCatalogMutation({
          id: subjectId,
          data: { entity, method: "POST", data },
          options,
        })
      : await api.create({ data, options });
  cleanup.unshift(async () => {
    try {
      await api.delete({ id: record.id, options: operator() });
    } catch (error: any) {
      if (
        error.status !== 404 &&
        !String(error.message).includes("not found") &&
        !String(error.message).includes("Not Found")
      ) {
        throw error;
      }
    }
  });
  return record;
}

async function actor(name: string): Promise<IActor> {
  const person = await create(subjectApi, {
    slug: `issue414-${name}-${suffix}`,
  });
  const identity = await create(identityApi, {
    email: `${name}-${suffix}@example.test`,
  });
  await create(subjectsToIdentitiesApi, {
    subjectId: person.id,
    identityId: identity.id,
  });
  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { subject: { id: person.id }, iat: now, exp: now + 300 },
    getRequiredEnv("RBAC_JWT_SECRET"),
    "HS256",
  );
  actors.set(`Bearer ${token}`, person.id);
  return {
    id: person.id,
    email: `${name}-${suffix}@example.test`,
    options: {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-store",
      },
    },
  };
}

async function captureAttributes(api: any, column: string, id: string) {
  const rows = await api.find({
    params: { filters: { and: [{ column, method: "eq", value: id }] } },
    options: operator(),
  });
  for (const row of rows) {
    attributes.add(row.attributeId);
    const links = await keyAttributesApi.find({
      params: {
        filters: {
          and: [
            { column: "attributeId", method: "eq", value: row.attributeId },
          ],
        },
      },
      options: operator(),
    });
    for (const link of links ?? []) {
      if (!originalKeys.has(link.attributeKeyId)) {
        newKeys.add(link.attributeKeyId);
      }
    }
  }
}

async function offer(
  actor: IActor,
  data: ICatalogCreateOfferInput,
): Promise<ICatalogCreateOfferResult> {
  const result = await subjectApi.ecommerceModuleOfferCreate({
    id: actor.id,
    data,
    options: actor.options,
  });
  if (data.product) {
    cleanup.unshift(() =>
      productApi.delete({ id: result.product.id, options: operator() }),
    );
    await captureAttributes(
      productAttributesApi,
      "productId",
      result.product.id,
    );
  }
  cleanup.unshift(() =>
    offerApi.delete({ id: result.offer.id, options: operator() }),
  );
  await captureAttributes(
    offerAttributesApi,
    "storesToProductsId",
    result.offer.id,
  );
  return result;
}

beforeAll(async () => {
  for (const [method, operation] of [
    ["GET", "catalogue-context"],
    ["POST", "offers"],
    ["POST", "catalogue-attributes"],
    ["POST", "catalogue-mutations"],
  ]) {
    const path = `/api/rbac/subjects/[rbac.subjects.id]/ecommerce-module/${operation}`;
    const installed = await permissionApi.find({
      params: {
        filters: {
          and: [
            { column: "method", method: "eq", value: method },
            { column: "path", method: "eq", value: path },
          ],
        },
      },
      options: operator(),
    });
    if (!installed?.length) {
      await create(permissionApi, { type: "HTTP", method, path });
    }
  }
  const keys = await keyApi.find({ options: operator() });
  if (!keys) {
    throw new Error("Fixture attribute keys did not return a collection");
  }
  originalKeys = new Set(keys.map((key) => key.id));
});

afterAll(async () => {
  for (const remove of cleanup.splice(0)) {
    await remove();
  }
  for (const id of attributes) {
    await attributeApi.delete({ id, options: operator() });
  }
  for (const id of newKeys) {
    const references = await keyAttributesApi.find({
      params: {
        filters: {
          and: [{ column: "attributeKeyId", method: "eq", value: id }],
        },
      },
      options: operator(),
    });
    if (!references) {
      throw new Error("Fixture key references did not return a collection");
    }
    if (!references.length) {
      await keyApi.delete({ id, options: operator() });
    }
  }
});

it("reuses mixed-currency checkout invoices and resumes only USD after local RUB settlement", async () => {
  expect(
    getRequiredEnv("ALLOWED_BILLING_SERVICE_PROVIDERS").split(","),
  ).toContain("dummy");
  const seller = await actor("money-seller");
  const buyer = await actor("money-buyer");
  const store = await create(
    storeApi,
    {
      slug: `issue414-money-store-${suffix}`,
      title: { en: "Money test store" },
    },
    seller.options,
  );
  const rub = await create(currencyApi, {
    slug: `issue414-money-rub-${suffix}`,
    title: "RUB",
    symbol: "₽",
    minorUnitDigits: 2,
  });
  const usd = await create(currencyApi, {
    slug: `issue414-money-usd-${suffix}`,
    title: "USD",
    symbol: "$",
    minorUnitDigits: 2,
  });
  const main = await offer(seller, {
    storeId: store.id,
    product: {
      title: { en: "Money test wardrobe" },
      kind: "physical",
      formula: "unit_price * quantity",
    },
    prices: [{ currencyId: rub.id, amount: "5000" }],
    stockQuantity: 3,
  });
  const delivery = await offer(seller, {
    storeId: store.id,
    product: {
      title: { en: "Money test delivery" },
      kind: "service",
      formula: "unit_price",
    },
    prices: [{ currencyId: rub.id, amount: "1000" }],
    settings: { receiptMethod: "shipping" },
  });
  const assembly = await offer(seller, {
    storeId: store.id,
    product: {
      title: { en: "Money test assembly" },
      kind: "service",
      formula: "unit_price * serviced_qty",
    },
    prices: [{ currencyId: rub.id, amount: "2000" }],
  });
  const chair = await offer(seller, {
    storeId: store.id,
    product: {
      title: { en: "Money test chair" },
      kind: "physical",
      formula: "unit_price * quantity",
    },
    prices: [{ currencyId: rub.id, amount: "3000" }],
  });
  const digital = await offer(seller, {
    storeId: store.id,
    product: {
      title: { en: "Money test digital download" },
      kind: "digital",
      formula: "unit_price * quantity",
    },
    prices: [{ currencyId: usd.id, amount: "20" }],
  });
  await create(
    linksApi,
    {
      sourceOfferId: main.offer.id,
      targetOfferId: delivery.offer.id,
      variant: "delivery",
    },
    seller.options,
  );
  await create(
    linksApi,
    {
      sourceOfferId: main.offer.id,
      targetOfferId: assembly.offer.id,
      variant: "add-on",
    },
    seller.options,
  );
  const path = `/api/rbac/subjects/${buyer.id}/ecommerce-module/orders`;
  for (const [method, target] of [
    ["POST", path],
    ["GET", path],
    ["POST", `${path}/checkout`],
  ]) {
    await create(permissionApi, { type: "HTTP", method, path: target });
  }
  const orderIds: string[] = [];
  for (const [product, currencyId, services] of [
    [
      main,
      rub.id,
      [
        { offerId: delivery.offer.id, quantity: 1 },
        { offerId: assembly.offer.id, quantity: 1 },
      ],
    ],
    [chair, rub.id, []],
    [digital, usd.id, []],
  ] as const) {
    await subjectApi.ecommerceModuleOrderCreate({
      id: buyer.id,
      options: buyer.options,
      data: {
        productId: product.product.id,
        offerId: product.offer.id,
        quantity: 1,
        billingModuleCurrencyId: currencyId,
        destination: { address: "Saint Petersburg, money test" },
        services: [...services],
      },
    });
  }
  const orders = await subjectApi.ecommerceModuleOrderList({
    id: buyer.id,
    options: buyer.options,
  });
  expect(orders).toHaveLength(3);
  for (const order of orders) {
    orderIds.push(order.id);
    cleanup.unshift(() =>
      orderApi.delete({ id: order.id, options: operator() }),
    );
  }
  const checkoutInput = {
    email: buyer.email,
    provider: "dummy",
    ecommerceModule: { orders: orderIds.map((id) => ({ id })) },
  };
  const checkout = await subjectApi.ecommerceModuleOrderCheckout({
    id: buyer.id,
    options: buyer.options,
    data: checkoutInput,
  });
  const invoices = checkout.billingModule.invoices;
  expect(
    invoices.map((invoice) => Number(invoice.amount)).sort((a, b) => a - b),
  ).toEqual([20, 11000]);
  expect(invoices.every((invoice) => invoice.status === "open")).toBe(true);
  async function readAttempts() {
    const rows = await attemptsApi.find({
      params: {
        filters: {
          and: [{ column: "orderId", method: "inArray", value: orderIds }],
        },
      },
      options: operator(),
    });
    if (!rows) {
      throw new Error("Fixture attempts did not return a collection");
    }
    return rows;
  }
  const attempts = await readAttempts();
  const reservationState = (rows: typeof attempts) =>
    rows
      .map((row) => ({
        id: row.id,
        orderId: row.orderId,
        paymentIntentId: row.billingModulePaymentIntentId,
        offerId: row.offerId,
        quantity: row.reservationQuantity,
        status: row.reservationStatus,
        snapshot: row.purchaseSnapshot,
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
  const invoiceLinks = (rows: typeof invoices) =>
    rows
      .map((invoice) => ({ id: invoice.id, paymentUrl: invoice.paymentUrl }))
      .sort((left, right) => left.id.localeCompare(right.id));
  cleanup.unshift(async () => {
    const currentAttempts = await readAttempts();
    const intentIds = [
      ...new Set(
        currentAttempts.map((attempt) => attempt.billingModulePaymentIntentId),
      ),
    ];
    const linkedInvoices = intentIds.length
      ? await intentInvoicesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "paymentIntentId",
                  method: "inArray",
                  value: intentIds,
                },
              ],
            },
          },
          options: operator(),
        })
      : [];
    for (const attempt of currentAttempts) {
      await attemptsApi.delete({ id: attempt.id, options: operator() });
    }
    for (const id of intentIds) {
      await intentApi.delete({ id, options: operator() });
    }
    for (const id of new Set([
      ...invoices.map((invoice) => invoice.id),
      ...(linkedInvoices ?? []).map((link) => link.invoiceId),
    ])) {
      await invoiceApi.delete({ id, options: operator() });
    }
  });
  expect(attempts).toHaveLength(5);
  const intentIds = [
    ...new Set(attempts.map((attempt) => attempt.billingModulePaymentIntentId)),
  ];
  // Buyers read invoice shares and status through their own Subject order history.
  for (const headers of [
    undefined,
    buyer.options.headers,
    seller.options.headers,
  ]) {
    for (const path of [
      "/api/billing/payment-intents",
      "/api/billing/payment-intents/count",
      `/api/billing/payment-intents/${intentIds[0]}`,
      `/api/billing/invoices/${invoices[0].id}`,
      "/api/billing/payment-intents-to-invoices",
      "/api/ecommerce/orders",
      "/api/ecommerce/orders-to-products",
      "/api/ecommerce/orders-to-billing-module-payment-intents/count",
      `/api/ecommerce/orders/${orderIds[0]}/extended`,
    ]) {
      const response = await fetch(`${getApiUrl()}${path}`, { headers });
      expect([401, 403]).toContain(response.status);
    }
  }
  const otherSubject = await fetch(
    `${getApiUrl()}/api/rbac/subjects/${buyer.id}/ecommerce-module/orders?includePurchaseDetails=true`,
    { headers: seller.options.headers },
  );
  expect([400, 401, 403]).toContain(otherSubject.status);
  const operatorIntent = await intentApi.findById({
    id: intentIds[0],
    options: operator(),
  });
  expect(operatorIntent?.id).toBe(intentIds[0]);
  const repeatedCheckout = await subjectApi.ecommerceModuleOrderCheckout({
    id: buyer.id,
    options: buyer.options,
    data: checkoutInput,
  });
  expect(invoiceLinks(repeatedCheckout.billingModule.invoices)).toEqual(
    invoiceLinks(invoices),
  );
  expect(reservationState(await readAttempts())).toEqual(
    reservationState(attempts),
  );
  const snapshots = attempts.map((attempt) => attempt.purchaseSnapshot!);
  expect(snapshots.every((snapshot) => snapshot?.version === 1)).toBe(true);
  const byOrder = new Map<string, typeof snapshots>();
  for (const [index, attempt] of attempts.entries()) {
    byOrder.set(attempt.orderId, [
      ...(byOrder.get(attempt.orderId) ?? []),
      snapshots[index],
    ]);
  }
  expect(
    [...byOrder.values()]
      .map((rows) =>
        rows.reduce((sum, row) => sum + Number(row.charge.amount), 0),
      )
      .sort((a, b) => a - b),
  ).toEqual([20, 3000, 8000]);
  const rubInvoice = invoices.find(
    (invoice) => Number(invoice.amount) === 11000,
  )!;
  const usdInvoice = invoices.find((invoice) => Number(invoice.amount) === 20)!;
  expect(typeof usdInvoice.paymentUrl).toBe("string");
  expect(usdInvoice.paymentUrl).not.toBe("");
  const usdAttempts = attempts.filter(
    (attempt) => attempt.purchaseSnapshot?.currencyId === usd.id,
  );
  expect(usdAttempts).toHaveLength(1);
  const usdOrderIds = [
    ...new Set(usdAttempts.map((attempt) => attempt.orderId)),
  ];
  expect(usdOrderIds).toHaveLength(1);
  const usdInvoiceLinks = await intentInvoicesApi.find({
    params: {
      filters: {
        and: [{ column: "invoiceId", method: "eq", value: usdInvoice.id }],
      },
    },
    options: operator(),
  });
  expect(usdInvoiceLinks).toHaveLength(1);
  const usdIntentId = usdInvoiceLinks![0].paymentIntentId;
  expect(
    usdAttempts.every(
      (attempt) => attempt.billingModulePaymentIntentId === usdIntentId,
    ),
  ).toBe(true);
  expect([
    ...new Set(
      attempts
        .filter(
          (attempt) => attempt.billingModulePaymentIntentId === usdIntentId,
        )
        .map((attempt) => attempt.orderId),
    ),
  ]).toEqual(usdOrderIds);
  await subjectApi.ecommerceModuleCatalogMutation({
    id: seller.id,
    data: {
      entity: "stores-to-products",
      method: "PATCH",
      recordId: main.offer.id,
      data: { variant: "hidden" },
    },
    options: seller.options,
  });
  await expect(
    offerApi.quote({
      data: { offerId: main.offer.id, quantity: 1, currencyId: rub.id },
    }),
  ).rejects.toThrow();
  expect(
    (await invoiceApi.findById({ id: rubInvoice.id, options: operator() }))
      ?.status,
  ).toBe("open");
  const settled = await fetch(
    `${getApiUrl()}/api/rbac/subjects/ecommerce-module/orders/payment-intents/dummy/webhook`,
    {
      method: "POST",
      headers: { ...operator().headers, "Content-Type": "application/json" },
      body: JSON.stringify({ data: { id: rubInvoice.id } }),
    },
  );
  expect(settled.status).toBe(200);
  expect(
    (await invoiceApi.findById({ id: rubInvoice.id, options: operator() }))
      ?.status,
  ).toBe("paid");
  expect(
    (await invoiceApi.findById({ id: usdInvoice.id, options: operator() }))
      ?.status,
  ).toBe("open");
  const afterPartialSettlement = await readAttempts();
  const resumedUsd = await subjectApi.ecommerceModuleOrderCheckout({
    id: buyer.id,
    options: buyer.options,
    data: {
      ...checkoutInput,
      ecommerceModule: { orders: usdOrderIds.map((id) => ({ id })) },
    },
  });
  expect(invoiceLinks(resumedUsd.billingModule.invoices)).toEqual(
    invoiceLinks([usdInvoice]),
  );
  expect(
    resumedUsd.billingModule.invoices.map((invoice) => Number(invoice.amount)),
  ).toEqual([20]);
  expect(reservationState(await readAttempts())).toEqual(
    reservationState(afterPartialSettlement),
  );
  expect(
    (await invoiceApi.findById({ id: rubInvoice.id, options: operator() }))
      ?.status,
  ).toBe("paid");
  const purchases = await subjectApi.ecommerceModuleOrderList({
    id: buyer.id,
    options: buyer.options,
    params: {
      includePurchaseDetails: true,
      filters: { and: [{ column: "id", method: "inArray", value: orderIds }] },
    },
  });
  const details = purchases.map((purchase) => purchase.purchaseDetails!);
  expect(
    details
      .map((detail) =>
        detail.totals.reduce((sum, total) => sum + Number(total.total), 0),
      )
      .sort((a, b) => a - b),
  ).toEqual([20, 3000, 8000]);
  const rubShares = details
    .flatMap((detail) => detail.invoiceShares ?? [])
    .filter((share) => share.invoiceId === rubInvoice.id);
  expect(
    rubShares
      .map((share) => share.amount)
      .sort((a, b) => Number(a) - Number(b)),
  ).toEqual([3000, 8000]);
  expect(
    rubShares.every(
      (share) =>
        share.invoiceAmount === 11000 &&
        share.status === "paid" &&
        share.orderIds.length === 2,
    ),
  ).toBe(true);
  expect(
    details
      .flatMap((detail) => detail.invoiceShares ?? [])
      .find((share) => share.invoiceId === usdInvoice.id)?.status,
  ).toBe("open");
});

it("quotes the same contractor services for guests and buyers when the retail store changes", async () => {
  const a = await actor("seller-a");
  const b = await actor("seller-b");
  const buyer = await actor("buyer");
  const storeA = await create(
    storeApi,
    { slug: `issue414-store-a-${suffix}`, title: { en: "Store A" } },
    a.options,
  );
  const storeB = await create(
    storeApi,
    { slug: `issue414-store-b-${suffix}`, title: { en: "Store B" } },
    b.options,
  );
  const rub = await create(currencyApi, {
    slug: `issue414-rub-${suffix}`,
    title: "RUB",
    symbol: "₽",
    minorUnitDigits: 2,
  });
  const usd = await create(currencyApi, {
    slug: `issue414-usd-${suffix}`,
    title: "USD",
    symbol: "$",
    minorUnitDigits: 2,
  });
  const mainA = await offer(a, {
    storeId: storeA.id,
    product: {
      title: { en: "Wardrobe" },
      kind: "physical",
      formula: "unit_price * quantity",
    },
    configurationKey: "oak-two-doors",
    prices: [
      { currencyId: rub.id, amount: "5000" },
      { currencyId: usd.id, amount: "60" },
    ],
    stockQuantity: "3",
  });
  const deliveryA = await offer(a, {
    storeId: storeA.id,
    product: {
      title: { en: "Delivery" },
      kind: "service",
      formula: "unit_price",
    },
    prices: [{ currencyId: rub.id, amount: "1000" }],
    settings: { receiptMethod: "shipping" },
  });
  const assemblyA = await offer(a, {
    storeId: storeA.id,
    product: {
      title: { en: "Assembly" },
      kind: "service",
      formula: "unit_price * serviced_qty",
    },
    prices: [{ currencyId: rub.id, amount: "2000" }],
  });
  const mainB = await offer(b, {
    storeId: storeB.id,
    productId: mainA.product.id,
    configurationKey: "oak-two-doors",
    prices: [{ currencyId: rub.id, amount: "5400" }],
    stockQuantity: 2,
  });
  const deliveryB = await offer(b, {
    storeId: storeB.id,
    productId: deliveryA.product.id,
    prices: [{ currencyId: rub.id, amount: "500" }],
    settings: { receiptMethod: "pickup" },
  });
  const assemblyB = await offer(b, {
    storeId: storeB.id,
    productId: assemblyA.product.id,
    prices: [{ currencyId: rub.id, amount: "1500" }],
  });
  for (const [delivery, assembly] of [
    [deliveryA, assemblyA],
    [deliveryB, assemblyB],
  ] as const) {
    await create(
      linksApi,
      {
        sourceOfferId: mainA.offer.id,
        targetOfferId: delivery.offer.id,
        variant: "delivery",
      },
      a.options,
    );
    await create(
      linksApi,
      {
        sourceOfferId: mainA.offer.id,
        targetOfferId: assembly.offer.id,
        variant: "add-on",
      },
      a.options,
    );
  }
  const destination = {
    address: "Saint Petersburg, test destination",
    region: "spb",
  };
  const selectionA = {
    offerId: mainA.offer.id,
    quantity: 1,
    currencyId: rub.id,
    destination,
    services: [
      { offerId: deliveryA.offer.id, quantity: 1 },
      { offerId: assemblyA.offer.id, quantity: 1 },
    ],
  };
  const selectionB = {
    ...selectionA,
    offerId: mainB.offer.id,
  };
  const publicResponse = await fetch(
    `${getApiUrl()}/api/ecommerce/stores-to-products/${mainA.offer.id}/quote`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: 1,
        currencyId: rub.id,
        destination,
        services: selectionA.services,
      }),
    },
  );
  expect(publicResponse.status).toBe(200);
  expect(publicResponse.headers.get("Cache-Control")).toBe("private, no-store");
  const guest = await offerApi.quote({ data: selectionA });
  const buyerQuote = await offerApi.quote({
    data: selectionA,
    options: buyer.options,
  });
  expect(guest.amount).toBe("8000.00");
  expect(buyerQuote.amount).toBe(guest.amount);
  expect(guest.charges.map((charge) => charge.amount)).toEqual([
    "5000.00",
    "1000.00",
    "2000.00",
  ]);
  const otherStore = await offerApi.quote({ data: selectionB });
  expect(otherStore.amount).toBe("8400.00");
  expect(
    new Set(otherStore.serviceOptions.map((option) => option.offerId)),
  ).toEqual(new Set(guest.serviceOptions.map((option) => option.offerId)));
  const automatic = await offerApi.quote({
    data: { ...selectionB, destination: {}, services: [] },
  });
  expect(automatic.storeId).toBe(storeB.id);
  expect(automatic.destination).toEqual({});
  expect(automatic.selectedServices).toEqual([
    expect.objectContaining({ offerId: deliveryB.offer.id, quantity: 1 }),
  ]);
  expect(automatic.amount).toBe("5900.00");
  const pickupAtA = await offerApi.quote({
    data: {
      ...selectionA,
      destination: {},
      services: automatic.selectedServices,
    },
  });
  expect(pickupAtA.storeId).toBe(storeA.id);
  expect(pickupAtA.destination).toEqual({});
  expect(pickupAtA.amount).toBe("5500.00");
  const dollars = await offerApi.quote({
    data: { ...selectionA, currencyId: usd.id, services: [] },
  });
  expect(dollars.amount).toBeNull();
  expect(dollars.currencyIds).not.toContain(usd.id);
  const incompatible = await offerApi.quote({
    data: {
      ...selectionA,
      currencyId: usd.id,
      services: [{ offerId: deliveryA.offer.id, quantity: 1 }],
    },
  });
  expect(incompatible.amount).toBeNull();
  expect(incompatible.currencyIds).not.toContain(usd.id);
  await expect(
    subjectApi.ecommerceModuleCatalogAttributeSet({
      id: b.id,
      options: b.options,
      data: {
        owner: { type: "product", id: mainA.product.id },
        key: "price_formula",
        field: "string",
        string: "0",
      },
    }),
  ).rejects.toThrow();
  await expect(
    offerApi.update({
      id: mainA.offer.id,
      data: { variant: "hidden", operator: true } as any,
      options: buyer.options,
    }),
  ).rejects.toThrow();
  const buyerOrderPath = `/api/rbac/subjects/${buyer.id}/ecommerce-module/orders`;
  for (const method of ["POST", "GET"]) {
    await create(permissionApi, { type: "HTTP", method, path: buyerOrderPath });
  }
  await subjectApi.ecommerceModuleOrderCreate({
    id: buyer.id,
    options: buyer.options,
    data: {
      productId: mainA.product.id,
      offerId: mainA.offer.id,
      quantity: 1,
      billingModuleCurrencyId: rub.id,
      destination,
      services: selectionA.services,
    },
  });
  const orders = await subjectApi.ecommerceModuleOrderList({
    id: buyer.id,
    options: buyer.options,
  });
  expect(orders).toHaveLength(1);
  const order = orders[0];
  cleanup.unshift(() => orderApi.delete({ id: order.id, options: operator() }));
  const lines = await linesApi.find({
    params: {
      filters: { and: [{ column: "orderId", method: "eq", value: order.id }] },
    },
    options: operator(),
  });
  if (!lines) {
    throw new Error("Fixture lines did not return a collection");
  }
  const primary = lines.find((line) => !line.parentLineId)!;
  await create(permissionApi, {
    type: "HTTP",
    method: "POST",
    path: `${buyerOrderPath}/${order.id}/selection`,
  });
  const preview = await subjectApi.ecommerceModuleOrderSelection({
    id: buyer.id,
    orderId: order.id,
    options: buyer.options,
    data: { action: "preview", lineId: primary.id, selections: [selectionB] },
  });
  expect(preview.applied).toBe(false);
  expect(preview.quotes[0].amount).toBe("8400.00");
  expect(preview.comparisonQuotes?.[0].amount).toBe("8000.00");
  expect(
    (await linesApi.findById({ id: primary.id, options: operator() }))?.offerId,
  ).toBe(mainA.offer.id);
  const applied = await subjectApi.ecommerceModuleOrderSelection({
    id: buyer.id,
    orderId: order.id,
    options: buyer.options,
    data: {
      action: "apply",
      lineId: primary.id,
      selections: [selectionB],
      expectedVersions: preview.quotes.map((quote) => quote.version),
      expectedSelectionUpdatedAt: new Date(
        primary.selectionUpdatedAt,
      ).toISOString(),
    },
  });
  expect(applied.applied).toBe(true);
  const updated = await linesApi.find({
    params: {
      filters: { and: [{ column: "orderId", method: "eq", value: order.id }] },
    },
    options: operator(),
  });
  if (!updated) {
    throw new Error("Fixture updated did not return a collection");
  }
  expect(updated).toHaveLength(3);
  expect(new Set(updated.map((line) => line.offerId))).toEqual(
    new Set([mainB.offer.id, deliveryA.offer.id, assemblyA.offer.id]),
  );
  await subjectApi.ecommerceModuleCatalogAttributeSet({
    id: a.id,
    options: a.options,
    data: {
      owner: { type: "offer", id: mainA.offer.id },
      key: "stock_quantity",
      field: "number",
      number: "0",
    },
  });
  const soldOut = await offerApi.quote({ data: selectionA });
  expect(soldOut.availableQuantity).toBe(0);
  expect(soldOut.amount).toBeNull();
  expect(soldOut.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: "insufficient_stock", available: 0 }),
    ]),
  );
});

it("requires Subject mutations for an explicitly granted admin and retains held-stock checks", async () => {
  const admin = await actor("catalogue-raw-admin");
  const existing = await roleApi.find({
    params: {
      filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
    },
    options: operator(),
  });
  const role =
    existing?.[0] ??
    (await create(roleApi, { slug: "admin", title: "Administrator" }));
  await create(subjectsToRolesApi, { subjectId: admin.id, roleId: role.id });
  const store = await create(storeApi, {
    slug: `issue414-raw-admin-${suffix}`,
  });
  const currency = await create(currencyApi, {
    slug: `issue414-raw-admin-currency-${suffix}`,
    title: "Admin test currency",
    symbol: "A",
  });
  const created = await offer(admin, {
    storeId: store.id,
    product: {
      title: { en: "Admin catalogue fixture" },
      kind: "physical",
      formula: "unit_price * quantity",
    },
    prices: [{ currencyId: currency.id, amount: "10" }],
    stockQuantity: 3,
  });
  const links = await offerAttributesApi.find({
    params: {
      filters: {
        and: [
          {
            column: "storesToProductsId",
            method: "eq",
            value: created.offer.id,
          },
        ],
      },
    },
    options: operator(),
  });
  const values = await Promise.all(
    (links ?? []).map((link) =>
      attributeApi.findById({ id: link.attributeId, options: operator() }),
    ),
  );
  const stock = values.find(
    (attribute) => attribute?.adminTitle === "stock_quantity",
  );
  expect(stock).toBeDefined();
  const order = await create(orderApi, {});
  const intent = await create(intentApi, { amount: 1 });
  await create(attemptsApi, {
    orderId: order.id,
    billingModulePaymentIntentId: intent.id,
    offerId: created.offer.id,
    reservationQuantity: 2,
    reservationStatus: "held",
  });
  const permission = await create(permissionApi, {
    type: "HTTP",
    method: "PATCH",
    path: `/api/ecommerce/attributes/${stock!.id}`,
  });
  await create(rolesToPermissionsApi, {
    roleId: role.id,
    permissionId: permission.id,
  });
  await expect(
    attributeApi.update({
      id: stock!.id,
      data: { number: "1" },
      options: admin.options,
    }),
  ).rejects.toThrow("This operation requires the operator credential");
  expect(
    (await attributeApi.findById({ id: stock!.id, options: operator() }))
      ?.number,
  ).toBe("3");
  const mutate = (number: string) =>
    subjectApi.ecommerceModuleCatalogMutation({
      id: admin.id,
      options: admin.options,
      data: {
        entity: "attributes",
        method: "PATCH",
        recordId: stock!.id,
        data: { number },
      },
    });
  await expect(mutate("1")).rejects.toThrow("outstanding reservations");
  await mutate("2");
  expect(
    (await attributeApi.findById({ id: stock!.id, options: operator() }))
      ?.number,
  ).toBe("2");
});
