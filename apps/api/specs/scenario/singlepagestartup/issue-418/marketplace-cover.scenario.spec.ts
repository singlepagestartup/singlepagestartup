import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import sharp from "sharp";
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
import { Handler as TypingHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/thread/typing";
import { Service as ChatActions } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/chat/actions";
import { Handler as MessageHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Table as Wallet } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { Table as Task } from "@sps/crm/models/task/backend/repository/database";
import { Table as ThreadMessage } from "@sps/social/relations/threads-to-messages/backend/repository/database";
import { Table as SocialMessage } from "@sps/social/models/message/backend/repository/database";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";

import {
  embeddingResponse,
  useFixtureEmbeddings,
} from "../../test-utils/knowledge-embeddings";

useFixtureEmbeddings();

const rollback = new Error("Remove marketplace cover fixtures");
const previousKey = process.env.OPEN_AI_API_KEY;
const legacyTextModel = "gpt-5.4-mini-2026-03-17";

beforeAll(() => {
  process.env.OPEN_AI_API_KEY = "offline-cover-key";
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

interface ICoverScenario {
  startsInIntake: boolean;
  autoGenerate?: boolean;
  linear?: boolean;
}

async function verifyCover({
  startsInIntake,
  autoGenerate = false,
  linear = false,
}: ICoverScenario) {
  const palette = startsInIntake
    ? "кремовый фон #F4EFDF и тёмно-зелёный акцент #183C32"
    : "кремовый и тёмно-зелёный";
  try {
    await getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const worker = createService(createAppAssembly());
        const { rbac, ecommerce, crm, billing, social, fileStorage } =
          worker.modules;
        const subject = rbac.subject;
        const owner = await subject.create({ data: {} });
        const buyer = await subject.create({ data: {} });
        const stranger = await subject.create({ data: {} });
        const store = await ecommerce.store.create({ data: {} });
        await rbac.subjectsToEcommerceModuleStores.create({
          data: {
            subjectId: owner.id,
            ecommerceModuleStoreId: store.id,
            variant: "owner",
          },
        });
        const credits = await billing.currency.create({
          data: {
            slug: `cover-credits-${randomUUID()}`,
            title: "Cover credits",
            symbol: "SPS",
          },
        });
        await tx.insert(Wallet).values({
          subjectId: owner.id,
          billingModuleCurrencyId: credits.id,
          amount: "100",
        });
        const { product, offer } = await subject.ecommerceCatalog.createOffer({
          subjectId: owner.id,
          data: {
            storeId: store.id,
            product: {
              title: { en: "Commission a cover" },
              kind: "service",
              singleUnitPerOrder: true,
              formula: "unit_price * quantity",
            },
            settings: { standalone: true, requiresResultAcceptance: true },
            prices: [{ currencyId: credits.id, amount: "3" }],
          },
        });
        const offerScope = {
          storeId: store.id,
          productId: product.id,
          offerId: offer.id,
        };
        const selection = { billingModuleCurrencyId: credits.id };
        let existingOrderId: string | undefined;
        if (startsInIntake) {
          const draft = await subject.ecommerceModuleOrderCreate({
            ...offerScope,
            ...selection,
            subjectId: buyer.id,
            quantity: 1,
          });
          existingOrderId = draft.orderId;
          const cart = await subject.ecommerceModuleOrderCartDetails({
            subjectId: buyer.id,
            orderId: existingOrderId,
          });
          expect(cart.work?.state).toBe("discussion-unavailable");
          expect(cart.discussion).toBeUndefined();
        }
        const catalogFact =
          "Стул коллекции «Линия А17» сделан из гнутого ясеня.";
        const composition = "Поставь стул на низкий архитектурный подиум.";
        const route = new Hono();
        const typingPath =
          "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/typing";
        route.post(typingPath, (context) =>
          new TypingHandler(subject).execute(context),
        );

        route.post(
          "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
          (context, next) => new MessageHandler(subject).execute(context, next),
        );
        const create = {
          kind: "create-employee" as const,
          employee: {
            storeId: store.id,
            name: "Дизайнер обложек",
            operationKey: randomUUID(),
          },
        };
        await expect(
          subject.crmWorkspace.execute(stranger.id, create),
        ).rejects.toThrow();
        const created = await subject.crmWorkspace.execute(owner.id, create);
        if (created.kind !== "create-employee") {
          throw new Error("Expected an employee");
        }
        const employee = created.data;
        const employeeId = employee.id;
        if (startsInIntake) {
          expect(await subject.crmWorkspace.execute(owner.id, create)).toEqual(
            created,
          );
          const opened = await subject.crmWorkspace.execute(owner.id, {
            kind: "open-employee-chat",
            employee: { storeId: store.id, subjectId: employee.id },
          });
          expect(opened.data).toEqual(employee);
          const [membership] = await rbac.subjectsToSocialModuleProfiles.find({
            params: {
              filters: {
                and: [
                  { column: "subjectId", method: "eq", value: owner.id },
                  { column: "variant", method: "eq", value: "default" },
                ],
              },
            },
          });
          const form = new FormData();
          form.set(
            "data",
            JSON.stringify({
              sourceSystemId: randomUUID(),
              description: "Запомни: " + catalogFact,
            }),
          );
          const endpoint = `/subjects/${owner.id}/profiles/${membership.socialModuleProfileId}/chats/${employee.chatId}/threads/${employee.threadId}/messages`;
          for (let retry = 0; retry < 2; retry++) {
            const response = await route.request(endpoint, {
              method: "POST",
              body: form,
            });
            if (!response.ok) {
              throw new Error(await response.text());
            }
          }
          const links = await social.profilesToKnowledgeModuleSources.find({
            params: {
              filters: {
                and: [
                  {
                    column: "profileId",
                    method: "eq",
                    value: employee.profileId,
                  },
                ],
              },
            },
          });
          expect(links).toHaveLength(1);
          expect(
            await worker.modules.knowledge.source.findById({
              id: links[0].knowledgeModuleSourceId,
            }),
          ).toMatchObject({ content: expect.stringContaining(catalogFact) });
        }
        const skill = await social.skill.create({
          data: { title: "Предметная съёмка", description: composition },
        });
        await social.profilesToSkills.create({
          data: { profileId: employee.profileId, skillId: skill.id },
        });
        expect(
          (await subject.crmWorkspace.options(owner.id, store.id))
            .skillsByAssignee[employee.id],
        ).toContainEqual({ id: skill.id, title: skill.title });
        const stageFunding = {
          payerSubjectId: owner.id,
          currencyId: credits.id,
          maxStageAmount: "50",
          maxRunAmount: "15",
        };
        const attachmentStages = autoGenerate
          ? (
              [
                {
                  id: "source",
                  name: "Фото товара",
                  role: "product-photo",
                  next: "reference",
                },
                {
                  id: "reference",
                  name: "Референс оформления",
                  role: "style-reference",
                  next: "intake",
                },
              ] as const
            ).map(({ id, name, role, next }) => ({
              id,
              name,
              coverAttachmentRole: role,
              defaultAssigneeSubjectId: employeeId,
              workFunding: stageFunding,
              instruction: "Примите изображение покупателя.",
              actions: [
                {
                  id: "advance",
                  name: "Принять изображение",
                  actors: ["ai" as const],
                  evidence: ["model-result" as const],
                  nextStageId: next,
                },
              ],
            }))
          : [];
        const funnel = await crm.funnel.save({
          storeId: store.id,
          name: "Commissioned cover",
          kind: "individual-service",
          bindings: { offerIds: [offer.id] },
          definition: {
            ...(linear && { progression: "linear" as const }),
            initialStageId:
              attachmentStages[0]?.id ?? (startsInIntake ? "intake" : "design"),
            workFunding: startsInIntake
              ? undefined
              : {
                  payer: "store-owner",
                  currencyId: credits.id,
                  maxTaskAmount: "50",
                  maxRunAmount: "15",
                },
            stages: [
              ...attachmentStages,
              ...(startsInIntake
                ? [
                    {
                      id: "intake",
                      name: "Бриф",
                      workFunding: stageFunding,
                      defaultAssigneeSubjectId: employeeId,
                      instruction:
                        "Поприветствуйте покупателя и уточните детали для обложки.",
                      ...(linear && {
                        evidenceInstruction:
                          "Исполнитель подтвердил получение согласованного размера.",
                      }),
                      actions: [
                        {
                          id: "advance",
                          name: "Показать собранный бриф",
                          actors: ["ai" as const],
                          evidence: ["model-result" as const],
                          nextStageId: "design",
                        },
                      ],
                    },
                  ]
                : []),
              {
                id: "design",
                name: "Обложка",
                workFunding: startsInIntake ? stageFunding : undefined,
                defaultAssigneeSubjectId: employeeId,
                skillIds: [skill.id],
                instruction: "Подготовить обложку товара.",
                output: "image",
                imageBrief: "marketplace-cover",
                ...(autoGenerate && { imageBriefAutoGenerate: true }),
                waiting: startsInIntake
                  ? undefined
                  : {
                      expectedEvent: "message",
                      deadlineSeconds: 900,
                      reminderSeconds: [60, 120],
                      completionEvidence: [],
                    },
                actions: startsInIntake
                  ? []
                  : [
                      {
                        id: "stop-after-message",
                        name: "Закрыть обсуждение",
                        actors: ["human" as const],
                        evidence: ["message" as const],
                        outcome: "closed-without-result" as const,
                      },
                    ],
              },
            ],
          },
        });
        const command = existingOrderId
          ? {
              ...offerScope,
              operation: "open-cart-discussion" as const,
              orderId: existingOrderId,
              operationKey: randomUUID(),
            }
          : {
              ...offerScope,
              operation: "add" as const,
              operationKey: randomUUID(),
              selection,
            };
        // One commissioned result has one order and one discussion, even if a
        // client sends its own quantity instead of using the product form.
        const oversizedKey = randomUUID();
        await expect(
          subject.customerWork.execute(stranger.id, {
            ...offerScope,
            operation: "add",
            operationKey: oversizedKey,
            selection: { ...selection, quantity: 5 },
          }),
        ).rejects.toThrow(/only one unit/);
        const oversizedTasks = await crm.task.find({
          params: {
            filters: {
              and: [
                {
                  column: "openingKey",
                  method: "eq",
                  value: `store-work:${stranger.id}:${oversizedKey}`,
                },
              ],
            },
          },
        });
        expect(oversizedTasks).toHaveLength(0);
        const oversizedOrders = await rbac.subjectsToEcommerceModuleOrders.find(
          {
            params: {
              filters: {
                and: [
                  { column: "subjectId", method: "eq", value: stranger.id },
                ],
              },
            },
          },
        );
        expect(oversizedOrders).toHaveLength(0);
        if (command.operation === "open-cart-discussion") {
          const cart = await subject.ecommerceModuleOrderCartDetails({
            subjectId: buyer.id,
            orderId: command.orderId,
          });
          expect(
            await ecommerce.order.findById({ id: command.orderId }),
          ).toMatchObject({
            type: "cart",
            status: "new",
          });
          expect(cart.work?.state).toBe("requires-discussion");
          await expect(
            subject.customerWork.execute(stranger.id, command),
          ).rejects.toThrow("The selected cart order is unavailable");
        }
        const view = await subject.customerWork.execute(buyer.id, command);
        expect(view.orderId).toBeDefined();
        const threadWork = await subject.customerWork.viewForThread(
          buyer.id,
          view.threadId,
        );
        expect(threadWork.workflow).toEqual({
          title: "Commissioned cover",
          stageTitle:
            attachmentStages[0]?.name ?? (startsInIntake ? "Бриф" : "Обложка"),
        });
        await expect(
          subject.customerWork.viewForThread(stranger.id, view.threadId),
        ).rejects.toThrow("The customer conversation could not be found");
        if (command.operation === "open-cart-discussion") {
          expect(view.orderId).toBe(command.orderId);
          const retry = await subject.customerWork.execute(buyer.id, {
            ...command,
            operationKey: randomUUID(),
          });
          expect(retry.taskId).toBe(view.taskId);
          expect(retry.threadId).toBe(view.threadId);
        }
        const cart = await subject.ecommerceModuleOrderCartDetails({
          subjectId: buyer.id,
          orderId: view.orderId!,
        });
        expect(
          await ecommerce.order.findById({ id: view.orderId! }),
        ).toMatchObject({
          type: "history",
          status: "delivering",
        });
        expect(
          await subject.ecommerceModuleFindOpenCartOrderWithProduct({
            subjectId: buyer.id,
            productId: command.productId,
            offerId: command.offerId,
          }),
        ).toBeFalsy();
        expect(cart.work?.state).toBe("awaiting-result");
        expect(cart.discussion).toEqual({
          storeId: store.id,
          taskId: view.taskId,
          threadId: view.threadId,
          chatId: view.chatId,
        });
        const enter = {
          operation: "enter-order-discussion" as const,
          storeId: store.id,
          taskId: view.taskId,
          orderId: view.orderId!,
          operationKey: randomUUID(),
        };
        await expect(
          subject.customerWork.execute(buyer.id, enter),
        ).resolves.toMatchObject({
          chatId: view.chatId,
          threadId: view.threadId,
        });
        await expect(
          subject.customerWork.execute(stranger.id, enter),
        ).rejects.toThrow();
        const [buyerProfile] = await rbac.subjectsToSocialModuleProfiles.find({
          params: {
            filters: {
              and: [
                { column: "subjectId", method: "eq", value: buyer.id },
                { column: "variant", method: "eq", value: "default" },
              ],
            },
          },
        });
        if (linear) {
          const tabs = [randomUUID(), randomUUID()];
          const change = async (sessionId: string, active: boolean) => {
            const form = new FormData();
            form.set("data", JSON.stringify({ sessionId, active }));
            const response = await route.request(
              `/subjects/${buyer.id}/profiles/${buyerProfile.socialModuleProfileId}/chats/${view.chatId}/threads/${view.threadId}/typing`,
              { method: "POST", body: form },
            );
            if (!response.ok) {
              throw new Error(await response.text());
            }
            const attached = await social.threadsToActions.find({
              params: {
                filters: {
                  and: [
                    { column: "threadId", method: "eq", value: view.threadId },
                  ],
                },
              },
            });
            const records = await Promise.all(
              attached.map((link) =>
                social.action.findById({ id: link.actionId }),
              ),
            );
            return new ChatActions(subject).enrich(
              records.filter(
                (record): record is NonNullable<typeof record> =>
                  record?.variant === "typing",
              ),
            );
          };
          const [first] = await change(tabs[0], true);
          expect(first).toMatchObject({
            variant: "typing",
            actorProfileIds: [buyerProfile.socialModuleProfileId],
            payload: {},
          });
          expect(await change(tabs[1], true)).toHaveLength(1);
          expect(await change(tabs[0], false)).toMatchObject([
            { id: first.id },
          ]);
          expect(await change(tabs[1], false)).toEqual([]);
        }
        let sequence = Date.now();
        const setHistoryTime = async (messageId: string, createdAt: Date) => {
          await tx
            .update(ThreadMessage)
            .set({ createdAt })
            .where(
              and(
                eq(ThreadMessage.threadId, view.threadId),
                eq(ThreadMessage.messageId, messageId),
              ),
            );
        };
        const advanceHistory = (messageId: string) => {
          sequence += 1000;
          return setHistoryTime(messageId, new Date(sequence));
        };
        const post = async (
          text: string,
          file?: File,
          sourceSystemId = randomUUID(),
          metadata?: Record<string, unknown>,
        ) => {
          const form = new FormData();
          form.set(
            "data",
            JSON.stringify({ sourceSystemId, description: text, metadata }),
          );
          if (file) {
            form.append("files", file);
          }
          const response = await route.request(
            `/subjects/${buyer.id}/profiles/${buyerProfile.socialModuleProfileId}/chats/${view.chatId}/threads/${view.threadId}/messages`,
            { method: "POST", body: form },
          );
          expect(response.status).toBe(200);
          const { data: message }: { data: IChatMessage } =
            await response.json();
          await advanceHistory(message.id);
          return message;
        };
        const pending = async (message: IChatMessage) => {
          const request = await subject.customerWork.pendingForMessage({
            threadId: view.threadId,
            messageId: message.id,
          });
          if (!request) {
            throw new Error("The buyer message did not queue work");
          }
          return request;
        };
        const taskWork = async () =>
          (await subject.customerWork.listPendingWork()).filter(
            ({ taskId }) => taskId === view.taskId,
          );
        const dispatchRequest = async (
          request: NonNullable<Awaited<ReturnType<typeof pending>>>,
        ) => {
          const result = await worker.dispatch(request);
          const [reply] = await social.message.find({
            params: {
              filters: {
                and: [
                  {
                    column: "workReplyKey",
                    method: "eq",
                    value: `attempt:${result.id}`,
                  },
                ],
              },
            },
          });
          if (!reply) {
            await Promise.all(network.mock.results.map(({ value }) => value));
            throw new Error(`The worker did not reply (${result.state})`);
          }
          await advanceHistory(reply.id);
          await subject.customerWork.ack(request);
          return { ...result, reply, request };
        };
        const dispatch = async (message: IChatMessage) => ({
          ...(await dispatchRequest(await pending(message))),
          message,
        });
        const dispatchEntry = async () => {
          const [request] = await taskWork();
          expect(request).toBeDefined();
          const event = await crm.tasksToStages.findById({
            id: request.eventId,
          });
          expect(event).toMatchObject({ kind: "stage-entry" });
          expect(event!.detail.messageId).toBeUndefined();
          return dispatchRequest(request);
        };
        const submit = async (text: string, file?: File) => {
          const message = await post(text, file);
          return dispatch(message);
        };

        const pixels = await sharp({
          create: {
            width: 140,
            height: 100,
            channels: 3,
            background: "#c25727",
          },
        })
          .png()
          .toBuffer();
        const font = await readFile(
          "apps/studio/runtime/assets/fonts/Onest-wght.ttf",
        );
        const mockBackground = await sharp({
          create: {
            width: 864,
            height: 1152,
            channels: 3,
            background: "#284c36",
          },
        })
          .png()
          .toBuffer();
        const url = "https://api.openai.com/v1/images/edits";
        const receipts = () =>
          billing.transaction.find({
            params: {
              filters: {
                and: [{ column: "taskId", method: "eq", value: view.taskId }],
              },
            },
          });
        let backgroundsSent = 0;
        let intakeCalls = 0;
        const reviewed = new Array<{
          text: string;
          decision: "generate" | "wait";
        }>();
        const finalTitle = "Стул Берёза";
        const moreInput = "Фон: нейтральный бежевый";
        let previousIntakeReply: string | undefined;
        let beforeIntakeResponse: (() => Promise<void>) | undefined;
        const network = jest
          .spyOn(globalThis, "fetch")
          .mockImplementation(async (destination, init) => {
            if (String(destination).endsWith("/embeddings")) {
              return embeddingResponse(destination, init);
            }
            expect(
              new Headers(init?.headers).get("Authorization") ===
                "Bearer offline-cover-key",
            ).toBe(true);
            if (String(destination).endsWith("/responses/input_tokens")) {
              return Response.json({
                object: "response.input_tokens",
                input_tokens: 600,
              });
            }
            if (
              startsInIntake &&
              String(destination) === "https://api.openai.com/v1/responses"
            ) {
              const body = JSON.parse(String(init?.body));
              const current = body.input.at(-1);
              expect(current.role).toBe("user");
              const file = current.content[1];
              expect(["input_image", "input_file"]).toContain(file.type);
              expect(body.input[0].role).toBe("system");
              const collection = attachmentStages.some(({ id }) =>
                body.input[0].content.includes(`currently in stage "${id}"`),
              );
              let decision;
              if (collection) {
                expect(file.type).toBe("input_image");
                decision = {
                  kind: "advance",
                  actionId: "advance",
                  reply: "Изображение получено.",
                };
              } else {
                intakeCalls++;
                previousIntakeReply = `Уточняю детали. Ответ ${intakeCalls}.`;
                decision = {
                  kind: "clarify",
                  clarification: previousIntakeReply,
                };
              }
              return Response.json({
                id: randomUUID(),
                status: "completed",
                output: [
                  {
                    type: "message",
                    content: [
                      {
                        type: "output_text",
                        text: JSON.stringify({ decision }),
                      },
                    ],
                  },
                ],
                usage: { input_tokens: 60, output_tokens: 20 },
              });
            }
            if (
              startsInIntake &&
              String(destination) ===
                "https://api.openai.com/v1/chat/completions"
            ) {
              const body = JSON.parse(String(init?.body));
              if (
                body.messages.some(
                  (message: { role: string; content: string }) =>
                    message.role === "system" &&
                    message.content.includes(
                      "The assigned stage has just started",
                    ),
                )
              ) {
                const first = body.messages[0].content.includes(
                  'currently in stage "intake"',
                );
                if (first) {
                  expect(body.messages[0].content).toContain(
                    "Поприветствуйте покупателя",
                  );
                }
                const greeting = "Здравствуйте! Какие детали нужно учесть?";
                return Response.json({
                  id: randomUUID(),
                  choices: [
                    {
                      message: {
                        content: linear
                          ? greeting
                          : JSON.stringify({
                              decision: {
                                kind: "clarify",
                                clarification: greeting,
                              },
                            }),
                      },
                    },
                  ],
                  usage: { prompt_tokens: 30, completion_tokens: 5 },
                });
              }
              if (linear) {
                const checking = body.messages[0].content.startsWith(
                  "Decide whether the current CRM stage condition",
                );
                let text = "Уточните размер.";
                if (checking) {
                  const latest = JSON.parse(body.messages.at(-1).content).at(
                    -1,
                  );
                  text = JSON.stringify({
                    complete:
                      latest.speaker === "employee" &&
                      latest.text === "Размер подтверждён.",
                  });
                }
                return Response.json({
                  id: randomUUID(),
                  choices: [{ message: { content: text } }],
                  usage: { prompt_tokens: 30, completion_tokens: 5 },
                });
              }
              if (
                attachmentStages.some(({ id }) =>
                  body.messages[0]?.content.includes(
                    `currently in stage "${id}"`,
                  ),
                )
              ) {
                return Response.json({
                  id: "cover-upload-" + body.messages.at(-1).content,
                  choices: [
                    {
                      message: {
                        content: JSON.stringify({
                          decision: {
                            kind: "advance",
                            actionId: "advance",
                            reply: "Изображение получено.",
                          },
                        }),
                      },
                    },
                  ],
                  usage: { prompt_tokens: 25, completion_tokens: 20 },
                });
              }
              if (
                autoGenerate &&
                body.messages[0]?.content.startsWith(
                  "Review a complete marketplace cover brief",
                )
              ) {
                expect(body.model).toBe("gpt-4.1-mini");
                expect(body).not.toHaveProperty("reasoning_effort");
                const input = JSON.parse(body.messages.at(-1).content);
                const text = input.latestParticipantText;
                if (input.replyOnly) {
                  expect(text).toBe("Результат принимаю");
                  expect(input.hasPreview).toBe(true);
                  expect(input.conversation).toContainEqual({
                    role: "user",
                    content: "[Store staff] Результат принимаю",
                  });
                  return Response.json({
                    id: "fixture-cover-staff-acceptance",
                    choices: [
                      {
                        message: {
                          content: JSON.stringify({
                            decision: "wait",
                            reply: "Покупатель может принять файл под превью.",
                          }),
                        },
                      },
                    ],
                    usage: { prompt_tokens: 25, completion_tokens: 8 },
                  });
                }
                expect(input).toMatchObject({
                  size: { width: 1200, height: 1600 },
                  caption: "Стул Берёза",
                  triggerHasFiles: false,
                });
                expect([finalTitle, moreInput]).toContain(text);
                const decision = text === finalTitle ? "generate" : "wait";
                const result =
                  decision === "wait"
                    ? {
                        decision,
                        reply: "Поясните, какую деталь обложки уточнить?",
                      }
                    : { decision };
                expect(input.hasPreview).toBe(decision === "wait");
                reviewed.push({ text, decision });
                return Response.json({
                  id: `fixture-cover-review-${reviewed.length}`,
                  choices: [{ message: { content: JSON.stringify(result) } }],
                  usage: { prompt_tokens: 25, completion_tokens: 5 },
                });
              }
              // The buyer never supplied this catalog fact. It must come from the trained employee.
              expect(JSON.stringify(body.messages)).toContain(catalogFact);
              expect(JSON.stringify(body.messages)).not.toContain(composition);
              intakeCalls += 1;
              const readinessMessage = autoGenerate
                ? finalTitle
                : "Формат: 3:4";
              const latest = body.messages.at(-1)?.content;
              const ready = latest === readinessMessage;
              const selectedLegacy =
                !autoGenerate &&
                (ready || latest === "Первая деталь для брифа");
              if (selectedLegacy) {
                expect(body.model).toBe(legacyTextModel);
                if (ready) {
                  expect(body.reasoning_effort).toBe("high");
                }
              } else {
                expect(body).toMatchObject({
                  model: "gpt-6.2-astra",
                  reasoning_effort: "high",
                });
              }
              expect(body.messages[0].content).toContain(
                'Set decision.kind to "advance"',
              );
              expect(body.response_format.type).toBe("json_schema");
              if (previousIntakeReply) {
                expect(body.messages).toContainEqual({
                  role: "assistant",
                  content: previousIntakeReply,
                });
              }
              const result = {
                decision: ready
                  ? {
                      kind: "advance",
                      actionId: "advance",
                      reply: "Непривязанный ответ модели",
                    }
                  : {
                      kind: "clarify",
                      clarification: `Уточняю детали. Ответ ${intakeCalls}.`,
                    },
              };
              if (beforeIntakeResponse) {
                const operation = beforeIntakeResponse;
                beforeIntakeResponse = undefined;
                await operation();
              } else if (!ready) {
                previousIntakeReply = `Уточняю детали. Ответ ${intakeCalls}.`;
              }
              return Response.json({
                id: `cover-intake-${intakeCalls}`,
                choices: [{ message: { content: JSON.stringify(result) } }],
                usage: {
                  prompt_tokens: 25,
                  completion_tokens: 20,
                },
              });
            }
            expect(String(destination)).toBe(url);
            backgroundsSent += 1;
            expect(init?.body).toBeInstanceOf(FormData);
            const form = init?.body as FormData;
            expect(form.get("size")).toBe("864x1152");
            const images = form.getAll("image[]");
            const source = images[0] as File;
            if (autoGenerate) {
              expect(images.map((image) => (image as File).name)).toEqual([
                "product-photo.jpg",
                "style-reference.jpg",
                "caption-font.jpg",
              ]);
              const reference = images[1] as File;
              expect(
                await sharp(
                  Buffer.from(await reference.arrayBuffer()),
                ).metadata(),
              ).toMatchObject({ width: 90, height: 130 });
            } else {
              expect(images).toHaveLength(1);
              expect(source.name).toBe("source.jpg");
            }
            expect(source.type).toBe("image/jpeg");
            expect(
              await sharp(Buffer.from(await source.arrayBuffer())).metadata(),
            ).toMatchObject({ width: 140, height: 100 });
            const prompt = String(form.get("prompt"));
            if (autoGenerate) {
              expect(prompt).toContain("sole visual source for the product");
              expect(prompt).toContain("style-reference.jpg");
              expect(prompt).toMatch(
                /do not copy its product, words, numbers/i,
              );
            } else {
              expect(prompt).toMatch(
                /(?:product reference|reference product|source product)/i,
              );
              expect(prompt).toMatch(/(?:silhouette|shape|outline)/i);
            }
            expect(prompt).toMatch(/proportions/i);
            expect(prompt).toMatch(/(?:materials?|textures?)/i);
            expect(prompt).toMatch(/(?:preserv|retain|keep)/i);
            expect(prompt).toMatch(/(?:margin|central|safe area|edge)/i);
            expect(prompt).toMatch(/(?:fully|wholly|complete|uncropped)/i);
            if (autoGenerate) {
              expect(prompt).not.toContain(composition);
            } else if (startsInIntake) {
              expect(prompt).toContain(catalogFact);
              expect(prompt).toContain(composition);
            }
            const imageReservations = (await receipts()).filter(
              (receipt) =>
                receipt.providerWork?.model ===
                "gpt-image-2.5-flare-2026-09-08",
            );
            expect(imageReservations.at(-1)).toMatchObject({
              kind: "reserve",
              state: "held",
            });
            expect(
              (await receipts()).some(
                (receipt) =>
                  receipt.reservationId === imageReservations.at(-1)?.id,
              ),
            ).toBe(false);
            expect(prompt).toContain("1200×1600");
            expect(prompt).toContain("чистый студийный");
            expect(prompt).toContain(palette);
            expect(prompt).toContain("мягкая тень у стула");
            expect(prompt).toContain("Оставьте внизу место для подписи.");
            expect(prompt).toContain("минимализм");
            if (autoGenerate) {
              expect(prompt).toContain("Стул Берёза");
            } else {
              expect(prompt).not.toContain("Стул Берёза");
            }
            expect(prompt).not.toMatch(
              /Фото стула|buyer-font|offline-cover-key|data:image|"b64_json"\s*:/,
            );
            const usage = {
              input_tokens: 30,
              output_tokens: 20,
              input_tokens_details: { text_tokens: 10, image_tokens: 20 },
            };
            return Response.json({
              id: "fixture-cover-request",
              usage,
              data: [{ b64_json: mockBackground.toString("base64") }],
            });
          });
        try {
          const [opening] = await taskWork();
          const entry = await crm.tasksToStages.findById({
            id: opening.eventId,
          });
          const actionId = entry?.detail.replyActionId;
          expect(actionId).toBeTruthy();
          expect(await social.action.findById({ id: actionId! })).toMatchObject(
            {
              variant: "ai-execution",
              payload: { phase: "reply_generation", status: "running" },
            },
          );
          expect(
            await social.threadsToActions.find({
              params: {
                filters: {
                  and: [
                    { column: "threadId", method: "eq", value: view.threadId },
                    { column: "actionId", method: "eq", value: actionId! },
                  ],
                },
              },
            }),
          ).toHaveLength(1);
          const greeting = await dispatchEntry();
          await expect(worker.dispatch(greeting.request)).resolves.toEqual({
            id: greeting.id,
            state: "delivered",
          });
          const active = await crm.task.get({
            storeId: store.id,
            taskId: view.taskId,
          });
          expect(
            await subject.customerWork.queueStageEntry(active),
          ).toBeUndefined();
          const reopened = await subject.customerWork.viewForThread(
            buyer.id,
            view.threadId,
          );
          expect(
            reopened.messages.filter(
              ({ body }) => body === greeting.reply.description,
            ),
          ).toHaveLength(1);
          expect(await social.action.findById({ id: actionId! })).toBeFalsy();
          if (startsInIntake) {
            expect(greeting.reply.description).toContain("Здравствуйте");
          }
          if (linear) {
            const [openingCheck] = await taskWork();
            expect(openingCheck).toMatchObject({ purpose: "stage-check" });
            await worker.dispatch(openingCheck);
            const scope = { storeId: store.id, taskId: view.taskId };
            const initial = await crm.task.get(scope);
            await expect(
              crm.task.transition({
                ...scope,
                actorId: employeeId,
                actorKind: "ai",
                expectedRevision: initial.revision,
                expectedAssignmentRevision: initial.assignmentRevision,
                actionId: "advance",
                operationKey: randomUUID(),
                evidence: { kind: "model-result", resultId: randomUUID() },
              }),
            ).rejects.toThrow("requires the current message's stage check");
            await submit("Какой нужен размер?");
            for (let index = 0; index < 2; index += 1) {
              const [check] = await taskWork();
              expect(check).toMatchObject({ purpose: "stage-check" });
              await expect(worker.dispatch(check)).resolves.toMatchObject({
                state: "delivered",
              });
              expect((await crm.task.get(scope)).stageId).toBe("intake");
            }
            expect(await taskWork()).toHaveLength(0);
            const writeStaff = async (text: string) => {
              const message = await subject.crmWorkspace.send(
                owner.id,
                { ...scope, chatId: view.chatId, threadId: view.threadId },
                { operationKey: randomUUID(), text },
              );
              await advanceHistory(message.id);
              const reply = await subject.customerWork.pendingForMessage({
                messageId: message.id,
                threadId: view.threadId,
              });
              expect(reply).toBeTruthy();
              await subject.customerWork.ack(reply!);
            };
            await writeStaff("Размер подтверждён.");
            await writeStaff("Исправление: размер ещё нужно проверить.");
            for (let index = 0; index < 2; index += 1) {
              const [outdated] = await taskWork();
              await worker.dispatch(outdated);
              expect((await crm.task.get(scope)).stageId).toBe("intake");
            }
            await writeStaff("Размер подтверждён.");
            const [check] = await taskWork();
            expect(check).toMatchObject({ purpose: "stage-check" });
            const checked = await worker.dispatch(check);
            expect(checked.state).toBe("delivered");
            const next = await crm.task.get(scope);
            expect(next.stageId).toBe("design");
            expect(await worker.dispatch(check)).toEqual(checked);
            expect((await crm.task.get(scope)).revision).toBe(next.revision);
            expect(await crm.tasksToStages.stageStates(next.id)).toMatchObject({
              intake: "completed",
              design: "current",
            });
            const secondEntry = await dispatchEntry();
            expect(secondEntry.reply.description).toBeTruthy();
            expect(secondEntry.request.eventId).not.toBe(
              greeting.request.eventId,
            );
            expect(await taskWork()).toHaveLength(0);
            expect(await receipts()).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  providerWork: expect.objectContaining({
                    stepKey: "stage-check",
                  }),
                }),
              ]),
            );
            throw rollback;
          }
          if (autoGenerate) {
            const referencePixels = await sharp({
              create: {
                width: 90,
                height: 130,
                channels: 3,
                background: "#345588",
              },
            })
              .png()
              .toBuffer();
            for (const [text, file] of [
              [
                "Фото товара",
                new File([new Uint8Array(pixels)], "Фото стула.png", {
                  type: "image/png",
                }),
              ],
              [
                "Референс оформления",
                new File([new Uint8Array(referencePixels)], "Оформление.png", {
                  type: "image/png",
                }),
              ],
              [
                "",
                new File([new Uint8Array(font)], "buyer-font.ttf", {
                  type: "font/ttf",
                }),
              ],
              ["Формат: 3:4", undefined],
              ["Фон: чистый студийный", undefined],
              [
                `Цвета: ${palette}. Основной текст тоже тёмно-зелёный.`,
                undefined,
              ],
              ["Что изобразить: мягкая тень у стула", undefined],
              ["Оставьте внизу место для подписи.", undefined],
              ["Стиль: минимализм", undefined],
            ] as const) {
              await submit(text, file);
              if ((await taskWork()).length) {
                await dispatchEntry();
              }
            }
            expect(await taskWork()).toEqual([]);
            expect(reviewed).toEqual([]);
            expect(backgroundsSent).toBe(0);
            const id = view.orderId!;
            const scope = { storeId: store.id, taskId: view.taskId };
            expect((await ecommerce.order.work.findByOrder(id))?.files).toEqual(
              [],
            );

            const title = await post(finalTitle);
            const intakeRequest = await pending(title);
            expect(await taskWork()).toEqual([intakeRequest]);
            const intakeResult = await worker.dispatch(intakeRequest);
            expect(intakeResult.state).toBe("delivered");
            expect((await crm.task.get(scope)).stageId).toBe("design");

            const [imageRequest] = await taskWork();
            expect(imageRequest.eventId).not.toBe(intakeRequest.eventId);
            expect(await taskWork()).toEqual([imageRequest]);
            const resumed = await crm.tasksToStages.findById({
              id: imageRequest.eventId,
            });
            expect(resumed).toMatchObject({
              kind: "stage-entry",
              operationKey: expect.stringMatching(/^stage-entry:/),
              detail: { stageId: "design" },
            });

            const generated = await dispatchEntry();
            expect(generated.state).toBe("delivered");
            expect(generated.reply.description).toContain("Предпросмотр готов");
            expect(generated.reply.description).not.toContain("Генерируй");
            expect(reviewed).toEqual([
              { text: finalTitle, decision: "generate" },
            ]);
            expect(backgroundsSent).toBe(1);
            expect(await taskWork()).toEqual([]);
            const work = await ecommerce.order.work.findByOrder(id);
            expect(work?.files).toHaveLength(1);
            expect(generated.reply.metadata).toMatchObject({
              orderResultFileId: work?.files[0].id,
            });
            const paidReview = (await receipts()).find(
              (receipt) =>
                receipt.kind === "reserve" &&
                receipt.providerWork?.eventId === imageRequest.eventId &&
                receipt.providerWork.stepKey === "request-routing",
            );
            expect(paidReview).toMatchObject({
              state: "settled",
              senderId: owner.id,
              recipientId: employeeId,
              providerWork: { providerRequestId: "fixture-cover-review-1" },
            });
            const decisionTransfer = (await receipts()).find(
              (receipt) => receipt.reservationId === paidReview?.id,
            );
            expect(decisionTransfer).toMatchObject({ state: "posted" });
            expect(Number(decisionTransfer?.amount)).toBeGreaterThan(0);
            const attempt = await worker.findById({ id: generated.id });
            expect(attempt).toMatchObject({
              eventId: imageRequest.eventId,
              capability: "image",
              model: "gpt-image-2.5-flare-2026-09-08",
            });
            await expect(worker.dispatch(imageRequest)).resolves.toEqual({
              id: generated.id,
              state: "delivered",
            });
            expect(reviewed).toHaveLength(1);
            expect(backgroundsSent).toBe(1);

            const laterMessage = await post(moreInput);
            const laterRequest = await pending(laterMessage);
            const waited = await worker.dispatch(laterRequest);
            expect(await worker.findById({ id: waited.id })).toMatchObject({
              capability: "decision",
              stepKey: "request-routing",
              eventId: laterRequest.eventId,
              result: {
                text: JSON.stringify({
                  decision: "wait",
                  reply: "Поясните, какую деталь обложки уточнить?",
                }),
              },
            });
            const shared = await subject.crmWorkspace.thread(owner.id, {
              ...scope,
              chatId: view.chatId,
              threadId: view.threadId,
            });
            expect(
              shared.messages.some(
                ({ description }) =>
                  description === "Поясните, какую деталь обложки уточнить?",
              ),
            ).toBe(true);
            expect(reviewed.at(-1)).toEqual({
              text: moreInput,
              decision: "wait",
            });
            expect(backgroundsSent).toBe(1);

            const staffAcceptance = await subject.crmWorkspace.send(
              owner.id,
              { ...scope, chatId: view.chatId, threadId: view.threadId },
              { operationKey: randomUUID(), text: "Результат принимаю" },
            );
            await advanceHistory(staffAcceptance.id);
            const answered = await dispatch(staffAcceptance);
            expect(answered.reply.description).toBe(
              "Покупатель может принять файл под превью.",
            );
            expect(
              (await ecommerce.order.work.findByOrder(id))?.acceptedFileId,
            ).toBeNull();
            expect(backgroundsSent).toBe(1);

            const paused = await submit("Пока не рисуй");
            expect(paused.reply.description).toContain("генерацию на паузу");
            expect(reviewed).toHaveLength(2);
            expect(backgroundsSent).toBe(1);
            expect((await ecommerce.order.work.findByOrder(id))?.files).toEqual(
              work?.files,
            );
            expect(await taskWork()).toEqual([]);
            throw rollback;
          }
          if (!startsInIntake) {
            const scope = { storeId: store.id, taskId: view.taskId };
            const opening = await crm.task.get(scope);
            const forceReminder = async () => {
              await tx
                .update(Task)
                .set({ nextActionAt: new Date(0) })
                .where(eq(Task.id, view.taskId));
              const scheduled = await crm.task.get(scope);
              const timer = { ...scope, timerKey: scheduled.timer!.key };
              const result = await crm.task.applyTimer(timer, (event) =>
                subject.customerWork.deliverReminder({
                  ...scope,
                  eventId: event.id,
                }),
              );
              expect(result).toMatchObject({
                applied: true,
                event: { kind: "reminder-due" },
                task: { status: "waiting" },
              });
              expect(result.task.timer?.key).not.toBe(timer.timerKey);
              expect((await crm.task.applyTimer(timer)).applied).toBe(false);
              return result;
            };
            await subject.crmWorkspace.execute(owner.id, {
              kind: "assign",
              assignment: {
                ...scope,
                expectedRevision: opening.revision,
                operationKey: randomUUID(),
                assigneeId: owner.id,
              },
            });
            const managed = await forceReminder();
            expect(managed.task.timer).toMatchObject({
              kind: "reminder",
              number: 2,
            });
            expect(
              (
                await subject.customerWork.viewForThread(
                  buyer.id,
                  view.threadId,
                )
              ).messages,
            ).toHaveLength(1);
            await subject.crmWorkspace.execute(owner.id, {
              kind: "assign",
              assignment: {
                ...scope,
                expectedRevision: managed.task.revision,
                operationKey: randomUUID(),
                assigneeId: opening.assigneeId!,
              },
            });
            const assisted = await forceReminder();
            expect(assisted.task.timer?.kind).toBe("deadline");
            expect(
              (
                await subject.customerWork.viewForThread(
                  buyer.id,
                  view.threadId,
                )
              ).messages,
            ).toEqual(
              expect.arrayContaining([
                expect.objectContaining({ body: greeting.reply.description }),
                expect.objectContaining({
                  author: "Дизайнер обложек",
                  kind: "operator",
                  body: expect.stringContaining(
                    "проверьте последнее обращение",
                  ),
                }),
              ]),
            );
          }
          if (startsInIntake) {
            const scope = { storeId: store.id, taskId: view.taskId };
            const metadata = {
              provider: { modelId: legacyTextModel },
              rbacAiReactionRequest: {
                version: 1,
                modelId: "auto",
                reasoning: "low",
                skillIds: [],
                useKnowledgeSearch: false,
              },
            };
            const key = randomUUID();
            const first = await post(
              "Первая деталь для брифа",
              undefined,
              key,
              metadata,
            );
            expect(first.metadata).toMatchObject(metadata);
            expect((await crm.task.get(scope)).assigneeId).toBe(employeeId);
            const retry = await post(
              "Первая деталь для брифа",
              undefined,
              key,
              metadata,
            );
            expect(retry.id).toBe(first.id);
            const second = await post("Вторая деталь для брифа");
            await setHistoryTime(second.id, new Date(0));
            const queued = await taskWork();
            expect(queued).toHaveLength(1);
            expect(queued[0]).toEqual(
              await subject.customerWork.pendingForMessage({
                threadId: view.threadId,
                messageId: first.id,
              }),
            );
            const firstContext = await subject.customerWork.contextForRun(
              queued[0],
            );
            expect(
              firstContext.messages.map(({ content }) => content),
            ).not.toContain("Вторая деталь для брифа");
            const firstReply = await dispatch(first);
            expect(await taskWork()).toHaveLength(1);
            const sameTime = new Date(0);
            await setHistoryTime(first.id, sameTime);
            const [next] = await taskWork();
            const secondContext =
              await subject.customerWork.contextForRun(next);
            expect(
              secondContext.messages.slice(-3).map(({ content }) => content),
            ).toEqual([
              "Первая деталь для брифа",
              firstReply.reply.description,
              "Вторая деталь для брифа",
            ]);
            await advanceHistory(first.id);
            await advanceHistory(firstReply.reply.id);
            await advanceHistory(second.id);
            expect(intakeCalls).toBe(1);
            expect(await worker.dispatch(firstReply.request)).toEqual({
              id: firstReply.id,
              state: "delivered",
            });
            expect(intakeCalls).toBe(1);
            await dispatch(second);
            expect(await taskWork()).toHaveLength(0);
            expect(intakeCalls).toBe(2);

            const oldMessage = await post("Сообщение перед передачей задачи");
            const oldWork = await taskWork();
            expect(oldWork).toHaveLength(1);
            let duringHandoff: IChatMessage | undefined;
            beforeIntakeResponse = async () => {
              const task = await crm.task.get(scope);
              await subject.crmWorkspace.execute(owner.id, {
                kind: "assign",
                assignment: {
                  ...scope,
                  expectedRevision: task.revision,
                  operationKey: randomUUID(),
                  assigneeId: owner.id,
                },
              });
              duringHandoff = await post("Сообщение для менеджера");
            };
            const stale = await worker.dispatch(oldWork[0]);
            expect(stale.state).toBe("stale");
            expect(await taskWork()).toHaveLength(0);
            expect(
              (
                await subject.customerWork.viewForThread(
                  buyer.id,
                  view.threadId,
                )
              ).messages.some(
                ({ body }) => body === "Уточняю детали. Ответ 3.",
              ),
            ).toBe(false);
            for (const message of [oldMessage, duringHandoff!]) {
              await expect(
                subject.customerWork.pendingForMessage({
                  threadId: view.threadId,
                  messageId: message.id,
                }),
              ).resolves.toBeNull();
            }

            const managed = await subject.crmWorkspace.detail(owner.id, scope);
            expect(managed.task.assigneeKind).toBe("human");
            expect(managed.assignmentCandidates).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  id: oldWork[0].assigneeId,
                  kind: "ai",
                }),
              ]),
            );
            await subject.crmWorkspace.execute(owner.id, {
              kind: "assign",
              assignment: {
                ...scope,
                expectedRevision: managed.task.revision,
                operationKey: randomUUID(),
                assigneeId: oldWork[0].assigneeId,
              },
            });
            if (!duringHandoff) {
              throw new Error("Expected the message from the buyer");
            }
            await dispatch(duringHandoff);
            expect(await taskWork()).toHaveLength(0);
            expect(intakeCalls).toBe(4);
          }
          const originalPhoto = new File(
            [new Uint8Array(pixels)],
            "Фото стула.png",
            { type: "image/png" },
          );
          const photoReply = await submit("Фото товара", originalPhoto);
          if (startsInIntake) {
            // Replies persisted before the event metadata remain visible on the next turn.
            const legacy = { ...photoReply.reply.metadata };
            delete legacy.customerWorkReplyEvent;
            await tx
              .update(SocialMessage)
              .set({ metadata: legacy })
              .where(eq(SocialMessage.id, photoReply.reply.id));
          }
          await submit("Фон: чистый студийный\nФормат 3:4");
          await submit(
            startsInIntake
              ? `Цвета: ${palette}. Основной текст тоже тёмно-зелёный.`
              : palette,
          );
          await submit("Что изобразить: мягкая тень у стула");
          await submit("Оставьте внизу место для подписи.");
          await submit("Стиль: минимализм");
          await submit("Стул Берёза");
          const invalid = await submit(
            "Прилагаю шрифт",
            new File(["not a font"], "pretend.ttf"),
          );
          if (!startsInIntake) {
            expect(invalid.reply.description).toContain(
              "Пришлите файл TTF или OTF",
            );
          }
          const fontReply = await submit(
            "",
            new File([new Uint8Array(font)], "buyer-font.ttf", {
              type: "font/ttf",
            }),
          );
          let previewRequest: Awaited<ReturnType<typeof dispatchRequest>> =
            fontReply;
          if (startsInIntake) {
            expect(intakeCalls).toBeGreaterThan(0);
            const selectedScope = await subject.customerWork.contextForRun(
              fontReply.request,
            );
            const upload = selectedScope.messages.at(-1)!;
            expect(upload.role).toBe("user");
            expect(upload.content).toContain('"name":"buyer-font.ttf"');
            expect(upload.content).toContain('"mimeType":"font/ttf"');
            expect(upload.content).not.toContain(
              fontReply.message.privateAttachments![0].id,
            );
            const photo = selectedScope.messages.find(({ content }) =>
              content.includes("Фото стула.png"),
            );
            expect(photo).toMatchObject({ role: "user" });
            expect(photo?.content).toContain('"mimeType":"image/png"');

            // The causal event cutoff is authoritative even if placement timestamps tie or drift.
            await setHistoryTime(fontReply.reply.id, new Date(0));

            const replay = await subject.customerWork.contextForRun(
              fontReply.request,
            );
            expect(replay.messages).toEqual(selectedScope.messages);
            await advanceHistory(fontReply.reply.id);
            await dispatch(
              await post("Формат: 3:4", undefined, randomUUID(), {
                provider: { modelId: legacyTextModel, reasoning: "high" },
              }),
            );
            expect(
              (await crm.task.get({ storeId: store.id, taskId: view.taskId }))
                .stageId,
            ).toBe("design");
            previewRequest = await dispatchEntry();
          }
          expect(previewRequest.reply.description).toMatch(
            /1200×1600[\s\S]*Стул Берёза[\s\S]*Генерируй/,
          );
          expect(previewRequest.reply.description).toContain(
            `Цвета — ${palette}`,
          );
          expect(previewRequest.reply.description).toContain(
            "Композиция — мягкая тень у стула",
          );
          expect(previewRequest.reply.description).toContain(
            "Стиль — минимализм",
          );
          expect(previewRequest.reply.description).toContain(
            "Оставьте внизу место для подписи.",
          );
          if (startsInIntake) {
            expect(previewRequest.reply.description).toContain(
              "Цвет текста — #183C32.",
            );
          } else {
            expect(previewRequest.reply.description).not.toContain(
              "Цвет текста —",
            );
          }
          await submit("Не генерируй пока");
          expect(backgroundsSent).toBe(0);
          const approval = await submit("Генерируй");
          expect(approval.state).toBe("delivered");
          expect(backgroundsSent).toBe(1);
          const attempt = await worker.findById({ id: approval.id });
          expect(attempt).toMatchObject({
            provider: "openai",
            providerMode: "server",
            payerId: owner.id,
            stageId: "design",
            connectionId: null,
            identityId: null,
            executorId: null,
            expenseReceiptId: null,
          });
          const operations = await receipts();
          const reservation = operations.find(
            (receipt) => receipt.operationKey === `work:${approval.id}`,
          );
          expect(reservation).toMatchObject({
            senderId: owner.id,
            recipientId: attempt?.assigneeId,
            state: "settled",
            providerWork: {
              usd: "0.00081",
              providerRequestId: "fixture-cover-request",
            },
          });
          const transfers = operations.filter(
            (receipt) => receipt.reservationId === reservation?.id,
          );
          expect(transfers).toHaveLength(1);
          expect(transfers[0]).toMatchObject({
            id: attempt?.workReceiptId,
            senderId: owner.id,
            recipientId: attempt?.assigneeId,
            state: "posted",
            amount: "0.016200000000",
          });

          const work = await ecommerce.order.work.findByOrder(view.orderId!);
          expect(work?.files).toHaveLength(1);
          const [version] = work!.files;
          expect(approval.reply.metadata).toMatchObject({
            orderResultFileId: version.id,
          });
          expect(approval.reply.description).toContain("Предпросмотр готов");
          await expect(worker.dispatch(approval.request)).resolves.toEqual({
            id: approval.id,
            state: "delivered",
          });
          const repeated = await submit("Да");
          expect(repeated.reply.description).toContain("уже подтвердили");
          expect(backgroundsSent).toBe(1);
          expect(
            (await ecommerce.order.work.findByOrder(view.orderId!))?.files,
          ).toHaveLength(1);

          const original = await fileStorage.file.privateContent.findById({
            id: version.originalFileId,
          });
          const preview = await subject.orderWork.artifact(
            buyer.id,
            view.orderId!,
            version.previewFileId,
            "GET",
          );
          await expect(
            subject.orderWork.artifact(
              stranger.id,
              view.orderId!,
              version.previewFileId,
              "HEAD",
            ),
          ).rejects.toThrow();
          await expect(
            subject.orderWork.artifact(
              buyer.id,
              view.orderId!,
              version.originalFileId,
              "GET",
            ),
          ).rejects.toThrow();
          expect(await sharp(preview.bytes).metadata()).toMatchObject({
            width: 480,
            height: 640,
            format: "jpeg",
          });
          const { data, info } = await sharp(original!.bytes)
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          expect(info).toMatchObject({
            width: 1200,
            height: 1600,
            channels: 3,
          });
          const rgb = (x: number, y: number) => [
            ...data.subarray(3 * (1200 * y + x), 3 * (1200 * y + x) + 3),
          ];
          expect(rgb(3, 3)).toEqual([0x28, 0x4c, 0x36]);
          expect(rgb(600, 650)).toEqual([0x28, 0x4c, 0x36]);
          expect(rgb(200, 1290)).toEqual([0x28, 0x4c, 0x36]);
          expect(
            data.includes(
              Buffer.from(
                startsInIntake ? [0x18, 0x3c, 0x32] : [0x17, 0x2a, 0x21],
              ),
              3 * 1200 * 1230,
            ),
          ).toBe(true);
        } finally {
          network.mockRestore();
        }
        if (!startsInIntake) {
          const current = await crm.funnel.get(store.id, funnel.id);
          const next = await subject.crmWorkspace.execute(owner.id, {
            kind: "save",
            funnel: {
              storeId: store.id,
              funnelId: funnel.id,
              expectedRevision: current.revision,
              name: "Updated cover service",
              kind: current.kind,
              productIds: [product.id],
              definition: current.definition,
            },
          });
          if (next.kind !== "save") throw new Error("Expected a saved funnel");
          const route = { storeId: store.id, funnelSlug: funnel.slug };
          expect(
            await subject.crmWorkspace.funnel(owner.id, route),
          ).toMatchObject({
            id: funnel.id,
            name: "Updated cover service",
            slug: funnel.slug,
          });
          await expect(
            subject.crmWorkspace.funnel(stranger.id, route),
          ).rejects.toThrow("Store CRM access");
          expect(next.data.bindings).toMatchObject({
            offerIds: [offer.id],
            productIds: [product.id],
          });
          expect(
            await crm.task.getFunnel({
              storeId: store.id,
              taskId: view.taskId,
            }),
          ).toMatchObject({
            id: funnel.id,
            name: "Updated cover service",
          });
          const created = await subject.crmWorkspace.execute(owner.id, {
            kind: "save",
            funnel: {
              storeId: store.id,
              operationKey: randomUUID(),
              name: "Консультация по обложке",
              kind: "consultation",
              productIds: [],
              definition: {
                initialStageId: "questions",
                stages: [
                  {
                    id: "questions",
                    name: "Вопросы",
                    defaultAssigneeSubjectId: owner.id,
                    actions: [],
                  },
                ],
              },
            },
          });
          if (created.kind !== "save") {
            throw new Error("Expected a new funnel");
          }
          expect(
            await subject.crmWorkspace.funnel(owner.id, {
              storeId: store.id,
              funnelSlug: created.data.slug,
            }),
          ).toMatchObject({
            id: created.data.id,
            name: "Консультация по обложке",
          });
        }
        throw rollback;
      }),
    );
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  }
}

it("creates a direct OpenAI cover with legacy task funding and no store provider configuration", () =>
  verifyCover({ startsInIntake: false }));

it("takes an ordinary cart order through an employee intake and stage-funded cover delivery", () =>
  verifyCover({ startsInIntake: true }));

it("queues the opted-in cover after the final title on a regular cart order", () =>
  verifyCover({ startsInIntake: true, autoGenerate: true }));

it("checks buyer and employee messages independently and advances only when the conversation satisfies the stage", () =>
  verifyCover({ startsInIntake: true, linear: true }));
