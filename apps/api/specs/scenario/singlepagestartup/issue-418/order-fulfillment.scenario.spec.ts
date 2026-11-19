import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createAppAssembly } from "@sps/shared-backend-api";
import { signJwt } from "@sps/backend-utils";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService as createSubject } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { createService as createWorker } from "@sps/agent/models/work-attempt/backend/app/api/src/lib/bootstrap";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import {
  orderWorkPath,
  type IOrderWorkView,
} from "@sps/rbac/models/subject/sdk/model";
import { Table as OrderWork } from "@sps/ecommerce/models/order-work/backend/repository/database";
import { Table as PrivateFile } from "@sps/file-storage/models/private-file/backend/repository/database";
import { Table as PublicFile } from "@sps/file-storage/models/file/backend/repository/database";
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as WalletOperation } from "@sps/rbac/relations/subjects-to-wallet-operations/backend/repository/database";
import { Table as WalletBalance } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";
import { getApiUrl, getRequiredEnv } from "../issue-154/test-utils/env";

const cleanup: Array<() => Promise<unknown>> = [];
const by = (column: string, value: string) => ({
  params: { filters: { and: [{ column, method: "eq" as const, value }] } },
});
const operator = () => ({
  "X-RBAC-SECRET-KEY": getRequiredEnv("RBAC_SECRET_KEY"),
});
const request = (path: string, init?: RequestInit) =>
  fetch(getApiUrl() + path, init);
const json = (headers: Record<string, string>, data: unknown) => ({
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

afterEach(async () => {
  for (const remove of cleanup.splice(0).reverse()) {
    await remove();
  }
});

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
  const provider = new KvProvider({ type: KV_PROVIDER }).client;
  if (provider.client && "disconnect" in provider.client) {
    provider.client.disconnect();
  }
});

