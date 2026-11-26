import { randomUUID } from "node:crypto";
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
import { Table as Wallet } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";

const rollback = new Error("Remove nested-work scenario fixtures");
const previousKey = process.env.OPEN_AI_API_KEY;
const secret = "customer-qa-fixture-key";

beforeAll(() => {
  process.env.OPEN_AI_API_KEY = secret;
});

afterAll(async () => {
  if (previousKey === undefined) {
    delete process.env.OPEN_AI_API_KEY;
  } else {
    process.env.OPEN_AI_API_KEY = previousKey;
  }
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("reserves separate private steps through the server OpenAI key and publishes one final reply", async () => {
  await getDrizzle({})
    .transaction(async (tx) => {
      await withConsistencyDatabase(tx, async () => {
        const worker = createService(createAppAssembly());
        const { crm, rbac, ecommerce, billing, social, knowledge } =
          worker.modules;
        const subject = rbac.subject;
        const [owner, customer] = [
          await subject.create({ data: {} }),
          await subject.create({ data: {} }),
        ];
        const store = await ecommerce.store.create({ data: {} });
        await rbac.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: owner.id,
            ecommerceModuleStoreId: store.id,
            variant: "owner",
          },
        });
        const created = await subject.crmWorkspace.execute(owner.id, {
          kind: "create-employee",
          employee: {
            storeId: store.id,
            name: "Phone support",
            operationKey: randomUUID(),
          },
        });
        if (created.kind !== "create-employee") {
          throw new Error("Expected a store employee");
        }
        const assigneeId = created.data.id;
        const assignedRole =
          "Use the support handbook. ".repeat(180) +
          "Assigned role final sentence.";
        await social.profile.update({
          id: created.data.profileId,
          data: { description: { en: assignedRole } },
        });
        const product = await ecommerce.product.create({
          data: { adminTitle: "Fixture phone" },
        });
        const offer = await ecommerce.storesToProducts.create({
          data: {
            storeId: store.id,
            productId: product.id,
            sku: randomUUID(),
          },
        });
        const currency = await billing.currency.create({
          data: {
            slug: `fixture-credits-${randomUUID()}`,
            title: "Work credits",
            symbol: "SPS",
          },
        });
        await tx.insert(Wallet).values({
          subjectId: owner.id,
          billingModuleCurrencyId: currency.id,
          amount: "10",
        });
        const draft = await crm.funnel.save({
          storeId: store.id,
          name: "Classify and answer",
          kind: "consultation",
          bindings: { offerIds: [offer.id] },
          definition: {
            initialStageId: "reply",
            workFunding: {
              payer: "store-owner",
              currencyId: currency.id,
              maxTaskAmount: "10",
              maxRunAmount: "2",
            },
            stages: [
              {
                id: "reply",
                name: "Reply",
                defaultAssigneeSubjectId: assigneeId,
                instruction: "Discuss the requested phone.",
                operations: ["request-routing"],
                actions: [],
              },
            ],
          },
        });
        const intake = await subject.customerWork.execute(customer.id, {
          operation: "ask",
          storeId: store.id,
          offerId: offer.id,
          productId: product.id,
          operationKey: randomUUID(),
        });
        const task = await crm.task.get({
          storeId: store.id,
          taskId: intake.taskId,
        });
        expect(task.assigneeId).toBe(assigneeId);
        const connections = subject.providerConnections;
        const legacyReplyModel = "gpt-5.4-mini-2026-03-17";
        const [customerProfile] =
          await rbac.subjectsToSocialModuleProfiles.find({
            params: {
              filters: {
                and: [
                  { column: "subjectId", method: "eq", value: customer.id },
                  { column: "variant", method: "eq", value: "default" },
                ],
              },
            },
          });
        const completionUrl = "https://api.openai.com/v1/chat/completions";
        const external = jest
          .spyOn(globalThis, "fetch")
          .mockImplementation(async (url, options) => {
            expect(String(url)).toBe(completionUrl);
            expect(
              new Headers(options?.headers).get("Authorization") ===
                `Bearer ${secret}`,
            ).toBe(true);
            const content = String(options?.body);
            expect(content).not.toContain(secret);
            const attempts = await worker.find({
              params: {
                filters: {
                  and: [{ column: "taskId", method: "eq", value: task.id }],
                },
              },
            });
            const step = attempts.find(
              (entry) => entry.state === "dispatching",
            );
            expect(step).toBeDefined();
            const settings = await connections.list(owner.id, store.id);
            expect(
              settings.operations.some(
                (entry) =>
                  entry.operationKey === `work:${step?.id}` &&
                  entry.state === "held",
              ),
            ).toBe(true);
            const body = JSON.parse(content);
            const decision = body.response_format?.type === "json_object";
            if (decision) {
              expect(body.model).toBe("gpt-4.1-mini");
              expect(body).not.toHaveProperty("reasoning");
              expect(body).not.toHaveProperty("reasoning_effort");
            } else {
              expect(body.messages).toContainEqual({
                role: "system",
                content: `Assigned employee role\n${assignedRole}`,
              });
              expect(body.model).toBe(legacyReplyModel);
              expect(body.reasoning_effort).toBe("high");
            }
            return Response.json({
              id: decision ? "fixture-child" : "fixture-reply",
              choices: [
                {
                  message: {
                    content: decision
                      ? '{"route":"answer"}'
                      : "The phone has a 6-inch screen.",
                  },
                },
              ],
              usage: {
                prompt_tokens: 30,
                completion_tokens: 12,
              },
            });
          });
        try {
          const input = {
            customerId: customer.id,
            chatId: intake.chatId,
            threadId: intake.threadId,
            profileId: customerProfile.socialModuleProfileId,
            text: "What size is this phone?",
            sourceSystemId: randomUUID(),
            hasAttachments: false,
          };
          await expect(
            subject.customerWork.messageFromThread({
              ...input,
              metadata: {
                provider: { modelId: legacyReplyModel, reasoning: "max" },
              },
            }),
          ).rejects.toThrow("reasoning effort is unavailable for this model");
          await expect(
            subject.customerWork.messageFromThread({
              ...input,
              metadata: {
                provider: { modelId: "gpt-6.2-astra", reasoning: "low" },
              },
            }),
          ).rejects.toThrow("reasoning effort is unavailable for this model");
          const metadata = {
            provider: { modelId: legacyReplyModel, reasoning: "high" },
          };
          delete process.env.OPEN_AI_API_KEY;
          try {
            await expect(
              subject.customerWork.messageFromThread({ ...input, metadata }),
            ).rejects.toThrow("server OpenAI work key is unavailable");
            expect(external).not.toHaveBeenCalled();
          } finally {
            process.env.OPEN_AI_API_KEY = secret;
          }
          const saved = await subject.customerWork.messageFromThread({
            ...input,
            metadata,
          });
          expect(saved?.metadata).toMatchObject(metadata);
          if (!saved) {
            throw new Error("Fixture message is not recorded");
          }
          await expect(
            subject.customerWork.messageFromThread({ ...input, metadata }),
          ).resolves.toMatchObject({ id: saved.id });
          await expect(
            subject.customerWork.messageFromThread({
              ...input,
              metadata: { provider: { modelId: legacyReplyModel } },
            }),
          ).rejects.toThrow("This request key belongs to another message");
          const message = await subject.customerWork.pendingForMessage({
            threadId: intake.threadId,
            messageId: saved.id,
          });
          if (!message) {
            throw new Error("Fixture event is not queued");
          }
          const operationCalls = () => external.mock.calls;
          const run = { ...message, capability: "text" as const };
          // The routing step has already settled when preparing the final reply fails.
          const createAttempt = worker.create.bind(worker);
          const outage = jest
            .spyOn(worker, "create")
            .mockImplementation(async (props) => {
              if (props.data.stepKey === "reply") {
                throw new Error("Temporary failure preparing the reply");
              }
              return createAttempt(props);
            });
          try {
            await worker.drain(1, run.taskId);
            expect(operationCalls()).toHaveLength(1);
            expect(
              await crm.tasksToStages.findById({ id: run.eventId }),
            ).toMatchObject({
              pending: true,
              detail: { preparationFailures: 1 },
            });
          } finally {
            outage.mockRestore();
          }
          const result = await worker.dispatch(run);
          expect(result.state).toBe("delivered");
          await expect(
            createService(createAppAssembly()).dispatch(run),
          ).resolves.toEqual(result);
          expect(operationCalls()).toHaveLength(2);
          const settings = await connections.list(owner.id, store.id);
          const journal = settings.operations.flatMap((entry) =>
            entry.providerWork ? [entry.providerWork] : [],
          );
          expect(journal.map(({ stepKey }) => stepKey).sort()).toEqual([
            "reply",
            "request-routing",
          ]);
          expect(
            journal.every(
              ({ basis, eventId }) =>
                basis === "rate-card" && eventId === message.eventId,
            ),
          ).toBe(true);
          expect(JSON.stringify(settings)).not.toContain(secret);
          const view = await subject.customerWork.view(customer.id, {
            storeId: store.id,
            taskId: task.id,
          });
          expect(
            view.messages
              .filter((entry) => entry.kind === "operator")
              .map((entry) => entry.body),
          ).toEqual(["The phone has a 6-inch screen."]);
          const source = await knowledge.source.upsertSourceBySlug(
            {
              slug: `fixture-index-${randomUUID()}`,
              title: "Phone specification",
              content:
                "The phone has a six-inch screen and a battery warranty.",
            },
            true,
          );
          if (!source) {
            throw new Error("Fixture source was not created");
          }
          await subject.module.subjectsToEcommerceModuleProducts.create({
            data: {
              subjectId: created.data.id,
              ecommerceModuleProductId: offer.productId,
              variant: "store-expert",
            },
          });
          await social.profilesToKnowledgeModuleSources.create({
            data: {
              profileId: created.data.profileId,
              knowledgeModuleSourceId: source.id,
            },
          });
          const indexDraft = await crm.funnel.save({
            storeId: store.id,
            kind: "consultation",
            name: "Index phone",
            definition: {
              initialStageId: "index",
              maintenanceSourceId: source.id,
              workFunding: {
                payer: "store-owner",
                currencyId: currency.id,
                maxTaskAmount: "10",
                maxRunAmount: "2",
              },
              stages: [
                { id: "index", name: "Index", instruction: "", actions: [] },
              ],
            },
          });
          const indexing = await crm.task.open({
            storeId: store.id,
            funnelId: indexDraft.id,
            offerId: offer.id,
            customerId: owner.id,
            actorId: owner.id,
            operationKey: randomUUID(),
          });
          const indexScope = { storeId: store.id, taskId: indexing.id };
          await crm.task.assign({
            ...indexScope,
            actorId: owner.id,
            assigneeKind: "ai",
            assigneeId,
            expectedRevision: indexing.revision,
            operationKey: randomUUID(),
          });
          const model = "text-embedding-3-large";
          await expect(
            worker.queueKnowledgeIndex(customer.id, indexScope),
          ).rejects.toThrow("store ownership");
          const queued = await worker.queueKnowledgeIndex(owner.id, indexScope);
          await expect(
            worker.queueKnowledgeIndex(owner.id, indexScope),
          ).resolves.toEqual(queued);
          const embedding = Array<number>(768).fill(0.3);
          external.mockImplementationOnce(async (url, options) => {
            expect(String(url)).toBe("https://api.openai.com/v1/embeddings");
            expect(
              new Headers(options?.headers).get("Authorization") ===
                `Bearer ${secret}`,
            ).toBe(true);
            const body = JSON.parse(String(options?.body));
            expect(body).toMatchObject({
              dimensions: 768,
              model,
              input: [source.content],
            });
            expect(String(options?.body)).not.toContain(secret);
            return Response.json({
              id: "fixture-embedding",
              data: [{ index: 0, embedding }],
              usage: {
                prompt_tokens: 15,
              },
            });
          });
          await createService(createAppAssembly()).drainKnowledgeIndex();
          await createService(createAppAssembly()).drainKnowledgeIndex();
          expect(operationCalls()).toHaveLength(3);
          const embeddingIndex = `openai:${model}:768:v1`;
          expect(
            await knowledge.source.hasEmbeddingIndex(
              [source.id],
              embeddingIndex,
            ),
          ).toBe(true);
          const chunks = await knowledge.source.searchChunks({
            sourceIds: [source.id],
            embedding,
            topK: 1,
            embeddingIndex,
          });
          expect(chunks).toHaveLength(1);
          expect(chunks[0]).toMatchObject({
            sourceId: source.id,
            text: source.content,
          });
          await expect(
            knowledge.source.searchChunks({
              sourceIds: [source.id],
              embedding,
              topK: 1,
              embeddingIndex: "openai:text-embedding-3-small:768:v1",
            }),
          ).resolves.toEqual([]);
          const indexJournal = (
            await connections.list(owner.id, store.id)
          ).operations.find(
            (entry) => entry.providerWork?.stepKey === "knowledge-index",
          );
          expect(indexJournal?.senderId).toBe(owner.id);
          expect(indexJournal?.providerWork).toMatchObject({
            eventId: queued.eventId,
            state: "delivered",
            model,
            basis: "rate-card",
            usd: "0.00000195",
          });
          const otherEmployee = await subject.crmWorkspace.execute(owner.id, {
            kind: "create-employee",
            employee: {
              storeId: store.id,
              name: "Other stage employee",
              operationKey: randomUUID(),
            },
          });
          if (otherEmployee.kind !== "create-employee") {
            throw new Error("Expected another store employee");
          }
          await crm.funnel.save({
            storeId: store.id,
            funnelId: draft.id,
            expectedRevision: draft.revision,
            name: "Classify and answer",
            kind: "consultation",
            bindings: { offerIds: [offer.id] },
            definition: {
              initialStageId: "reply",
              workFunding: {
                payer: "store-owner",
                currencyId: currency.id,
                maxTaskAmount: "10",
                // The complete employee profile counts toward the provider reservation.
                maxRunAmount: "5",
              },
              stages: [
                {
                  id: "reply",
                  name: "Reply",
                  defaultAssigneeSubjectId: otherEmployee.data.id,
                  instruction: "Use the scoped phone reference.",
                  operations: [
                    "tool-selection",
                    "compression",
                    "knowledge-search",
                  ],
                  actions: [],
                },
              ],
            },
          });
          const followUp = await subject.customerWork.execute(customer.id, {
            operation: "ask",
            storeId: store.id,
            offerId: offer.id,
            productId: product.id,
            operationKey: randomUUID(),
          });
          // The manager answers the earlier questions before returning the conversation to the employee.
          const scope = { storeId: store.id, taskId: followUp.taskId };
          const opening = await crm.task.get(scope);
          expect(opening.assigneeId).toBe(assigneeId);
          await subject.crmWorkspace.execute(owner.id, {
            kind: "assign",
            assignment: {
              ...scope,
              expectedRevision: opening.revision,
              operationKey: randomUUID(),
              assigneeId: owner.id,
            },
          });
          let triggerId: string | undefined;
          for (let index = 0; index < 9; index += 1) {
            if (index === 8) {
              await subject.crmWorkspace.send(
                owner.id,
                {
                  ...scope,
                  chatId: followUp.chatId,
                  threadId: followUp.threadId,
                },
                {
                  operationKey: randomUUID(),
                  text: "I have checked the earlier warranty questions.",
                },
              );
              const managed = await crm.task.get(scope);
              await subject.crmWorkspace.execute(owner.id, {
                kind: "assign",
                assignment: {
                  ...scope,
                  expectedRevision: managed.revision,
                  operationKey: randomUUID(),
                  assigneeId,
                },
              });
            }
            const text =
              "Does the phone have a warranty? Question " + (index + 1);
            const operationKey = randomUUID();
            const view = await subject.customerWork.execute(customer.id, {
              operation: "message",
              storeId: store.id,
              taskId: followUp.taskId,
              operationKey,
              text,
            });
            const authored = view.messages.find((entry) => entry.body === text);
            if (!authored) {
              throw new Error("The follow-up message is missing");
            }
            const [link] = await social.threadsToMessages.find({
              params: {
                filters: {
                  and: [
                    { column: "messageId", method: "eq", value: authored.id },
                  ],
                },
              },
            });
            // The fixture shares one SQL transaction, so DEFAULT now() is constant.
            await social.threadsToMessages.update({
              id: link.id,
              data: { createdAt: new Date(Date.now() + index * 1000) },
            });
            triggerId = (
              await crm.tasksToStages.byOperation(
                followUp.taskId,
                `store-work:${customer.id}:${operationKey}`,
              )
            )?.id;
          }
          const latest = (await subject.customerWork.listPendingWork()).find(
            (entry) => entry.eventId === triggerId,
          );
          if (!latest) {
            throw new Error("Missing follow-up event");
          }
          const usage = {
            prompt_tokens: 30,
            completion_tokens: 12,
          };
          const resultWith = (text: string) =>
            Response.json({
              id: "nested-fixture",
              choices: [{ message: { content: text } }],
              usage,
            });
          external
            .mockImplementationOnce(async (url, options) => {
              expect(String(url)).toMatch(/chat\/completions$/);
              expect(String(options?.body)).toContain("knowledge-search");
              return resultWith('{"tool":"knowledge-search"}');
            })
            .mockImplementationOnce(async (url, options) => {
              expect(String(url)).toMatch(/chat\/completions$/);
              expect(String(options?.body)).toContain(
                "Summarize earlier dialogue",
              );
              return resultWith(
                "Earlier questions concerned the phone warranty.",
              );
            })
            .mockImplementationOnce(async (url, options) => {
              expect(String(url)).toMatch(/embeddings$/);
              expect(JSON.parse(String(options?.body))).toMatchObject({
                dimensions: 768,
                input: ["Does the phone have a warranty? Question 9"],
              });
              return Response.json({
                id: "nest-embedding",
                data: [{ index: 0, embedding }],
                usage,
              });
            })
            .mockImplementationOnce(async (url, options) => {
              expect(String(url)).toMatch(/chat\/completions$/);
              const body = String(options?.body);
              expect(JSON.parse(body)).not.toHaveProperty("reasoning");
              expect(JSON.parse(body)).toMatchObject({
                model: "gpt-6.2-astra",
                reasoning_effort: "high",
              });
              expect(body).toContain(
                "Earlier questions concerned the phone warranty.",
              );
              expect(JSON.parse(body).messages).toContainEqual({
                role: "system",
                content: `Assigned employee role\n${assignedRole}`,
              });
              expect(body).toContain("Store references");
              return resultWith("The battery warranty is included.");
            });
          const answered = await worker.dispatch({
            ...latest,
            capability: "text",
          });
          await Promise.all(external.mock.results.map(({ value }) => value));
          expect(answered.state).toBe("delivered");
          expect(operationCalls()).toHaveLength(7);
          const operations = (
            await connections.list(owner.id, store.id)
          ).operations.filter((entry) => entry.taskId === followUp.taskId);
          const steps = operations.flatMap((entry) =>
            entry.providerWork?.stepKey ? [entry.providerWork.stepKey] : [],
          );
          expect(steps.sort()).toEqual([
            "compression",
            "knowledge-search",
            "reply",
            "tool-selection",
          ]);
          const replyHold = operations.find(
            ({ kind, providerWork }) =>
              kind === "reserve" && providerWork?.stepKey === "reply",
          );
          expect(replyHold).toMatchObject({
            state: "settled",
            senderId: owner.id,
            providerWork: {
              eventId: latest.eventId,
              model: "gpt-6.2-astra",
              basis: "rate-card",
              usd: "0.00072",
            },
          });
          expect(
            operations.filter(
              ({ reservationId }) => reservationId === replyHold?.id,
            ),
          ).toEqual([
            expect.objectContaining({
              state: "posted",
              amount: "0.014400000000",
              senderId: owner.id,
            }),
          ]);

          const executor = await subject.create({ data: {} });
          const oldRequest = "historic-identity-request";
          const historic = await worker.create({
            data: {
              storeId: store.id,
              taskId: task.id,
              eventId: randomUUID(),
              stageId: "reply",
              assigneeId,
              assignmentRevision: task.assignmentRevision,
              stepKey: "request-routing",
              capability: "decision",
              ownerId: owner.id,
              payerId: owner.id,
              executorId: executor.id,
              connectionId: randomUUID(),
              identityId: randomUUID(),
              credentialVersion: randomUUID(),
              provider: "openrouter",
              externalAccount: "historic-account",
              model: "openai/gpt-4.1-mini",
              terms: {
                maxInputTokens: 6000,
                maxOutputTokens: 128,
                maxCostUsd: "0.5",
                inputUsdPerMillion: "2",
                outputUsdPerMillion: "4",
                usdPerSps: "0.01",
                workMultiplier: "1.5",
                version: "historic-rate",
              },
              currencyId: currency.id,
              maximum: "1",
              state: "received",
              providerRequestId: oldRequest,
              result: {
                providerRequestId: oldRequest,
                text: '{"route":"answer"}',
                usage: {
                  usd: "0.001",
                  inputTokens: 20,
                  outputTokens: 10,
                  basis: "provider",
                },
              },
            },
          });
          const key = `work:${historic.id}`;
          const hold = await subject.workLedger.reserve({
            storeId: store.id,
            taskId: task.id,
            actorId: assigneeId,
            senderId: owner.id,
            recipientId: assigneeId,
            currencyId: currency.id,
            operationKey: key,
            purpose: "agent-work",
            amount: "1",
            budget: "10",
          });
          await subject.workLedger.changeProviderWork(store.id, key, () => ({
            attemptId: historic.id,
            executorId: executor.id,
            connectionId: historic.connectionId!,
            provider: "openrouter",
            externalAccount: historic.externalAccount,
            model: historic.model,
            state: "received",
            providerRequestId: oldRequest,
          }));
          await worker.reconcile(30, store.id);
          await worker.reconcile(30, store.id);
          const settled = await worker.findById({ id: historic.id });
          expect(settled).toMatchObject({
            providerMode: "identity",
            state: "delivered",
          });
          const previousTransfers = (
            await connections.list(owner.id, store.id)
          ).operations.filter(({ reservationId }) => reservationId === hold.id);
          expect(previousTransfers).toHaveLength(2);
          expect(previousTransfers).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: settled?.workReceiptId,
                senderId: owner.id,
                recipientId: assigneeId,
                amount: "0.150000000000",
              }),
              expect.objectContaining({
                id: settled?.expenseReceiptId,
                senderId: assigneeId,
                recipientId: executor.id,
                amount: "0.100000000000",
              }),
            ]),
          );
          expect(operationCalls()).toHaveLength(7);

          const ledger = subject.workLedger;
          const budgetTaskId = randomUUID();
          const budgetEventId = randomUUID();
          const reserve = (stageId: string, eventId: string, amount: string) =>
            ledger.reserve({
              storeId: store.id,
              taskId: budgetTaskId,
              actorId: assigneeId,
              senderId: owner.id,
              recipientId: assigneeId,
              currencyId: currency.id,
              operationKey: randomUUID(),
              purpose: "agent-work",
              stageId,
              eventId,
              amount,
              budget: "1",
              taskBudget: "1",
              runBudget: "0.8",
            });
          const reserved = await reserve("intake", budgetEventId, "0.6");
          await expect(reserve("intake", budgetEventId, "0.3")).rejects.toThrow(
            "Run spending limit reached",
          );
          await expect(reserve("intake", randomUUID(), "0.5")).rejects.toThrow(
            "Stage spending limit reached",
          );
          await expect(reserve("design", randomUUID(), "0.6")).rejects.toThrow(
            "Task spending limit reached",
          );
          await ledger.release(store.id, reserved.operationKey);
          await expect(
            reserve("intake", randomUUID(), "0.6"),
          ).resolves.toMatchObject({ state: "held" });

          const uncertainMessage = await subject.customerWork.messageFromThread(
            {
              ...input,
              text: "Is the warranty transferable?",
              sourceSystemId: randomUUID(),
            },
          );
          if (!uncertainMessage) {
            throw new Error("Fixture message is not recorded");
          }
          const uncertainRun = await subject.customerWork.pendingForMessage({
            threadId: intake.threadId,
            messageId: uncertainMessage.id,
          });
          if (!uncertainRun) {
            throw new Error("Fixture event is not queued");
          }
          external.mockResolvedValueOnce(
            Response.json(
              {},
              {
                status: 503,
                headers: { "x-request-id": "fixture-unconfirmed" },
              },
            ),
          );
          const uncertain = await worker.dispatch(uncertainRun);
          expect(uncertain.state).toBe("unknown");
          await expect(worker.dispatch(uncertainRun)).resolves.toEqual(
            uncertain,
          );
          const awaiting = (await connections.list(owner.id, store.id))
            .operations;
          const outstanding = awaiting.find(
            ({ operationKey }) => operationKey === `work:${uncertain.id}`,
          );
          expect(outstanding).toMatchObject({
            state: "held",
            providerWork: {
              state: "unknown",
              providerRequestId: "fixture-unconfirmed",
            },
          });
          expect(outstanding?.providerWork?.usd).toBeUndefined();
          expect(
            awaiting.some(
              ({ reservationId }) => reservationId === outstanding?.id,
            ),
          ).toBe(false);
          expect(operationCalls()).toHaveLength(8);

          const competing =
            await subject.module.subjectsToEcommerceModuleProducts.create({
              data: {
                subjectId: otherEmployee.data.id,
                ecommerceModuleProductId: offer.productId,
                variant: "store-expert",
              },
            });
          const assigned = await crm.task.get(scope);
          const activeFunnel = await crm.task.getFunnel(scope);
          const currentStage = activeFunnel.definition.stages.find(
            ({ id }) => id === assigned.stageId,
          )!;
          const suspended = await subject.customerWork.assignStageEmployee(
            assigned,
            currentStage,
          );
          expect(suspended.assigneeId).toBeNull();
          expect(
            await crm.tasksToStages.byOperation(
              assigned.id,
              `release-agent:${assigned.assignmentRevision}`,
            ),
          ).toMatchObject({ kind: "assignment-released", actorKind: "system" });
          await subject.module.subjectsToEcommerceModuleProducts.delete({
            id: competing.id,
          });
          const restored = await subject.customerWork.assignStageEmployee(
            suspended,
            currentStage,
          );
          expect(restored.assigneeId).toBe(assigneeId);
        } finally {
          external.mockRestore();
        }
        throw rollback;
      });
    })
    .catch((error) => {
      if (error !== rollback) {
        throw error;
      }
    });
});
