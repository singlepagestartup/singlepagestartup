import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
const saved = {
  SPS_PROVIDER_SECRET_DIR: process.env.SPS_PROVIDER_SECRET_DIR,
  SPS_PROVIDER_ACTIVE_MASTER_KEY: process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY,
  SPS_PROVIDER_MASTER_KEYS: process.env.SPS_PROVIDER_MASTER_KEYS,
};
let vault: string;

beforeAll(async () => {
  vault = await mkdtemp(join(tmpdir(), "sps-paid-child-"));
  process.env.SPS_PROVIDER_SECRET_DIR = vault;
  process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY = "fixture";
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    fixture: randomBytes(32).toString("base64"),
  });
});

afterAll(async () => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
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

it.each(["openrouter", "openai"] as const)(
  "reserves a separate private JEV step through the configured %s account and publishes one final reply",
  async (provider) => {
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
          const draft = await crm.funnel.saveDraft({
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
                  instruction: "Discuss the requested phone.",
                  operations: ["request-routing"],
                  actions: [],
                },
              ],
            },
          });
          await crm.funnel.publish({
            storeId: store.id,
            funnelId: draft.id,
            expectedRevision: draft.revision,
            actorId: owner.id,
            operationKey: randomUUID(),
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
          if (!task.assigneeId) {
            throw new Error("Fixture has no assistant");
          }
          const assigneeId = task.assigneeId;
          const connections = subject.providerConnections;
          const secret = "customer-qa-fixture-key";
          const connection = await connections.change(owner.id, {
            operation: "connect",
            storeId: store.id,
            provider,
            externalAccount: "isolated-fixture",
            label: "Scenario",
            secret,
          });
          const terms = {
            maxInputTokens: 6000,
            maxOutputTokens: 128,
            maxCostUsd: "0.5",
            inputUsdPerMillion: "2",
            outputUsdPerMillion: "4",
            usdPerSps: "0.01",
            workMultiplier: "1.5",
            version: "qa-v1",
          };
          const assign = (
            capability: "decision" | "text" | "embedding" | "compression",
            model: string,
          ) =>
            connections.change(owner.id, {
              operation: "assign",
              storeId: store.id,
              connectionId: connection.id,
              assistantId: assigneeId,
              capability,
              model,
              terms,
            });
          await assign("text", "configured-chat-model");
          await assign("decision", "unsupported-for-json");
          await subject.customerWork.execute(customer.id, {
            operation: "message",
            storeId: store.id,
            taskId: task.id,
            operationKey: randomUUID(),
            text: "What size is this phone?",
          });
          const message = (await subject.customerWork.listPendingWork()).find(
            (entry) => entry.taskId === task.id,
          );
          if (!message) {
            throw new Error("Fixture event is not queued");
          }
          const external = jest
            .spyOn(globalThis, "fetch")
            .mockImplementation(async (url, options) => {
              expect(String(url)).toBe(
                provider === "openrouter"
                  ? "https://openrouter.ai/api/v1/chat/completions"
                  : "https://api.openai.com/v1/chat/completions",
              );
              expect(new Headers(options?.headers).get("Authorization")).toBe(
                `Bearer ${secret}`,
              );
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
              const decision =
                JSON.parse(content).response_format?.type === "json_object";
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
                  ...(provider === "openrouter" ? { cost: 0.001 } : {}),
                },
              });
            });
          try {
            const run = { ...message, capability: "text" as const };
            await expect(worker.dispatch(run)).rejects.toThrow(
              "does not support",
            );
            expect(external).not.toHaveBeenCalled();
            expect(
              (await connections.list(owner.id, store.id)).operations,
            ).toHaveLength(0);
            await assign(
              "decision",
              provider === "openrouter"
                ? "openai/gpt-4.1-mini"
                : "gpt-4.1-mini",
            );
            const result = await worker.dispatch(run);
            expect(result.state).toBe("delivered");
            await expect(
              createService(createAppAssembly()).dispatch(run),
            ).resolves.toEqual(result);
            expect(external).toHaveBeenCalledTimes(2);
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
                  basis ===
                    (provider === "openrouter" ? "provider" : "rate-card") &&
                  eventId === message.eventId,
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
            const expert = await social.profile.create({
              data: {
                variant: "artificial-intelligence",
                title: { en: "Phone expert" },
              },
            });
            await social.profilesToEcommerceModuleProducts.create({
              data: {
                profileId: expert.id,
                storeId: store.id,
                offerId: offer.id,
                variant: "store-expert",
              },
            });
            await social.profilesToKnowledgeModuleSources.create({
              data: {
                profileId: expert.id,
                storeId: store.id,
                knowledgeModuleSourceId: source.id,
              },
            });
            const indexDraft = await crm.funnel.saveDraft({
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
            await crm.funnel.publish({
              storeId: store.id,
              funnelId: indexDraft.id,
              actorId: owner.id,
              expectedRevision: indexDraft.revision,
              operationKey: randomUUID(),
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
            const model =
              provider === "openrouter"
                ? "openai/text-embedding-3-small"
                : "text-embedding-3-small";
            await assign("embedding", model);
            await expect(
              worker.queueKnowledgeIndex(customer.id, indexScope),
            ).rejects.toThrow("store ownership");
            const queued = await worker.queueKnowledgeIndex(
              owner.id,
              indexScope,
            );
            await expect(
              worker.queueKnowledgeIndex(owner.id, indexScope),
            ).resolves.toEqual(queued);
            const embedding = Array<number>(768).fill(0.3);
            external.mockImplementationOnce(async (url, options) => {
              expect(String(url)).toBe(
                provider === "openrouter"
                  ? "https://openrouter.ai/api/v1/embeddings"
                  : "https://api.openai.com/v1/embeddings",
              );
              expect(new Headers(options?.headers).get("Authorization")).toBe(
                `Bearer ${secret}`,
              );
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
                  ...(provider === "openrouter" ? { cost: 0.0001 } : {}),
                },
              });
            });
            await createService(createAppAssembly()).drainKnowledgeIndex();
            await createService(createAppAssembly()).drainKnowledgeIndex();
            expect(external).toHaveBeenCalledTimes(3);
            const embeddingIndex = `${provider}:${model}:768:v1`;
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
                embeddingIndex: "different-model",
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
              basis: provider === "openrouter" ? "provider" : "rate-card",
            });
            const dialogue = await crm.funnel.saveDraft({
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
                  maxRunAmount: "2",
                },
                stages: [
                  {
                    id: "reply",
                    name: "Reply",
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
            await crm.funnel.publish({
              storeId: store.id,
              funnelId: dialogue.id,
              actorId: owner.id,
              expectedRevision: dialogue.revision,
              operationKey: randomUUID(),
            });
            await assign(
              "compression",
              provider === "openrouter"
                ? "openai/gpt-4.1-mini"
                : "gpt-4.1-mini",
            );
            const followUp = await subject.customerWork.execute(customer.id, {
              operation: "ask",
              storeId: store.id,
              offerId: offer.id,
              productId: product.id,
              operationKey: randomUUID(),
            });
            let triggerId: string | undefined;
            for (let index = 0; index < 9; index += 1) {
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
              const authored = view.messages.find(
                (entry) => entry.body === text,
              );
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
                await crm.taskEvent.byOperation(
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
              ...(provider === "openrouter" ? { cost: 0.0001 } : {}),
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
                expect(body).toContain(
                  "Earlier questions concerned the phone warranty.",
                );
                expect(body).toContain("Store references");
                return resultWith("The battery warranty is included.");
              });
            expect(
              (await worker.dispatch({ ...latest, capability: "text" })).state,
            ).toBe("delivered");
            expect(external).toHaveBeenCalledTimes(7);
            const steps = (
              await connections.list(owner.id, store.id)
            ).operations
              .filter((entry) => entry.taskId === followUp.taskId)
              .flatMap((entry) =>
                entry.providerWork?.stepKey ? [entry.providerWork.stepKey] : [],
              );
            expect(steps.sort()).toEqual([
              "compression",
              "knowledge-search",
              "reply",
              "tool-selection",
            ]);
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
  },
);
