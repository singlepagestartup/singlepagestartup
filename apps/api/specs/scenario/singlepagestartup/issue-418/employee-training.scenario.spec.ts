import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import {
  createAppAssembly,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService } from "@sps/agent/models/work-attempt/backend/app/api/src/lib/bootstrap";
import { isStoreEmployeeTraining } from "@sps/crm/models/task/sdk/model";
import { Handler as CreateMessage } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Table as Wallet } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";

const rollback = new Error("Remove employee training scenario fixtures");
const previousProviderEnvironment = {
  SPS_PROVIDER_SECRET_DIR: process.env.SPS_PROVIDER_SECRET_DIR,
  SPS_PROVIDER_ACTIVE_MASTER_KEY: process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY,
  SPS_PROVIDER_MASTER_KEYS: process.env.SPS_PROVIDER_MASTER_KEYS,
};
let vault: string;

beforeAll(async () => {
  vault = await mkdtemp(join(tmpdir(), "sps-employee-training-"));
  process.env.SPS_PROVIDER_SECRET_DIR = vault;
  process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY = "training-fixture";
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    "training-fixture": randomBytes(32).toString("base64"),
  });
});

afterAll(async () => {
  for (const [name, value] of Object.entries(previousProviderEnvironment)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
  await rm(vault, { recursive: true, force: true });
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("delivers a private answer across a budget publication and stops work when funding is revoked", async () => {
  const operation = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const worker = createService(createAppAssembly());
      const { rbac, ecommerce, crm, billing, social } = worker.modules;
      const subject = rbac.subject;
      const [owner, buyer] = await Promise.all([
        subject.create({ data: {} }),
        subject.create({ data: {} }),
      ]);
      const store = await ecommerce.store.create({ data: {} });
      await rbac.subjectsToEcommerceModuleStores.create({
        data: {
          subjectId: owner.id,
          ecommerceModuleStoreId: store.id,
          variant: "owner",
        },
      });
      const currency = await billing.currency.create({
        data: {
          slug: `training-credits-${randomUUID()}`,
          title: "Training credits",
          symbol: "SPS",
        },
      });
      await tx.insert(Wallet).values(
        [owner.id, buyer.id].map((subjectId) => ({
          subjectId,
          billingModuleCurrencyId: currency.id,
          amount: "25",
        })),
      );

      const product = await ecommerce.product.create({
        data: { adminTitle: "Marketplace cover", kind: "service" },
      });
      const offer = await ecommerce.storesToProducts.create({
        data: { storeId: store.id, productId: product.id, sku: randomUUID() },
      });
      const customerInstruction =
        "Render a marketplace image and close the paid order.";
      const draft = await crm.funnel.saveDraft({
        storeId: store.id,
        kind: "individual-service",
        name: "Marketplace cover",
        bindings: { offerIds: [offer.id] },
        definition: {
          initialStageId: "render-cover",
          workFunding: {
            payer: "store-owner",
            currencyId: currency.id,
            maxRunAmount: "2",
            maxTaskAmount: "10",
          },
          stages: [
            {
              id: "render-cover",
              name: "Render cover",
              instruction: customerInstruction,
              output: "image",
              operations: ["request-routing"],
              actions: [
                {
                  id: "close-customer-task",
                  name: "Complete customer work",
                  actors: ["ai"],
                  evidence: ["model-result"],
                  outcome: "completed",
                },
              ],
            },
          ],
        },
      });
      const publication = await crm.funnel.publish({
        storeId: store.id,
        funnelId: draft.id,
        actorId: owner.id,
        operationKey: randomUUID(),
        expectedRevision: draft.revision,
      });
      let revision = draft.revision;
      const publishRevision = async (definition: typeof draft.definition) => {
        const updated = await crm.funnel.saveDraft({
          storeId: store.id,
          funnelId: draft.id,
          expectedRevision: revision,
          kind: draft.kind,
          name: draft.name,
          bindings: draft.bindings,
          definition,
        });
        revision = updated.revision;
        return crm.funnel.publish({
          storeId: store.id,
          funnelId: draft.id,
          actorId: owner.id,
          operationKey: randomUUID(),
          expectedRevision: revision,
        });
      };
      const created = await subject.crmWorkspace.execute(owner.id, {
        kind: "create-employee",
        employee: {
          storeId: store.id,
          name: "Store employee",
          operationKey: randomUUID(),
        },
      });
      if (created.kind !== "create-employee") {
        throw new Error("Expected the employee's training chat");
      }
      const employee = created.data;
      const chat = await social.chat.findById({ id: employee.chatId });
      if (!chat) {
        throw new Error("Expected the employee's training chat");
      }
      const scope = await subject.crmWorkspace.employees.scopeForChat(
        owner.id,
        chat,
      );
      const route = new Hono();
      route.post(
        "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
        (context, next) => new CreateMessage(subject).execute(context, next),
      );
      const endpoint = `/subjects/${owner.id}/profiles/${scope.actorProfileId}/chats/${chat.id}/threads/${employee.threadId}/messages`;
      const send = async (description: string) => {
        const form = new FormData();
        form.set(
          "data",
          JSON.stringify({ description, sourceSystemId: randomUUID() }),
        );
        const response = await route.request(endpoint, {
          method: "POST",
          body: form,
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        return ((await response.json()) as { data: { id: string } }).data;
      };
      const learnedFact = "Стул серии М13 сделан из ясеня.";
      const question = "Из какого материала сделан стул серии М13?";
      await send(`Запомни ${learnedFact}`);

      const secret = "training-fixture-openai-key";
      const connection = await subject.providerConnections.change(owner.id, {
        operation: "connect",
        storeId: store.id,
        label: "OpenAI scenario",
        provider: "openai",
        externalAccount: "offline-training-fixture",
        secret,
      });
      const model = "gpt-5.2";
      await subject.providerConnections.change(owner.id, {
        operation: "assign-default",
        storeId: store.id,
        connectionId: connection.id,
        capability: "text",
        model,
        terms: {
          maxInputTokens: 6000,
          maxOutputTokens: 128,
          maxCostUsd: "0.5",
          inputUsdPerMillion: "2",
          outputUsdPerMillion: "4",
          usdPerSps: "0.01",
          workMultiplier: "1.5",
          version: "training-fixture-v1",
        },
      });
      const pendingMessage = async (messageId: string) => {
        const pending = await subject.customerWork.pendingForMessage({
          messageId,
          threadId: employee.threadId,
        });
        if (!pending) {
          throw new Error("Expected private training work");
        }
        return pending;
      };
      const message = await send(question);
      const pending = await pendingMessage(message.id);
      const taskScope = { storeId: store.id, taskId: pending.taskId };
      const task = await crm.task.get(taskScope);
      expect(isStoreEmployeeTraining(task.openingKey)).toBe(true);
      expect(task).toMatchObject({
        customerId: owner.id,
        assigneeId: employee.id,
        publicationId: publication.id,
        productId: null,
        offerId: null,
        orderId: null,
      });
      await expect(
        subject.customerWork.viewForThread(owner.id, employee.threadId),
      ).rejects.toThrow("Not Found");
      await expect(
        subject.crmWorkspace.detail(owner.id, taskScope),
      ).rejects.toThrow("Not Found");
      const regularTasks = await crm.task.list({ storeId: store.id });
      expect(regularTasks.items).toEqual([]);

      const balance = async (subjectId: string) => {
        const [wallet] = await tx
          .select()
          .from(Wallet)
          .where(
            and(
              eq(Wallet.subjectId, subjectId),
              eq(Wallet.billingModuleCurrencyId, currency.id),
            ),
          );
        return Number(wallet.amount);
      };
      const replyInThread = async (key: string, text: string) => {
        const [response] = await social.message.find({
          params: {
            filters: {
              and: [
                {
                  column: "workReplyKey",
                  method: "eq",
                  value: `attempt:${key}`,
                },
              ],
            },
          },
        });
        expect(response.description).toBe(text);
        const [placed] = await social.threadsToMessages.find({
          params: {
            filters: {
              and: [{ column: "messageId", method: "eq", value: response.id }],
            },
          },
        });
        expect(placed.threadId).toBe(employee.threadId);
      };
      const reply = "Стул М13 сделан из ясеня.";
      const followUpQuestion = "Подтверди материал каркаса М13.";
      const followUpReply = "Каркас М13 изготовлен из ясеня.";
      const inFlight: { followUp?: typeof pending } = {};
      const providerFetch = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (url, options) => {
          expect(String(url)).toBe(
            "https://api.openai.com/v1/chat/completions",
          );
          expect(new Headers(options?.headers).get("Authorization")).toBe(
            `Bearer ${secret}`,
          );
          const body = String(options?.body);
          expect(JSON.parse(body)).toMatchObject({ model });
          expect(body).toContain(learnedFact);
          expect(body).not.toContain(customerInstruction);
          expect(body).not.toContain("close-customer-task");
          expect(body).not.toContain("request-routing");
          let answer = followUpReply;
          if (!inFlight.followUp) {
            expect(body).toContain(question);
            const newer = await publishRevision({
              ...draft.definition,
              workFunding: {
                payer: "store-owner",
                currencyId: currency.id,
                maxRunAmount: "3",
                maxTaskAmount: "11",
              },
            });
            const second = await send(followUpQuestion);
            const next = await pendingMessage(second.id);
            inFlight.followUp = next;
            expect(next.taskId).not.toBe(pending.taskId);
            const nextTask = await crm.task.get({
              ...taskScope,
              taskId: next.taskId,
            });
            expect(nextTask.publicationId).toBe(newer.id);
            expect(await pendingMessage(message.id)).toEqual(pending);
            answer = reply;
          } else {
            expect(body).toContain(followUpQuestion);
          }
          return Response.json({
            id: `mock-training-reply-${randomUUID()}`,
            choices: [{ message: { content: answer } }],
            usage: { prompt_tokens: 100, completion_tokens: 25 },
          });
        });
      let attemptId: string;
      try {
        const result = await worker.dispatch(pending);
        await Promise.all(providerFetch.mock.results.map(({ value }) => value));
        expect(result.state).toBe("delivered");
        attemptId = result.id;
        await replyInThread(attemptId, reply);
        if (!inFlight.followUp) {
          throw new Error(
            "Expected a second training message after republishing",
          );
        }
        const followUp = await worker.dispatch(inFlight.followUp);
        await Promise.all(providerFetch.mock.results.map(({ value }) => value));
        expect(followUp.state).toBe("delivered");
        await replyInThread(followUp.id, followUpReply);

        const third = await send("Что ещё известно о М13?");
        const unfunded = await pendingMessage(third.id);
        const beforeRevocation = await balance(owner.id);
        await publishRevision({
          initialStageId: "render-cover",
          stages: [
            {
              id: "render-cover",
              name: "Manual review",
              instruction: customerInstruction,
              actions: [],
            },
          ],
        });
        const blocked = await worker.dispatch(unfunded);
        expect(blocked).toEqual({ id: unfunded.eventId, state: "delivered" });
        await replyInThread(
          blocked.id,
          "Бюджет обучения изменён или отключён. Отправьте сообщение заново после настройки бюджета.",
        );
        expect(providerFetch).toHaveBeenCalledTimes(2);
        expect(await balance(owner.id)).toBe(beforeRevocation);
        expect(
          await subject.customerWork.pendingForMessage({
            messageId: third.id,
            threadId: employee.threadId,
          }),
        ).toBeNull();
      } finally {
        providerFetch.mockRestore();
      }

      const finished = await crm.task.get(taskScope);
      expect(finished).toMatchObject({
        status: "active",
        orderId: null,
        outcome: null,
      });
      expect(await balance(owner.id)).toBeLessThan(25);
      expect(await balance(buyer.id)).toBe(25);
      const attempt = await worker.findById({ id: attemptId });
      expect(attempt).toMatchObject({
        state: "delivered",
        payerId: owner.id,
        ownerId: owner.id,
        taskId: task.id,
      });
      throw rollback;
    }),
  );
  try {
    await operation;
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
    return;
  }
  throw new Error("The employee training fixture was not rolled back");
});