async function fixture(kind: "individual-service" | "physical-order") {
  const assembly = createAppAssembly();
  const subjects = createSubject(assembly);
  const { ecommerce, crm, billing } = subjects.modules;
  const db = getDrizzle({});
  const suffix = randomUUID();
  const actor = async (label: string) => {
    const who = await subjects.create({
      data: { slug: `issue418-${label}-${suffix}` },
    });
    const email = `issue418-${label}-${suffix}@example.test`;
    const identity = await subjects.module.identity.create({ data: { email } });
    await subjects.module.subjectsToIdentities.create({
      data: { subjectId: who.id, identityId: identity.id },
    });
    cleanup.push(async () => {
      await subjects.delete({ id: who.id });
      await subjects.module.identity.delete({ id: identity.id });
    });
    const token = await signJwt(
      { subjectId: who.id, type: "access", lifetimeInSeconds: 900 },
      getRequiredEnv("RBAC_JWT_SECRET"),
    );
    return { id: who.id, email, headers: { Authorization: `Bearer ${token}` } };
  };

  const [buyer, stranger, manager] = [
    await actor("buyer"),
    await actor("stranger"),
    await actor("manager"),
  ];
  const store = await ecommerce.store.create({
    data: { slug: `issue418-${suffix}`, title: { en: "Fixture store" } },
  });
  cleanup.push(async () => {
    await getPostgresClient().begin(async (sql) => {
      await sql`delete from sps_cm_tasks_to_events where task_id in (select id from sps_cm_task where store_id = ${store.id})`;
      await sql`delete from sps_cm_tasks_to_publications where task_id in (select id from sps_cm_task where store_id = ${store.id})`;
      await sql`delete from sps_cm_task_event where task_id in (select id from sps_cm_task where store_id = ${store.id})`;
      await sql`delete from sps_cm_task where store_id = ${store.id}`;
      await sql`delete from sps_cm_funnels_to_publications where funnel_id in (select id from sps_cm_funnel where store_id = ${store.id})`;
      await sql`delete from sps_cm_funnel_publication where funnel_id in (select id from sps_cm_funnel where store_id = ${store.id})`;
      await sql`delete from sps_cm_funnels_to_stores where store_id = ${store.id}`;
      await sql`delete from sps_cm_funnel where store_id = ${store.id}`;
    });
    await ecommerce.store.delete({ id: store.id });
  });
  await subjects.module.subjectsToEcommerceModuleStores.create({
    data: {
      subjectId: manager.id,
      ecommerceModuleStoreId: store.id,
      variant: "owner",
    },
  });
  const currency = await billing.currency.create({
    data: {
      title: "Fixture RUB",
      slug: `issue418-${suffix}`,
      symbol: "₽",
      minorUnitDigits: 2,
    },
  });
  cleanup.push(() => billing.currency.delete({ id: currency.id }));
  const { product, offer } = await subjects.ecommerceCatalog.createOffer({
    subjectId: manager.id,
    data: {
      storeId: store.id,
      product: {
        title: { en: "Fixture SKU" },
        kind: kind === "physical-order" ? "physical" : "service",
        formula: "unit_price * quantity",
      },
      prices: [{ currencyId: currency.id, amount: "25" }],
      settings: {
        requiresResultAcceptance: kind === "individual-service",
        standalone: kind === "individual-service",
      },
    },
  });
  cleanup.push(() => ecommerce.product.delete({ id: product.id }));
  cleanup.push(() => ecommerce.storesToProducts.delete({ id: offer.id }));
  const selection = await subjects.ecommerceModuleOrderCreate({
    subjectId: buyer.id,
    storeId: store.id,
    productId: product.id,
    offerId: offer.id,
    billingModuleCurrencyId: currency.id,
    quantity: 1,
  });
  const { orderId } = selection;
  cleanup.push(async () => {
    const saved = await ecommerce.order.work.findByOrder(orderId);
    const fileIds = [
      ...(saved?.versions.flatMap((version) => [
        version.originalFileId,
        version.previewFileId,
      ]) ?? []),
      ...(saved?.receiptFileId ? [saved.receiptFileId] : []),
    ];
    const receipts = await ecommerce.ordersToFileStorageModuleFiles.find(
      by("orderId", orderId),
    );
    fileIds.push(
      ...receipts.flatMap((link) =>
        link.privateReceiptFileId ? [link.privateReceiptFileId] : [],
      ),
    );
    const relation = ecommerce.order.ordersToBillingModulePaymentIntents;
    const intents = await relation.find(by("orderId", orderId));
    const invoiceIds = new Set<string>();
    for (const id of new Set(
      intents.map((link) => link.billingModulePaymentIntentId),
    )) {
      const invoiceLinks = await billing.paymentIntentsToInvoices.find(
        by("paymentIntentId", id),
      );
      for (const link of invoiceLinks) {
        invoiceIds.add(link.invoiceId);
      }
    }
    await ecommerce.order.delete({ id: orderId });
    for (const id of new Set(
      intents.map((link) => link.billingModulePaymentIntentId),
    )) {
      await billing.paymentIntent.delete({ id });
    }
    for (const id of invoiceIds) {
      await billing.invoice.delete({ id });
    }
    await db.delete(OrderWork).where(eq(OrderWork.orderId, orderId));
    for (const id of new Set(fileIds)) {
      await db.delete(PrivateFile).where(eq(PrivateFile.id, id));
    }
  });
  const checkoutPermission =
    await subjects.module.role.module.permission.findOrCreate({
      data: {
        type: "HTTP",
        method: "POST",
        path: `/api/rbac/subjects/${buyer.id}/ecommerce-module/orders/checkout`,
      },
    });
  cleanup.push(() =>
    subjects.module.role.module.permission.delete({
      id: checkoutPermission.entity.id,
    }),
  );
  const initialStageId = "initial";
  const draft = await crm.funnel.saveDraft({
    storeId: store.id,
    name: `Fixture ${kind}`,
    kind,
    definition: {
      initialStageId,
      stages: [
        {
          id: initialStageId,
          name: "Open",
          actions: [
            kind === "individual-service"
              ? {
                  id: "accept",
                  name: "Accept",
                  actors: ["system"],
                  evidence: ["result-accepted"],
                  nextStageId: "payment",
                }
              : {
                  id: "payment",
                  name: "Paid",
                  actors: ["system"],
                  evidence: ["payment"],
                  nextStageId: "delivery",
                },
          ],
        },
        {
          id: "payment",
          name: "Awaiting payment",
          actions: [
            {
              id: "paid",
              name: "Paid",
              actors: ["system"],
              evidence: ["payment"],
              outcome: "completed",
            },
          ],
        },
        {
          id: "delivery",
          name: "Fulfillment",
          actions: [
            {
              id: "delivered",
              name: "Handed over",
              actors: ["system"],
              evidence: ["delivery"],
              outcome: "completed",
            },
          ],
        },
      ],
    },
  });
  await crm.funnel.publish({
    storeId: store.id,
    funnelId: draft.id,
    expectedRevision: draft.revision,
    actorId: manager.id,
    operationKey: randomUUID(),
  });
  const task = await crm.task.open({
    storeId: store.id,
    funnelId: draft.id,
    customerId: buyer.id,
    actorId: buyer.id,
    operationKey: randomUUID(),
    orderId,
    offerId: offer.id,
    productId: product.id,
  });
  const scope = { storeId: store.id, taskId: task.id };
  if (kind === "physical-order") {
    await crm.task.assign({
      ...scope,
      assigneeId: manager.id,
      assigneeKind: "human",
      actorId: manager.id,
      expectedRevision: task.revision,
      operationKey: randomUUID(),
    });
  }
  const work = ecommerce.order.work;
  await work.register({ ...scope, orderId, customerId: buyer.id, kind });
  const route = orderWorkPath(buyer.id, orderId);
  const getWork = async () => {
    const response = await request(route + "?" + new URLSearchParams(scope), {
      headers: buyer.headers,
    });
    expect(response.status).toBe(200);
    return ((await response.json()) as { data: IOrderWorkView }).data;
  };
  const checkout = (ids = [orderId]) =>
    subjectApi.ecommerceModuleOrderCheckout({
      id: buyer.id,
      options: { headers: buyer.headers },
      data: {
        email: buyer.email,
        provider: "dummy",
        ecommerceModule: { orders: ids.map((id) => ({ id })) },
      },
    });
  const webhook = (invoiceId: string) =>
    request(
      "/api/rbac/subjects/ecommerce-module/orders/payment-intents/dummy/webhook",
      json(operator(), { data: { id: invoiceId } }),
    );
  const check = () =>
    request(`/api/ecommerce/orders/${orderId}/check`, {
      method: "POST",
      headers: operator(),
    });
  const accept = (resultVersionId: string) =>
    request(
      route,
      json(buyer.headers, {
        ...scope,
        operation: "accept",
        resultVersionId,
        operationKey: randomUUID(),
      }),
    );
  return {
    assembly,
    subjects,
    crm,
    ecommerce,
    billing,
    product,
    offer,
    db,
    buyer,
    stranger,
    manager,
    scope,
    work,
    orderId,
    task,
    currency,
    route,
    getWork,
    checkout,
    webhook,
    check,
    accept,
  };
}

