import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import {
  createAppAssembly,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
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
  protectedFileContentPath,
  type IOrderWorkView,
} from "@sps/rbac/models/subject/sdk/model";
import { Table as SocialMessage } from "@sps/social/models/message/backend/repository/database";
import { Table as PublicFile } from "@sps/file-storage/models/file/backend/repository/database";
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as WalletOperation } from "@sps/billing/models/transaction/backend/repository/database";
import { Table as WalletBalance } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { Table as BroadcastMessage } from "@sps/broadcast/models/message/backend/repository/database";
import { Table as BroadcastDelivery } from "@sps/broadcast/relations/channels-to-messages/backend/repository/database";
import type {
  IFunnelStage,
  ISaveFunnel,
} from "@sps/crm/models/funnel/sdk/model";
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

async function fixture(
  kind: "individual-service" | "physical-order",
  quantity = 1,
  fileDelivery?:
    | "direct"
    | "after-inspection"
    | "agent-followup"
    | "agent-terminal"
    | "agent-legacy",
) {
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
      const funnels =
        await sql`select id from sps_cm_funnel where store_id=${store.id}`;
      const funnelIds = funnels.map((row) => row.id);
      const tasks =
        await sql`select task_id from sps_cm_funnels_to_tasks where funnel_id=any(${funnelIds}::uuid[])`;
      const taskIds = tasks.map((row) => row.task_id);
      const stages =
        await sql`delete from sps_cm_funnels_to_stages where funnel_id=any(${funnelIds}::uuid[]) returning stage_id`;
      await sql`delete from sps_cm_tasks_to_stages where task_id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_funnels_to_tasks where funnel_id=any(${funnelIds}::uuid[])`;
      await sql`delete from sps_cm_tasks_to_offers where task_id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_tasks_to_orders where task_id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_task where id=any(${taskIds}::uuid[])`;
      await sql`delete from sps_cm_stage where id=any(${stages.map((row) => row.stage_id)}::uuid[])`;
      await sql`delete from sps_cm_funnels_to_offers where funnel_id=any(${funnelIds}::uuid[])`;
      await sql`delete from sps_cm_funnel where id=any(${funnelIds}::uuid[])`;
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
    quantity,
  });
  const { orderId } = selection;
  cleanup.push(async () => {
    const saved = await ecommerce.order.work.findByOrder(orderId);
    const fileIds = [
      ...(saved?.files.flatMap((version) => [
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
    for (const id of new Set(fileIds)) {
      await subjects.modules.fileStorage.file.privateContent.delete({ id });
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
  const deliveryStages: ISaveFunnel["definition"]["stages"] =
    kind === "physical-order"
      ? [
          {
            id: "delivery",
            name: "Awaiting assembly",
            actions: [
              {
                id: "prepare",
                name: "Begin assembly",
                actors: ["system"],
                evidence: ["delivery"],
                deliveryStage: "preparing",
                nextStageId: "shipping",
              },
            ],
          },
          {
            id: "shipping",
            name: "Assembling",
            actions: [
              {
                id: "ship",
                name: "Ship",
                actors: ["system"],
                evidence: ["delivery"],
                deliveryStage: "in-transit",
                nextStageId: "carrier",
              },
            ],
          },
          {
            id: "carrier",
            name: "With carrier",
            actions: [
              {
                id: "deliver",
                name: "Hand over",
                actors: ["system"],
                evidence: ["delivery"],
                deliveryStage: "delivered",
                outcome: "completed",
              },
            ],
          },
        ]
      : [];
  const createAgent = async () => {
    const agent = await subjects.create({
      data: { variant: "agent", slug: `issue418-${randomUUID()}` },
    });
    const profile = await subjects.modules.social.profile.create({
      data: {
        variant: "artificial-intelligence",
        title: { en: "Order support" },
      },
    });
    await subjects.module.subjectsToSocialModuleProfiles.create({
      data: {
        subjectId: agent.id,
        socialModuleProfileId: profile.id,
        variant: "default",
      },
    });
    await subjects.module.subjectsToEcommerceModuleStores.create({
      data: {
        subjectId: agent.id,
        ecommerceModuleStoreId: store.id,
        variant: "crm-agent",
      },
    });
    cleanup.push(async () => {
      await subjects.modules.social.profile.delete({ id: profile.id });
      await subjects.delete({ id: agent.id });
    });
    return agent.id;
  };
  const supportAgent = fileDelivery?.startsWith("agent-")
    ? await createAgent()
    : undefined;
  const nextAgent =
    fileDelivery === "agent-followup" || fileDelivery === "agent-legacy"
      ? await createAgent()
      : undefined;
  const [token] = supportAgent
    ? await billing.currency.find(by("slug", "token"))
    : [];
  const agentFunding = {
    payer: "customer" as const,
    multiplier: "0",
    currencyId: token?.id ?? currency.id,
    maxStageAmount: "0",
    maxRunAmount: "0",
  };
  const draft = await crm.funnel.save({
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
          ...(fileDelivery && { behavior: "ecommerce-module-order-payment" }),
          ...(supportAgent && {
            defaultAssigneeSubjectId: supportAgent,
            workFunding: agentFunding,
          }),
          actions: [
            {
              id: "paid",
              name: "Paid",
              actors: ["system"],
              evidence: ["payment"],
              ...(fileDelivery && fileDelivery !== "agent-terminal"
                ? {
                    nextStageId:
                      fileDelivery === "after-inspection"
                        ? "inspection"
                        : fileDelivery === "agent-followup"
                          ? "followup"
                          : "file-delivery",
                  }
                : { outcome: "completed" }),
            },
          ],
        },
        ...(fileDelivery === "after-inspection"
          ? [
              {
                id: "inspection",
                name: "Inspect paid order",
                actions: [
                  {
                    id: "verified",
                    name: "Verified",
                    actors: ["manager" as const],
                    evidence: ["manual" as const],
                    nextStageId: "file-delivery",
                  },
                ],
              },
            ]
          : []),
        ...(fileDelivery && (!supportAgent || fileDelivery === "agent-legacy")
          ? [
              {
                id: "file-delivery",
                name: "Release purchased file",
                behavior: "order-file-delivery" as const,
                ...(supportAgent && {
                  defaultAssigneeSubjectId: supportAgent,
                  workFunding: agentFunding,
                }),
                actions: [
                  {
                    id: "issue-file",
                    name: "Deliver file",
                    actors: ["system" as const],
                    evidence: ["delivery" as const],
                    deliveryStage: "delivered" as const,
                    ...(nextAgent
                      ? { nextStageId: "followup" }
                      : { outcome: "completed" as const }),
                  },
                ],
              },
            ]
          : []),
        ...(nextAgent
          ? [
              {
                id: "followup",
                name: "Send the original",
                waiting: {
                  expectedEvent: "message" as const,
                  deadlineSeconds: 600,
                  reminderSeconds: [60],
                  completionEvidence: ["manual" as const],
                },
                output: "chat" as const,
                instruction:
                  "Send the accepted original if the order was paid.",
                defaultAssigneeSubjectId: nextAgent,
                workFunding: agentFunding,
                actions: [
                  {
                    id: "close",
                    name: "Complete",
                    actors: ["manager" as const],
                    evidence: ["manual" as const, "message" as const],
                    outcome: "completed" as const,
                  },
                ],
              },
            ]
          : []),
        ...deliveryStages,
      ],
    },
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
  cleanup.push(async () => {
    const social = subjects.modules.social;
    const channels = await social.chatsToCrmModuleTasks.channels({
      taskId: task.id,
    });
    for (const { chatId, threadId } of channels) {
      const placements = await social.threadsToMessages.find(
        by("threadId", threadId),
      );
      for (const { messageId } of placements) {
        await db.delete(SocialMessage).where(eq(SocialMessage.id, messageId));
      }
      await social.thread.delete({ id: threadId });
      await social.chat.delete({ id: chatId });
    }
    for (const id of [buyer.id, manager.id]) {
      const profiles =
        await subjects.module.subjectsToSocialModuleProfiles.find(
          by("subjectId", id),
        );
      for (const { socialModuleProfileId } of profiles) {
        await social.profile.delete({ id: socialModuleProfileId });
      }
    }
  });
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
  const accept = async (fileId: string) => {
    const command = json(buyer.headers, {
      ...scope,
      operation: "accept",
      fileId,
      operationKey: randomUUID(),
    });
    const response = await request(route, command);
    if (response.status === 503) {
      // The shared rate limiter may briefly refuse a request when its KV store is busy.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      return request(route, command);
    }
    return response;
  };
  return {
    assembly,
    supportAgent,
    nextAgent,
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
    lineId: selection.lineId,
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

it("replaces an accepted result after correcting a legacy single-unit cart", async () => {
  const f = await fixture("individual-service", 2);
  const channel = await f.subjects.customerWork.ensureWorkspaceChannel(
    f.buyer.id,
    f.task,
  );
  const threadOrderStep = async () =>
    (await f.subjects.customerWork.viewForThread(f.buyer.id, channel.threadId))
      ?.workflow?.orderStep;
  expect(await threadOrderStep()).toBe("review");
  const publish = async (quantity: number) => {
    const quote = await f.ecommerce.storesToProducts.quote({
      offerId: f.offer.id,
      quantity,
      currencyId: f.currency.id,
      lineId: f.lineId,
    });
    return f.work.publishResult({
      ...f.scope,
      orderId: f.orderId,
      customerId: f.buyer.id,
      actorId: f.manager.id,
      currencyId: f.currency.id,
      price: quote.amount!,
      purchaseQuote: {
        version: quote.version,
        destination: {},
        charges: quote.charges,
        lines: [
          {
            id: f.lineId,
            offerId: f.offer.id,
            quantity,
            parentLineId: null,
          },
        ],
      },
      operationKey: randomUUID(),
      original: {
        name: "cover.png",
        mimeType: "image/png",
        bytes: Buffer.from(`original ${quantity}`),
      },
      preview: {
        name: "preview.jpg",
        mimeType: "image/jpeg",
        bytes: Buffer.from(`preview ${quantity}`),
      },
    });
  };
  const old = await publish(2);
  await f.ecommerce.product.update({
    id: f.product.id,
    data: { singleUnitPerOrder: true },
  });
  expect((await f.accept(old.id)).status).toBe(400);
  expect((await f.crm.task.get(f.scope)).stageId).toBe("initial");

  // Reproduce an acceptance recorded before the restriction was enabled.
  await f.ecommerce.product.update({
    id: f.product.id,
    data: { singleUnitPerOrder: false },
  });
  expect((await f.accept(old.id)).status).toBe(200);
  expect((await f.crm.task.get(f.scope)).stageId).toBe("payment");
  expect(await threadOrderStep()).toBe("ecommerce-module-order-payment");
  await f.ecommerce.product.update({
    id: f.product.id,
    data: { singleUnitPerOrder: true },
  });

  await expect(f.checkout()).rejects.toThrow(/one unit at a time/i);
  expect(
    await f.ecommerce.order.ordersToBillingModulePaymentIntents.find(
      by("orderId", f.orderId),
    ),
  ).toHaveLength(0);
  await f.subjects.ecommerceModuleOrderMutateCart({
    subjectId: f.buyer.id,
    orderId: f.orderId,
    lines: [{ id: f.lineId, quantity: 1 }],
  });
  expect(await f.getWork()).toMatchObject({
    acceptedFileId: null,
    state: "awaiting-result",
    files: [
      expect.objectContaining({ id: old.id, invalidatedByCartEdit: true }),
    ],
  });
  expect(await f.work.resultPriceForOrder(f.orderId)).toBeNull();
  expect((await f.accept(old.id)).status).toBe(409);
  expect((await f.crm.task.get(f.scope)).stageId).toBe("payment");
  await expect(f.checkout()).rejects.toThrow(/accept a result/i);

  const corrected = await publish(1);
  expect((await f.accept(corrected.id)).status).toBe(200);
  expect((await f.crm.task.get(f.scope)).stageId).toBe("payment");
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect(Number(invoice.amount)).toBe(25);
});

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
    const saved = await f.crm.funnel.save({
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
    expect(await f.crm.task.getFunnel(f.scope)).toMatchObject({
      id: saved.id,
      definition: saved.definition,
    });
    return saved;
  };
  const artifacts = (number: number, assignmentRevision: number) => ({
    ...f.scope,
    assigneeId: assignee.id,
    assignmentRevision,
    attemptId: randomUUID(),
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
  await expect(
    f.subjects.orderWork.publishResultFromRun(
      artifacts(1, assigned.assignmentRevision),
    ),
  ).rejects.toThrow("The task assignment has changed");
  const liveTask = await f.crm.task.get(f.scope);
  const first = await f.subjects.orderWork.publishResultFromRun(
    artifacts(1, liveTask.assignmentRevision),
  );
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
  const secondInput = artifacts(
    2,
    (await f.crm.task.get(f.scope)).assignmentRevision,
  );
  await expect(
    f.subjects.orderWork.publishResultFromRun(secondInput),
  ).rejects.toThrow("No exchange rate is configured");
  const funnel = await configure({
    kind: "confirmed-cost",
    multiplier: "1.3333",
    conversions: [conversion],
  });
  const second = await f.subjects.orderWork.publishResultFromRun(
    artifacts(2, (await f.crm.task.get(f.scope)).assignmentRevision),
  );
  expect(second).toMatchObject({
    price: "10.80000000",
    currencyId: f.currency.id,
    priceBasis: {
      kind: "confirmed-cost",
      publicationId: funnel.id,
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
    work: {
      paymentTiming: "after-acceptance",
      state: "awaiting-payment",
      orderId: f.orderId,
      storeId: f.scope.storeId,
    },
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
  const webhooks = await Promise.all([
    f.webhook(invoice.id),
    f.webhook(invoice.id),
  ]);
  expect(webhooks.map(({ status }) => status)).toEqual([200, 200]);
  const checks = await Promise.all([f.check(), f.check()]);
  expect(checks.map(({ ok }) => ok)).toEqual([true, true]);
  const view = await f.getWork();
  expect(view).toMatchObject({
    state: "paid",
    paidFileId: second.id,
    result: null,
  });
  for (const method of ["GET", "HEAD"]) {
    expect(
      (
        await request(f.route + "/artifacts/" + second.originalFileId, {
          method,
          headers: f.buyer.headers,
        })
      ).ok,
    ).toBe(false);
  }
  expect((await f.check()).ok).toBe(true);
  expect((await f.getWork()).receipt?.id).toBe(view.receipt?.id);
});

it("keeps a paid original private both during inspection and after entering a delivery stage without an agent decision", async () => {
  const f = await fixture("individual-service", 1, "after-inspection");
  await f.work.startServiceDiscussion({
    ...f.scope,
    orderId: f.orderId,
    customerId: f.buyer.id,
  });
  expect(await f.ecommerce.order.findById({ id: f.orderId })).toMatchObject({
    type: "history",
    status: "delivering",
  });
  await expect(f.checkout()).rejects.toThrow();
  const file = await f.work.publishResult({
    ...f.scope,
    orderId: f.orderId,
    customerId: f.buyer.id,
    actorId: f.manager.id,
    currencyId: f.currency.id,
    price: "25",
    operationKey: randomUUID(),
    original: {
      name: "original.png",
      mimeType: "image/png",
      bytes: Buffer.from("purchased original"),
    },
    preview: {
      name: "preview.jpg",
      mimeType: "image/jpeg",
      bytes: Buffer.from("preview"),
    },
  });
  expect((await f.accept(file.id)).status).toBe(200);
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect((await f.webhook(invoice.id)).status).toBe(200);
  expect((await f.check()).ok).toBe(true);
  const paid = (await f.work.findByOrder(f.orderId))!.paid!;
  const event = { orderId: f.orderId, eventId: paid.id };
  await f.subjects.orderWork.consumePayment(event);
  const inspection = await f.crm.task.get(f.scope);
  expect(inspection.stageId).toBe("inspection");
  expect(await f.getWork()).toMatchObject({
    state: "paid",
    deliveryStatus: "pending",
    result: null,
  });
  const content = `${f.route}/artifacts/${file.originalFileId}`;
  for (const method of ["GET", "HEAD"]) {
    const options = { method, headers: f.buyer.headers };
    const grantedContent = protectedFileContentPath(
      f.buyer.id,
      file.originalFileId,
    );
    expect((await request(content, options)).ok).toBe(false);
    expect((await request(grantedContent, options)).ok).toBe(false);
  }
  await f.crm.task.transition({
    ...f.scope,
    actorKind: "manager",
    actorId: f.manager.id,
    expectedRevision: inspection.revision,
    actionId: "verified",
    operationKey: randomUUID(),
    evidence: { kind: "manual", reason: "Checked" },
  });
  await f.subjects.orderWork.consumePayment(event);
  await f.subjects.orderWork.consumePayment(event);
  expect(await f.getWork()).toMatchObject({
    result: null,
    deliveryStatus: "pending",
  });
  expect((await request(content, { headers: f.buyer.headers })).ok).toBe(false);
  expect((await f.crm.task.get(f.scope)).revision).toBe(
    inspection.revision + 1,
  );
});

it.each(["agent-followup", "agent-terminal", "agent-legacy"] as const)(
  "releases a paid original only on the assigned agent's decision (%s)",
  async (flow) => {
    const f = await fixture("individual-service", 1, flow);
    const conversations = f.subjects.customerWork;
    const channel = await conversations.ensureWorkspaceChannel(
      f.buyer.id,
      f.task,
    );
    const { social } = f.subjects.modules;
    const messages = async () => {
      const links = await social.threadsToMessages.find(
        by("threadId", channel.threadId),
      );
      return Promise.all(
        links.map(({ messageId }) =>
          social.message.findById({ id: messageId }),
        ),
      );
    };
    const notices = async () =>
      (await messages()).filter((entry) =>
        entry?.workReplyKey?.startsWith("order-payment:"),
      );
    const file = await f.work.publishResult({
      ...f.scope,
      orderId: f.orderId,
      customerId: f.buyer.id,
      actorId: f.manager.id,
      currencyId: f.currency.id,
      price: "25",
      operationKey: randomUUID(),
      original: {
        name: "original.png",
        mimeType: "image/png",
        bytes: Buffer.from("original"),
      },
      preview: {
        name: "preview.jpg",
        mimeType: "image/jpeg",
        bytes: Buffer.from("preview"),
      },
    });
    expect((await f.accept(file.id)).ok).toBe(true);
    expect(await f.crm.task.get(f.scope)).toMatchObject({
      stageId: "payment",
      assigneeId: f.supportAgent,
    });
    const checkoutMessages = (await messages()).filter((message) =>
      message?.workReplyKey?.startsWith("order-checkout:"),
    );
    expect(
      checkoutMessages.some(
        (message) => message?.interaction?.inline_keyboard?.length,
      ),
    ).toBe(true);
    await conversations.execute(f.buyer.id, {
      operation: "message",
      ...f.scope,
      text: "I already paid, what is the status?",
      operationKey: randomUUID(),
    });
    const [question] = await conversations.listPendingWork({
      taskId: f.task.id,
    });
    expect(question.assigneeId).toBe(f.supportAgent);
    async function dispatchReply(
      input: typeof question,
      answer: string,
      serverStatus: string,
      tx?: Parameters<Parameters<typeof f.db.transaction>[0]>[0],
      decision?: "reply" | "send" | "foreign",
    ) {
      const oldKey = process.env.OPEN_AI_API_KEY;
      process.env.OPEN_AI_API_KEY = "test-payment-conversation";
      const http = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (url, init) => {
          const payload = JSON.parse(String(init?.body));
          if (decision) {
            expect(String(url)).toBe("https://api.openai.com/v1/responses");
            expect(JSON.stringify(payload.input)).toContain(serverStatus);
            expect(payload.tools).toContainEqual(
              expect.objectContaining({
                type: "function",
                name: "deliver_order_file",
              }),
            );
            const output =
              decision === "reply"
                ? [
                    {
                      type: "message",
                      role: "assistant",
                      content: [{ type: "output_text", text: answer }],
                    },
                  ]
                : [
                    {
                      type: "function_call",
                      id: "fc_fixture",
                      call_id: "call_fixture",
                      name: "deliver_order_file",
                      arguments:
                        decision === "send"
                          ? "{}"
                          : JSON.stringify({ fileId: "foreign-file" }),
                    },
                  ];
            return Response.json({
              id: "resp_fixture",
              status: "completed",
              output,
              usage: { input_tokens: 10, output_tokens: 5 },
            });
          }
          expect(String(url)).toBe(
            "https://api.openai.com/v1/chat/completions",
          );
          expect(payload.tools).toBeUndefined();
          expect(payload.messages).toContainEqual(
            expect.objectContaining({
              role: "system",
              content: expect.stringContaining(serverStatus),
            }),
          );
          return Response.json({
            id: "fixture",
            choices: [{ message: { content: answer } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          });
        });
      const rollback = new Error("Rollback simulated agent reply");
      try {
        await expect(
          (tx ?? f.db).transaction((replyTx) =>
            withConsistencyDatabase(replyTx, async () => {
              const worker = createWorker(createAppAssembly());
              const retryPublication =
                decision === "send" && flow === "agent-terminal";
              const orderService = Object.getPrototypeOf(
                f.subjects.orderWork,
              ) as typeof f.subjects.orderWork;
              const publication = retryPublication
                ? jest
                    .spyOn(orderService, "finishAgentFileStage")
                    .mockImplementationOnce(async () => {
                      throw new Error("CRM history write was rolled back", {
                        cause: Object.assign(new Error("deadlock detected"), {
                          code: "40P01",
                        }),
                      });
                    })
                : undefined;
              let result: Awaited<ReturnType<typeof worker.dispatch>>;
              try {
                result = await worker.dispatch(input);
                if (publication) {
                  expect(publication).toHaveBeenCalledTimes(2);
                }
              } finally {
                publication?.mockRestore();
              }
              expect(result.state).toBe(
                decision === "foreign" ? "failed" : "delivered",
              );
              expect(await worker.dispatch(input)).toEqual(result);
              expect(http).toHaveBeenCalledTimes(1);
              const replies = await messages();
              if (decision === "send") {
                const order = (await f.work.findByOrder(f.orderId))!;
                expect(order.resultFileId).toBe(file.originalFileId);
                expect(order.deliveredAt).toBeTruthy();
                const delivered = replies.filter(
                  (message) =>
                    message?.workReplyKey ===
                    `order-file-delivery:${order.paid!.id}`,
                );
                expect(delivered).toHaveLength(1);
                expect(delivered[0]?.metadata?.orderResultFileId).toBe(
                  file.originalFileId,
                );
                expect(delivered[0]?.metadata?.customerWorkAttachments).toEqual(
                  [
                    expect.objectContaining({
                      id: file.originalFileId,
                      name: "original.png",
                    }),
                  ],
                );
                for (const method of ["GET", "HEAD"] as const) {
                  const artifact = await f.subjects.orderWork.artifact(
                    f.buyer.id,
                    f.orderId,
                    file.originalFileId,
                    method,
                  );
                  expect(artifact.bytes.toString()).toBe("original");
                  await expect(
                    f.subjects.orderWork.artifact(
                      f.stranger.id,
                      f.orderId,
                      file.originalFileId,
                      method,
                    ),
                  ).rejects.toThrow();
                }
                const latest = await f.crm.task.get(f.scope);
                expect(latest.status).toBe(
                  flow === "agent-terminal" ? "closed" : "active",
                );
                const purchase = await f.ecommerce.order.findById({
                  id: f.orderId,
                });
                expect(purchase?.status).toBe(
                  flow === "agent-terminal" ? "completed" : "delivered",
                );
                await f.subjects.ecommerceOrderProceed({
                  subjectId: f.buyer.id,
                });
                expect(
                  (await f.ecommerce.order.findById({ id: f.orderId }))?.status,
                ).toBe(purchase?.status);
                if (flow === "agent-terminal") {
                  expect(latest.outcome).toBe("completed");
                  await expect(
                    conversations.execute(f.buyer.id, {
                      ...f.scope,
                      operation: "message",
                      operationKey: randomUUID(),
                      text: "Есть ещё вопрос",
                    }),
                  ).rejects.toThrow("The task is closed");
                  expect(await messages()).toHaveLength(replies.length);
                }
                if (flow === "agent-legacy") {
                  expect(latest.stageId).toBe("followup");
                  const queued = await conversations.listPendingWork({
                    taskId: f.task.id,
                  });
                  expect(queued).toContainEqual(
                    expect.objectContaining({ assigneeId: f.nextAgent }),
                  );
                }
              } else {
                if (decision !== "foreign") {
                  expect(
                    replies.some((message) => message?.description === answer),
                  ).toBe(true);
                }
                expect(
                  (await f.work.findByOrder(f.orderId))!.resultFileId,
                ).toBeNull();
              }
              throw rollback;
            }),
          ),
        ).rejects.toBe(rollback);
      } finally {
        http.mockRestore();
        if (oldKey === undefined) {
          delete process.env.OPEN_AI_API_KEY;
        } else {
          process.env.OPEN_AI_API_KEY = oldKey;
        }
      }
    }
    const chat = await conversations.contextForRun(question);
    expect(chat.messages).toContainEqual({
      role: "system",
      content: expect.stringContaining("Payment is pending"),
    });
    expect((await f.crm.task.get(f.scope)).stageId).toBe("payment");
    expect(await notices()).toHaveLength(0);
    await dispatchReply(
      question,
      "Payment has not been confirmed.",
      "Payment is pending",
    );
    await conversations.ack({ eventId: question.eventId });
    const [invoice] = (await f.checkout()).billingModule.invoices;
    expect(await notices()).toHaveLength(0);
    // Keep this settlement private to the simulated worker until both dispatches finish.
    await f.db.transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        await f.ecommerce.order.paymentIntent.settlePayment({
          invoiceId: invoice.id,
          provider: "dummy",
          amount: invoice.amount,
        });
        const order = await f.ecommerce.order.findById({ id: f.orderId });
        if (!order) {
          throw new Error("Fixture order is missing");
        }
        await f.ecommerce.order.completePaymentStatus({
          id: order.id,
          expectedStatus: order.status,
          expectedUpdatedAt: order.updatedAt,
          onPaymentSucceeded: async () => {},
        });
        const paid = (await f.work.findByOrder(f.orderId))!.paid!;
        const event = { orderId: f.orderId, eventId: paid.id };
        await f.subjects.orderWork.consumePayment(event);
        const after = await f.crm.task.get(f.scope);
        const expectedStage = {
          "agent-terminal": "payment",
          "agent-followup": "followup",
          "agent-legacy": "file-delivery",
        }[flow];
        const responsible =
          flow === "agent-followup" ? f.nextAgent : f.supportAgent;
        expect(after).toMatchObject({
          status: "active",
          stageId: expectedStage,
          assigneeId: responsible,
        });
        const [notice] = await notices();
        expect(notice?.metadata?.orderPayment).toMatchObject({
          orderId: f.orderId,
          invoiceId: invoice.id,
          paymentIntentId: paid.paymentIntentId,
        });
        const [pending] = await conversations.listPendingWork({
          taskId: f.task.id,
        });
        expect(pending.assigneeId).toBe(responsible);
        const context = await conversations.contextForRun(pending);
        expect(context.messages).toContainEqual({
          role: "system",
          content: expect.stringContaining("confirmed payment"),
        });
        await dispatchReply(
          pending,
          "Your original is paid. I will review it.",
          "confirmed payment",
          tx,
          "reply",
        );
        await dispatchReply(pending, "", "confirmed payment", tx, "foreign");
        await dispatchReply(pending, "", "confirmed payment", tx, "send");
        await conversations.ack({ eventId: pending.eventId });
        await f.subjects.orderWork.consumePayment(event);
        const delivered = await messages();
        const work = await f.work.findByOrder(f.orderId);
        const receipts = delivered.filter(
          (message) => message?.workReplyKey === `order-receipt:${paid.id}`,
        );
        expect(receipts).toHaveLength(1);
        expect(receipts[0]?.metadata?.customerWorkAttachments).toEqual([
          expect.objectContaining({
            id: work!.receiptFileId,
            mimeType: "application/pdf",
          }),
        ]);
        expect(await notices()).toHaveLength(1);
        expect(
          await conversations.listPendingWork({ taskId: f.task.id }),
        ).toHaveLength(0);
        expect((await f.crm.task.get(f.scope)).revision).toBe(after.revision);
      }),
    );
  },
);

it("freezes the accepted file for payment, survives an interrupted worker, and protects GET and HEAD", async () => {
  const f = await fixture("individual-service", 1, "direct");
  await expect(f.checkout()).rejects.toThrow(/payment stage/i);
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
  const second = await publish(2);
  const first = await publish(1);
  expect(first.id).not.toBe(second.id);
  const storeFile = (
    actor: string,
    fileId: string,
    storeId = f.scope.storeId,
  ) =>
    `${orderWorkPath(actor, f.orderId)}/artifacts/${fileId}?storeId=${storeId}`;
  for (const [file, body] of [
    [first, "preview 1"],
    [second, "preview 2"],
  ] as const) {
    const response = await request(
      storeFile(f.manager.id, file.previewFileId),
      { headers: f.manager.headers },
    );
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(body);
  }
  expect(
    (
      await request(storeFile(f.manager.id, first.originalFileId), {
        headers: f.manager.headers,
      })
    ).status,
  ).toBe(404);
  expect(
    (
      await request(storeFile(f.stranger.id, first.previewFileId), {
        headers: f.stranger.headers,
      })
    ).ok,
  ).toBe(false);
  expect(
    (
      await request(
        storeFile(f.manager.id, first.previewFileId, randomUUID()),
        { headers: f.manager.headers },
      )
    ).ok,
  ).toBe(false);
  expect((await f.accept(first.id)).status).toBe(200);
  const acceptedTask = await f.crm.task.get(f.scope);
  expect(acceptedTask.stageId).toBe("payment");
  for (const method of ["GET", "HEAD"]) {
    const original = await request(
      `${f.route}/artifacts/${first.originalFileId}`,
      { method, headers: f.buyer.headers },
    );
    expect(original.ok).toBe(false);
  }
  await expect(
    f.subjects.orderWork.consumePayment({
      orderId: f.orderId,
      eventId: randomUUID(),
    }),
  ).rejects.toThrow(/payment event does not exist/i);
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect(invoice.status).toBe("open");
  const payment = {
    ...f.scope,
    orderId: f.orderId,
    customerId: f.buyer.id,
    currencyId: f.currency.id,
    price: "25.00000000",
    fileId: first.id,
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
  expect((await f.accept(second.id)).status).toBe(409);
  // Run the fallback consumer before the API observer can see the paid event.
  await f.db.transaction((database) =>
    withConsistencyDatabase(database, async () => {
      await f.ecommerce.order.paymentIntent.settlePayment({
        invoiceId: invoice.id,
        provider: "dummy",
        amount: invoice.amount,
      });
      const order = await f.ecommerce.order.findById({ id: f.orderId });
      if (!order) {
        throw new Error("Fixture order missing");
      }
      await f.ecommerce.order.completePaymentStatus({
        id: order.id,
        expectedStatus: order.status,
        expectedUpdatedAt: order.updatedAt,
        onPaymentSucceeded: async () => {},
      });
      const before = await f.work.findByOrder(f.orderId);
      expect(before?.paid).toMatchObject({
        fileId: first.id,
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
      const channel = f.subjects.modules.broadcast.channel;
      const eventChannel = await channel.findOrCreate({
        data: { slug: "order-work-payments", title: "Order work payments" },
      });
      const key = `order-work-payment:${before!.paid!.id}`;
      await f.work.publishPaymentEvents(eventChannel.entity.id);
      const [interrupted] = await channel.queue.reserve({
        channelId: eventChannel.entity.id,
        concurrency: 30,
        leaseSeconds: 60,
        schedule: {
          keys: [key],
          select: (states) =>
            states.map((state) => ({ key, previous: state.receipt })),
        },
      });
      expect(interrupted).toBeDefined();
      cleanup.push(() =>
        f.db
          .delete(BroadcastMessage)
          .where(eq(BroadcastMessage.id, interrupted.id)),
      );
      expect(await channel.queue.start(interrupted)).toBe(true);
      await createWorker(createAppAssembly()).consumePayments();
      expect((await f.work.findByOrder(f.orderId))?.deliveredAt).toBeNull();

      // Expire the stopped worker's lease without waiting for wall clock time.
      await database
        .update(BroadcastDelivery)
        .set({ leaseUntil: new Date(0) })
        .where(
          and(
            eq(BroadcastDelivery.channelId, interrupted.channelId),
            eq(BroadcastDelivery.deliveryKey, key),
            eq(BroadcastDelivery.receipt, interrupted.receipt),
          ),
        );
      await createWorker(createAppAssembly()).consumePayments();
      const [recovered] = await channel.queue.states(eventChannel.entity.id, [
        key,
      ]);
      expect(recovered.finishedAt).toBeInstanceOf(Date);
      expect(recovered.receipt).not.toBe(interrupted.receipt);
      expect(await channel.queue.acknowledge(interrupted)).toBe(false);
      await createWorker(createAppAssembly()).consumePayments();
    }),
  );
  const view = await f.getWork();
  const finished = await f.crm.task.get(f.scope);
  expect(finished).toMatchObject({
    stageId: "file-delivery",
    status: "active",
    revision: acceptedTask.revision + 1,
  });
  const confirmed = (await f.work.findByOrder(f.orderId))!.paid!;
  await f.subjects.orderWork.consumePayment({
    orderId: f.orderId,
    eventId: confirmed.id,
  });
  expect((await f.crm.task.get(f.scope)).revision).toBe(finished.revision);
  expect(view).toMatchObject({
    paidFileId: first.id,
    result: null,
    state: "paid",
  });
  expect(view.receipt).toBeTruthy();
  for (const artifact of [view.receipt!]) {
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
          await request(`/api/file-storage/files/${artifact.id}/content`, {
            method,
            headers: operator(),
          })
        ).ok,
      ).toBe(false);
      const granted = await request(
        protectedFileContentPath(f.buyer.id, artifact.id),
        {
          method,
          headers: f.buyer.headers,
        },
      );
      expect(granted.ok).toBe(true);
      expect(granted.headers.get("cache-control")).toContain("no-store");
      const denied = await request(
        protectedFileContentPath(f.stranger.id, artifact.id),
        {
          method,
          headers: f.stranger.headers,
        },
      );
      expect(denied.ok).toBe(false);
      expect((await request(`/public/${artifact.id}`, { method })).ok).toBe(
        false,
      );
    }
  }
  for (const file of [first, second]) {
    for (const method of ["GET", "HEAD"]) {
      const options = { method, headers: f.buyer.headers };
      expect(
        (await request(f.route + "/artifacts/" + file.originalFileId, options))
          .ok,
      ).toBe(false);
      expect(
        (
          await request(
            protectedFileContentPath(f.buyer.id, file.originalFileId),
            options,
          )
        ).ok,
      ).toBe(false);
    }
  }
});

it("records the physical status in order and CRM and deduplicates handing it over", async () => {
  const f = await fixture("physical-order");
  expect(await f.crm.tasksToStages.stageStates(f.task.id)).toMatchObject({
    initial: "current",
    payment: "pending",
    delivery: "pending",
  });
  const [invoice] = (await f.checkout()).billingModule.invoices;
  expect((await f.webhook(invoice.id)).status).toBe(200);
  expect((await f.check()).ok).toBe(true);
  await createWorker(createAppAssembly()).consumePayments();
  expect(await f.crm.tasksToStages.stageStates(f.task.id)).toMatchObject({
    initial: "completed",
    payment: "pending",
    delivery: "current",
  });
  const managerRoute = orderWorkPath(f.manager.id, f.orderId) + "/fulfillment";
  const workerRoute = orderWorkPath(f.stranger.id, f.orderId) + "/fulfillment";
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
  const preparation = await request(
    managerRoute,
    json(f.manager.headers, prepare),
  );
  if (!preparation.ok) {
    throw new Error(
      `Preparing physical order returned ${preparation.status}: ${await preparation.text()}`,
    );
  }
  const prepared = await f.crm.task.get(f.scope);
  expect(prepared.stageId).toBe("shipping");
  expect(
    (await request(managerRoute, json(f.manager.headers, prepare))).status,
  ).toBe(200);
  expect((await f.crm.task.get(f.scope)).revision).toBe(prepared.revision);
  expect((await f.ecommerce.order.findById({ id: f.orderId }))?.status).toBe(
    "packaging",
  );
  const packing = await f.crm.task.get(f.scope);
  expect(packing.stageId).toBe("shipping");
  await f.subjects.module.subjectsToEcommerceModuleStores.create({
    data: {
      subjectId: f.stranger.id,
      ecommerceModuleStoreId: f.scope.storeId,
      variant: "crm-worker",
    },
  });
  await f.crm.task.assign({
    ...f.scope,
    actorId: f.manager.id,
    expectedRevision: packing.revision,
    assigneeId: f.stranger.id,
    assigneeKind: "human",
    operationKey: randomUUID(),
  });
  const ship = {
    ...f.scope,
    stage: "in-transit",
    trackingNumber: "TEST-418",
    operationKey: randomUUID(),
  };
  expect(
    (await request(managerRoute, json(f.manager.headers, ship))).status,
  ).toBe(403);
  expect(
    (await request(workerRoute, json(f.stranger.headers, ship))).status,
  ).toBe(200);
  expect((await f.crm.task.get(f.scope)).stageId).toBe("carrier");
  expect((await f.getWork()).trackingNumber).toBe("TEST-418");
  const handoff = {
    ...f.scope,
    stage: "delivered",
    carrierEvidenceId: "TEST-HANDOFF-418",
    operationKey: randomUUID(),
  };
  const delivered = await request(
    workerRoute,
    json(f.stranger.headers, handoff),
  );
  const duplicate = await request(
    workerRoute,
    json(f.stranger.headers, handoff),
  );
  expect([delivered.status, duplicate.status]).toEqual([200, 200]);
  expect(await delivered.json()).toEqual(await duplicate.json());
  expect((await f.getWork()).state).toBe("delivered");
  expect((await f.ecommerce.order.findById({ id: f.orderId }))?.status).toBe(
    "completed",
  );
  expect((await f.work.findByOrder(f.orderId))?.fulfillment).toHaveLength(3);
  expect((await f.crm.task.get(f.scope)).status).toBe("closed");
});

it("withdraws an existing public receipt and publishes the verified copy only for its buyer", async () => {
  const { mkdir, mkdtemp, readFile, rm, unlink, writeFile } =
    await import("node:fs/promises");
  const f = await fixture("physical-order");
  const order = await f.ecommerce.order.create({
    data: { type: "history", status: "paid" },
  });
  const { file } = f.subjects.modules.fileStorage;
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
  const alias = await file.create({
    data: {
      file: `/public/${folder}/${name}`,
      adminTitle: "Ordinary metadata for the same object",
      mimeType: "image/png",
      extension: "png",
      size: bytes.length,
    },
  });
  cleanup.push(() =>
    f.db.delete(PublicFile).where(eq(PublicFile.id, alias.id)),
  );
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
      await file.privateContent.delete({ id: saved.privateReceiptFileId });
    }
    await unlink(pathname).catch(() => undefined);
  });
  for (const method of ["GET", "HEAD"]) {
    expect((await request(publicPath, { method })).status).toBe(404);
    for (const { id } of [source, alias]) {
      expect(
        (
          await request(`/api/file-storage/files/${id}/content`, {
            method,
            headers: operator(),
          })
        ).status,
      ).toBe(404);
      expect(
        (
          await request(`/api/file-storage/files/${id}`, {
            method,
            headers: operator(),
          })
        ).status,
      ).toBe(404);
    }
  }
  const dump = file.repository.configuration.repository.dump;
  const seedDirectory = dump.directory;
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "sps-order-dump-"));
  file.configureCommerceReceiptGuard((files) =>
    f.work.protectedReceiptFileIds(files),
  );
  try {
    dump.directory = temporaryDirectory;
    const result = await file.dump();
    expect(result.dumps.length).toBeGreaterThan(0);
    expect(result.dumps.map(({ id }) => id)).not.toContain(source.id);
    expect(result.dumps.map(({ id }) => id)).not.toContain(alias.id);
  } finally {
    dump.directory = seedDirectory;
    await rm(temporaryDirectory, { recursive: true, force: true });
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

  const orphanName = `issue418-orphan-${randomUUID()}.png`;
  const orphanPath = `apps/api/public/${folder}/${orphanName}`;
  await writeFile(orphanPath, bytes);
  const orphan = await file.create({
    data: {
      file: `/${folder}/${orphanName}`,
      adminTitle: `Ecommerce Module | Order ${randomUUID()} | Receipt`,
      mimeType: "image/png",
      extension: "png",
      size: bytes.length,
    },
  });
  const held = await migration.migrate(orphan.id, true);
  cleanup.push(async () => {
    await f.db.delete(PublicFile).where(eq(PublicFile.id, orphan.id));
    await file.privateContent.delete({ id: held.privateFileId! });
    await unlink(orphanPath).catch(() => undefined);
  });
  expect(held).toMatchObject({ status: "quarantined", digest: dryRun.digest });
  await expect(readFile(orphanPath)).rejects.toMatchObject({ code: "ENOENT" });
  await expect(migration.migrate(orphan.id, true)).resolves.toEqual(held);
  const orphanArtifact =
    orderWorkPath(f.buyer.id, order.id) + `/artifacts/${held.privateFileId}`;
  expect((await request(orphanArtifact, { headers: f.buyer.headers })).ok).toBe(
    false,
  );
});
