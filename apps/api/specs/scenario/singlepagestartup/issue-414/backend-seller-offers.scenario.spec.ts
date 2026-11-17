import { randomUUID } from "node:crypto";
import { sign } from "hono/jwt";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as identityApi } from "@sps/rbac/models/identity/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
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
  const record = await api.create({ data, options });
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

it("groups two RUB orders, preserves their shares, and leaves the USD invoice open after local RUB settlement", async () => {
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
  const checkout = await subjectApi.ecommerceModuleOrderCheckout({
    id: buyer.id,
    options: buyer.options,
    data: {
      email: buyer.email,
      provider: "dummy",
      ecommerceModule: { orders: orderIds.map((id) => ({ id })) },
    },
  });
  const invoices = checkout.billingModule.invoices;
  expect(
    invoices.map((invoice) => Number(invoice.amount)).sort((a, b) => a - b),
  ).toEqual([20, 11000]);
  expect(invoices.every((invoice) => invoice.status === "open")).toBe(true);
  const attempts = await attemptsApi.find({
    params: {
      filters: {
        and: [{ column: "orderId", method: "inArray", value: orderIds }],
      },
    },
    options: operator(),
  });
  if (!attempts) {
    throw new Error("Fixture attempts did not return a collection");
  }
  cleanup.unshift(async () => {
    for (const attempt of attempts) {
      await attemptsApi.delete({ id: attempt.id, options: operator() });
    }
    for (const id of new Set(
      attempts.map((attempt) => attempt.billingModulePaymentIntentId),
    )) {
      await intentApi.delete({ id, options: operator() });
    }
    for (const invoice of invoices) {
      await invoiceApi.delete({ id: invoice.id, options: operator() });
    }
  });
  expect(attempts).toHaveLength(5);
  for (const target of [
    "/api/ecommerce/orders",
    "/api/ecommerce/orders-to-products",
    "/api/ecommerce/orders-to-billing-module-payment-intents",
    "/api/ecommerce/orders-to-billing-module-payment-intents/count",
    `/api/ecommerce/orders-to-billing-module-payment-intents/${attempts[0].id}`,
  ]) {
    expect((await fetch(`${getApiUrl()}${target}`)).status).toBe(401);
    expect(
      (
        await fetch(`${getApiUrl()}${target}`, {
          headers: buyer.options.headers,
        })
      ).status,
    ).toBe(403);
  }
  expect(
    (
      await fetch(
        `${getApiUrl()}/api/ecommerce/orders-to-billing-module-payment-intents/bulk`,
        {
          method: "PATCH",
          headers: {
            ...buyer.options.headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: [], operator: true }),
        },
      )
    ).status,
  ).toBe(403);
  const ownedOrder = await fetch(
    `${getApiUrl()}/api/ecommerce/orders/${orderIds[0]}/extended`,
    { headers: buyer.options.headers },
  );
  expect(ownedOrder.status).toBe(200);
  expect(ownedOrder.headers.get("Cache-Control")).toBe("private, no-store");
  const ownedBody = (await ownedOrder.json()) as { data: { id: string } };
  expect(ownedBody.data.id).toBe(orderIds[0]);
  expect(
    (await fetch(`${getApiUrl()}/api/ecommerce/orders/${orderIds[0]}/extended`))
      .status,
  ).toBe(401);
  expect(
    (
      await fetch(
        `${getApiUrl()}/api/ecommerce/orders/${orderIds[0]}/extended`,
        { headers: seller.options.headers },
      )
    ).status,
  ).toBe(403);
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
  await offerApi.update({
    id: main.offer.id,
    data: { variant: "hidden" },
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
    `${getApiUrl()}/api/billing/payment-intents/dummy/webhook`,
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

it("creates offers through seller SDKs, quotes for guests/buyers and atomically switches 8,000 ₽ to 7,400 ₽", async () => {
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
    settings: { receiptMethod: "shipping" },
  });
  const assemblyB = await offer(b, {
    storeId: storeB.id,
    productId: assemblyA.product.id,
    prices: [{ currencyId: rub.id, amount: "1500" }],
  });
  for (const [seller, main, delivery, assembly] of [
    [a, mainA, deliveryA, assemblyA],
    [b, mainB, deliveryB, assemblyB],
  ] as const) {
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
    services: [
      { offerId: deliveryB.offer.id, quantity: 1 },
      { offerId: assemblyB.offer.id, quantity: 1 },
    ],
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
  expect((await offerApi.quote({ data: selectionB })).amount).toBe("7400.00");
  const dollars = await offerApi.quote({
    data: { ...selectionA, currencyId: usd.id, services: [] },
  });
  expect(dollars.amount).toBe("60.00");
  expect(dollars.currencyIds).toContain(usd.id);
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
  expect(preview.quotes[0].amount).toBe("7400.00");
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
    new Set([mainB.offer.id, deliveryB.offer.id, assemblyB.offer.id]),
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