it("keeps a converted result price in cart totals and the invoice after an offer price change", async () => {
  const f = await fixture("individual-service");
  const assignee = await f.subjects.create({ data: { variant: "agent" } });
  cleanup.push(() => f.subjects.delete({ id: assignee.id }));
  const executor = await f.subjects.create({ data: { variant: "agent" } });
  cleanup.push(() => f.subjects.delete({ id: executor.id }));
  const expenses = await f.billing.currency.create({
    data: {
      slug: `work-cost-${randomUUID()}`,
      title: "Work credits",
      symbol: "SPS",
      minorUnitDigits: 8,
    },
  });
  cleanup.push(async () => {
    await f.db
      .delete(WalletOperation)
      .where(eq(WalletOperation.taskId, f.task.id));
    await f.db
      .delete(WalletBalance)
      .where(eq(WalletBalance.billingModuleCurrencyId, expenses.id));
    await f.billing.currency.delete({ id: expenses.id });
  });
  await f.subjects.module.subjectsToBillingModuleCurrencies.create({
    data: {
      subjectId: f.manager.id,
      billingModuleCurrencyId: expenses.id,
      amount: "100",
    },
  });
  const assigned = await f.crm.task.assign({
    ...f.scope,
    assigneeId: assignee.id,
    assigneeKind: "ai",
    actorId: f.manager.id,
    expectedRevision: f.task.revision,
    operationKey: randomUUID(),
  });
  const configure = async (resultPricing?: IFunnelStage["resultPricing"]) => {
    const task = await f.crm.task.get(f.scope);
    const current = await f.crm.funnel.get(f.scope.storeId, task.funnelId);
    const saved = await f.crm.funnel.saveDraft({
      storeId: f.scope.storeId,
      funnelId: current.id,
      expectedRevision: current.revision,
      kind: current.kind,
      name: current.name,
      bindings: current.bindings,
      definition: {
        ...current.definition,
        workFunding: {
          payer: "store-owner",
          currencyId: expenses.id,
          maxTaskAmount: "50",
          maxRunAmount: "10",
        },
        stages: current.definition.stages.map((stage) =>
          stage.id === task.stageId
            ? { ...stage, output: "image", resultPricing }
            : stage,
        ),
      },
    });
    const publication = await f.crm.funnel.publish({
      storeId: f.scope.storeId,
      funnelId: saved.id,
      actorId: f.manager.id,
      expectedRevision: saved.revision,
      operationKey: randomUUID(),
    });
    await f.crm.task.migrate({
      ...f.scope,
      actorId: f.manager.id,
      expectedRevision: task.revision,
      publicationId: publication.id,
      stageId: task.stageId,
      operationKey: randomUUID(),
      reason: "Publish the next pricing terms",
    });
    return publication;
  };
  const artifacts = (number: number, attemptId = randomUUID()) => ({
    ...f.scope,
    assigneeId: assignee.id,
    assignmentRevision: assigned.assignmentRevision,
    attemptId,
    original: {
      name: `cover-${number}.png`,
      mimeType: "image/png",
      bytes: Buffer.from(`result ${number}`),
    },
    preview: {
      name: `preview-${number}.jpg`,
      mimeType: "image/jpeg",
      bytes: Buffer.from(`preview ${number}`),
    },
  });

  await configure();
  const first = await f.subjects.orderWork.publishResultFromRun(artifacts(1));
  expect(first).toMatchObject({
    price: "25.00000000",
    priceBasis: { kind: "offer" },
  });

  const work = f.subjects.workLedger;
  const reserve = await work.reserve({
    ...f.scope,
    actorId: f.manager.id,
    senderId: f.manager.id,
    recipientId: assignee.id,
    operationKey: randomUUID(),
    purpose: "agent-work",
    currencyId: expenses.id,
    amount: "8",
    budget: "50",
  });
  await work.advance(
    {
      ...f.scope,
      actorId: f.manager.id,
      senderId: f.manager.id,
      recipientId: executor.id,
      operationKey: randomUUID(),
      purpose: "provider-advance",
      currencyId: expenses.id,
      amount: "2",
    },
    reserve.operationKey,
  );
  await work.settle({
    storeId: f.scope.storeId,
    reservationKey: reserve.operationKey,
    recipientId: assignee.id,
    providerSubjectId: executor.id,
    workAmount: "3.24",
    providerAmount: "2.2",
  });
  const conversion = {
    fromCurrencyId: expenses.id,
    toCurrencyId: f.currency.id,
    source: "Fixture rate card",
    observedAt: "2026-11-18T12:00:00.000Z",
    rate: "2.5",
  };
  await configure({
    kind: "confirmed-cost",
    multiplier: "1.3333",
    conversions: [],
  });
  const secondInput = artifacts(2);
  await expect(
    f.subjects.orderWork.publishResultFromRun(secondInput),
  ).rejects.toThrow("No exchange rate is configured");
  const publication = await configure({
    kind: "confirmed-cost",
    multiplier: "1.3333",
    conversions: [conversion],
  });
  const second = await f.subjects.orderWork.publishResultFromRun(secondInput);
  expect(second).toMatchObject({
    price: "10.80000000",
    currencyId: f.currency.id,
    priceBasis: {
      kind: "confirmed-cost",
      publicationId: publication.id,
      multiplier: "1.3333",
      costs: [
        {
          currencyId: expenses.id,
          amount: "3.24",
          reservationIds: [reserve.id],
          conversion,
        },
      ],
    },
  });
  expect(second.id).not.toBe(first.id);
  expect((await f.accept(second.id)).status).toBe(200);
  await f.subjects.ecommerceCatalog.setAttribute({
    subjectId: f.manager.id,
    data: {
      owner: { type: "offer", id: f.offer.id },
      key: "price",
      field: "number",
      type: "price",
      currencyId: f.currency.id,
      number: "90",
    },
  });
  const cart = await f.subjects.ecommerceModuleOrderCartDetails({
    subjectId: f.buyer.id,
    orderId: f.orderId,
  });
  expect(cart).toMatchObject({
    fixedResultPrice: true,
    billingModuleCurrencyId: f.currency.id,
    totals: [{ total: 10.8 }],
  });
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect(invoice.amount).toBe(10.8);
  const links =
    await f.ecommerce.order.ordersToBillingModulePaymentIntents.find(
      by("orderId", f.orderId),
    );
  expect(links).toMatchObject([
    {
      purchaseSnapshot: {
        amount: "10.8",
        orderAmount: "10.80000000",
        currencyId: f.currency.id,
        quoteVersion: `result:${second.id}`,
      },
    },
  ]);
  expect((await f.webhook(invoice.id)).status).toBe(200);
  expect((await f.check()).ok).toBe(true);
  await createWorker(createAppAssembly()).consumePayments();
  await createWorker(createAppAssembly()).consumePayments();
  const view = await f.getWork();
  expect(view).toMatchObject({
    state: "delivered",
    paidVersionId: second.id,
    result: { id: second.originalFileId },
  });
  const original = await request(view.result!.path, {
    headers: f.buyer.headers,
  });
  expect(await original.text()).toBe("result 2");
});

it("freezes the invoiced version, survives an interrupted worker, and protects GET and HEAD", async () => {
  const f = await fixture("individual-service");
  await expect(f.checkout()).rejects.toThrow(/accept/i);
  const publish = (version: number) =>
    f.work.publishResult({
      ...f.scope,
      orderId: f.orderId,
      customerId: f.buyer.id,
      actorId: f.manager.id,
      currencyId: f.currency.id,
      price: "25",
      operationKey: randomUUID(),
      original: {
        name: `cover-${version}.png`,
        mimeType: "image/png",
        bytes: Buffer.from(`original ${version}`),
      },
      preview: {
        name: `preview-${version}.jpg`,
        mimeType: "image/jpeg",
        bytes: Buffer.from(`preview ${version}`),
      },
    });
  const first = await publish(1);
  const second = await publish(2);
  expect(first.id).not.toBe(second.id);
  expect((await f.accept(first.id)).status).toBe(200);
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect(invoice.status).toBe("open");
  const payment = {
    ...f.scope,
    orderId: f.orderId,
    customerId: f.buyer.id,
    currencyId: f.currency.id,
    price: "25.00000000",
    resultVersionId: first.id,
  };
  const [legacyIntent] = await f.db
    .insert(PaymentIntent)
    .values({
      amount: 25,
      status: "succeeded",
      checkoutCurrencyId: f.currency.id,
      checkoutMetadata: {
        ecommerceModule: {
          orders: [{ id: f.orderId, orderWork: payment }, { id: randomUUID() }],
        },
      },
    })
    .returning();
  const legacyInvoice = await f.billing.invoice.create({
    data: { amount: 25, status: "paid", provider: "dummy" },
  });
  await f.billing.paymentIntentsToInvoices.create({
    data: { paymentIntentId: legacyIntent.id, invoiceId: legacyInvoice.id },
  });
  await f.ecommerce.order.ordersToBillingModulePaymentIntents.create({
    data: { orderId: f.orderId, billingModulePaymentIntentId: legacyIntent.id },
  });
  expect((await f.check()).status).toBe(409);
  expect((await f.work.findByOrder(f.orderId))?.paid).toBeNull();
  expect((await f.accept(second.id)).status).toBe(200);
  const repeatedWebhook = await Promise.all([
    f.webhook(invoice.id),
    f.webhook(invoice.id),
  ]);
  expect(repeatedWebhook.map(({ status }) => status)).toEqual([200, 200]);
  expect((await f.check()).ok).toBe(true);
  const before = await f.work.findByOrder(f.orderId);
  expect(before?.paid).toMatchObject({
    resultVersionId: first.id,
    invoiceId: invoice.id,
  });
  expect(before?.deliveredAt).toBeNull();
  await expect(
    f.subjects.ecommerceCatalog.mutate(
      {
        entity: "products",
        method: "DELETE",
        data: {},
        id: f.product.id,
        subjectId: f.manager.id,
      },
      () => f.ecommerce.product.delete({ id: f.product.id }),
    ),
  ).rejects.toThrow("archived");
  await f.subjects.ecommerceCatalog.mutate(
    {
      entity: "stores-to-products",
      method: "PATCH",
      data: { variant: "hidden" },
      id: f.offer.id,
      subjectId: f.manager.id,
    },
    () =>
      f.ecommerce.storesToProducts.update({
        id: f.offer.id,
        data: { variant: "hidden" },
      }),
  );
  // A new assembly reads the committed PostgreSQL outbox after the first process stopped.
  const worker = createWorker(createAppAssembly());
  await worker.consumePayments();
  await createWorker(createAppAssembly()).consumePayments();
  const view = await f.getWork();
  expect(view).toMatchObject({
    paidVersionId: first.id,
    result: { id: first.originalFileId },
    state: "delivered",
  });
  expect(view.receipt).toBeTruthy();
  for (const artifact of [view.result!, view.receipt!]) {
    const read = await request(artifact.path, { headers: f.buyer.headers });
    expect(read.status).toBe(200);
    expect(read.headers.get("Cache-Control")).toBe("private, no-store");
    expect(
      (
        await request(artifact.path, {
          method: "HEAD",
          headers: f.buyer.headers,
        })
      ).status,
    ).toBe(200);
    for (const method of ["GET", "HEAD"]) {
      expect((await request(artifact.path, { method })).ok).toBe(false);
      expect(
        (await request(artifact.path, { method, headers: f.stranger.headers }))
          .ok,
      ).toBe(false);
      const strangerPath = artifact.path.replace(f.buyer.id, f.stranger.id);
      expect(
        (await request(strangerPath, { method, headers: f.stranger.headers }))
          .ok,
      ).toBe(false);
      expect(
        (
          await request(`/api/file-storage/private-files/${artifact.id}`, {
            method,
            headers: operator(),
          })
        ).ok,
      ).toBe(false);
      expect((await request(`/public/${artifact.id}`, { method })).ok).toBe(
        false,
      );
    }
  }
  const original = await request(view.result!.path, {
    headers: f.buyer.headers,
  });
  expect(await original.text()).toBe("original 1");
  expect(
    (
      await request(
        view.result!.path.replace(first.originalFileId, second.originalFileId),
        { headers: f.buyer.headers },
      )
    ).ok,
  ).toBe(false);
});

it("records the physical status in order and CRM and deduplicates handing it over", async () => {
  const f = await fixture("physical-order");
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect((await f.webhook(invoice.id)).status).toBe(200);
  expect((await f.check()).ok).toBe(true);
  await createWorker(createAppAssembly()).consumePayments();
  const managerRoute = orderWorkPath(f.manager.id, f.orderId) + "/fulfillment";
  const prepare = {
    ...f.scope,
    stage: "preparing",
    operationKey: randomUUID(),
  };
  const denied = await request(
    f.route + "/fulfillment",
    json(f.buyer.headers, prepare),
  );
  expect(denied.ok).toBe(false);
  expect(
    (await request(managerRoute, json(f.manager.headers, prepare))).status,
  ).toBe(200);
  expect((await f.ecommerce.order.findById({ id: f.orderId }))?.status).toBe(
    "packaging",
  );
  const ship = {
    ...f.scope,
    stage: "in-transit",
    trackingNumber: "TEST-418",
    operationKey: randomUUID(),
  };
  expect(
    (await request(managerRoute, json(f.manager.headers, ship))).status,
  ).toBe(200);
  expect((await f.getWork()).trackingNumber).toBe("TEST-418");
  const handoff = {
    ...f.scope,
    stage: "delivered",
    carrierEvidenceId: "TEST-HANDOFF-418",
    operationKey: randomUUID(),
  };
  const delivered = await request(
    managerRoute,
    json(f.manager.headers, handoff),
  );
  const duplicate = await request(
    managerRoute,
    json(f.manager.headers, handoff),
  );
  expect([delivered.status, duplicate.status]).toEqual([200, 200]);
  expect(await delivered.json()).toEqual(await duplicate.json());
  expect((await f.getWork()).state).toBe("delivered");
  expect((await f.ecommerce.order.findById({ id: f.orderId }))?.status).toBe(
    "delivered",
  );
  expect((await f.work.findByOrder(f.orderId))?.fulfillment).toHaveLength(3);
});

it("withdraws an existing public receipt and publishes the verified copy only for its buyer", async () => {
  const { mkdir, readFile, unlink, writeFile } =
    await import("node:fs/promises");
  const f = await fixture("physical-order");
  const order = await f.ecommerce.order.create({
    data: { type: "history", status: "paid" },
  });
  const { file, privateFile } = f.subjects.modules.fileStorage;
  await f.subjects.module.subjectsToEcommerceModuleOrders.create({
    data: { subjectId: f.buyer.id, ecommerceModuleOrderId: order.id },
  });
  const folder = "file-storage/static";
  const name = `issue418-receipt-${randomUUID()}.png`;
  const pathname = `apps/api/public/${folder}/${name}`;
  const publicPath = `/public/${folder}/${name}`;
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  await mkdir(`apps/api/public/${folder}`, { recursive: true });
  await writeFile(pathname, bytes);
  const source = await file.create({
    data: {
      file: `/${folder}/${name}`,
      adminTitle: "Public receipt migration fixture",
      mimeType: "image/png",
      extension: "png",
      size: bytes.length,
    },
  });
  const relation = await f.ecommerce.ordersToFileStorageModuleFiles.create({
    data: {
      orderId: order.id,
      fileStorageModuleFileId: source.id,
      variant: "receipt-default",
    },
  });
  cleanup.push(async () => {
    const saved = await f.ecommerce.ordersToFileStorageModuleFiles.findById({
      id: relation.id,
    });
    await f.ecommerce.order.delete({ id: order.id });
    await f.db.delete(PublicFile).where(eq(PublicFile.id, source.id));
    if (saved?.privateReceiptFileId) {
      await privateFile.delete({ id: saved.privateReceiptFileId });
    }
    await unlink(pathname).catch(() => undefined);
  });
  for (const method of ["GET", "HEAD"]) {
    expect((await request(publicPath, { method })).status).toBe(404);
    expect(
      (
        await request(`/api/file-storage/files/${source.id}/content`, {
          method,
          headers: operator(),
        })
      ).status,
    ).toBe(404);
  }
  const migration = f.subjects.orderWork.legacyReceipts;
  const dryRun = await migration.migrate(source.id, false);
  expect(dryRun).toMatchObject({ status: "ready", size: bytes.length });
  await expect(readFile(pathname)).resolves.toEqual(bytes);
  const published = await migration.migrate(source.id, true);
  expect(published).toMatchObject({
    status: "migrated",
    digest: dryRun.digest,
    size: bytes.length,
  });
  await expect(readFile(pathname)).rejects.toMatchObject({ code: "ENOENT" });
  await expect(migration.migrate(source.id, true)).resolves.toEqual(published);
  const [receipt] = await f.subjects.orderWork.publishedReceipts(
    f.buyer.id,
    order.id,
  );
  const protectedResult = await request(receipt.path, {
    headers: f.buyer.headers,
  });
  expect(protectedResult.status).toBe(200);
  expect(Buffer.from(await protectedResult.arrayBuffer())).toEqual(bytes);
  const denied = await request(
    receipt.path.replace(f.buyer.id, f.stranger.id),
    { headers: f.stranger.headers },
  );
  expect(denied.ok).toBe(false);
  expect((await request(publicPath)).status).toBe(404);
});
