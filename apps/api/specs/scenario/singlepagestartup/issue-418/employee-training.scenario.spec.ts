import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { Table as SocialMessage } from "@sps/social/models/message/backend/repository/database";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import {
  createAppAssembly,
  DefaultApp,
  ParseQueryMiddleware,
  RESTController,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import { signJwt, verifyJwt } from "@sps/backend-utils";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { createService } from "@sps/agent/models/work-attempt/backend/app/api/src/lib/bootstrap";
import { isStoreEmployeeTraining } from "@sps/crm/models/task/sdk/model";
import { Handler as CreateMessage } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Handler as FindChatActions } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/action/find";
import { Controller as SubjectController } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller";
import { Service as EmployeeTraining } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/crm/workspace/training";
import {
  McpCatalogUnavailable,
  Service as ProfileMcpCatalog,
} from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/catalog";
import { Service as ProfileMcpClient } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/startup/social-module/profile/mcp/singlepagestartup-client";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  customerWorkAttachmentPath,
  route as subjectRoute,
} from "@sps/rbac/models/subject/sdk/model";
import { Table as Wallet } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { route as subjectProfilesRoute } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/model";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import { route as socialProfilesRoute } from "@sps/social/models/profile/sdk/model";
import { Provider as KvProvider } from "@sps/providers-kv";
import {
  KV_PROVIDER,
  RBAC_JWT_SECRET,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";

import {
  embeddingResponse,
  useFixtureEmbeddings,
} from "../../test-utils/knowledge-embeddings";

useFixtureEmbeddings();

const rollback = new Error("Remove employee training scenario fixtures");
const previousKey = process.env.OPEN_AI_API_KEY;
const secret = "training-fixture-openai-key";

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

it("delivers a private answer while the owner edits its budget and stops work when funding is revoked", async () => {
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
      const funnel = await crm.funnel.save({
        storeId: store.id,
        kind: "individual-service",
        name: "Marketplace cover",
        bindings: { offerIds: [offer.id] },
        definition: {
          initialStageId: "render-cover",
          workFunding: {
            payer: "store-owner",
            currencyId: currency.id,
            maxRunAmount: "4",
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
      let revision = funnel.revision;
      const saveFunnel = async (definition: typeof funnel.definition) => {
        const updated = await crm.funnel.save({
          storeId: store.id,
          funnelId: funnel.id,
          expectedRevision: revision,
          kind: funnel.kind,
          name: funnel.name,
          bindings: funnel.bindings,
          definition,
        });
        revision = updated.revision;
        return updated;
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
      const employeeRole =
        "Reply as a furniture specialist. ".repeat(140) +
        "Final training role sentence.";
      await social.profile.update({
        id: employee.profileId,
        data: { description: { en: employeeRole } },
      });
      const chat = await social.chat.findById({ id: employee.chatId });
      if (!chat) {
        throw new Error("Expected the employee's training chat");
      }
      const scope = await subject.crmWorkspace.employees.scopeForChat(
        owner.id,
        chat,
      );
      const route = new Hono();
      route.get(
        "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/actions",
        (context, next) => new FindChatActions(subject).execute(context, next),
      );
      route.post(
        "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
        (context, next) => new CreateMessage(subject).execute(context, next),
      );
      const threadRequest = {
        storeId: store.id,
        subjectId: employee.id,
        title: "Каталог",
        operationKey: randomUUID(),
      };
      const createNamedThread = () =>
        subject.crmWorkspace.employees.createThread(owner.id, threadRequest);
      const failedPlacement = jest
        .spyOn(subject.modules.social.chatsToThreads, "create")
        .mockRejectedValueOnce(new Error("Interrupted thread placement"));
      try {
        await expect(
          tx.transaction((savepoint) =>
            withConsistencyDatabase(savepoint, createNamedThread),
          ),
        ).rejects.toThrow("Interrupted thread placement");
      } finally {
        failedPlacement.mockRestore();
      }
      const named = await createNamedThread();
      const ownerAccess = await signJwt(
        { subjectId: owner.id, type: "access", lifetimeInSeconds: 600 },
        RBAC_JWT_SECRET!,
      );
      const sendTo = async (
        threadId: string,
        description: string,
        ...attachments: File[]
      ) => {
        const endpoint = `/subjects/${owner.id}/profiles/${scope.actorProfileId}/chats/${chat.id}/threads/${threadId}/messages`;
        const form = new FormData();
        form.set(
          "data",
          JSON.stringify({ description, sourceSystemId: randomUUID() }),
        );
        for (const attachment of attachments) {
          form.append("files", attachment);
        }
        const response = await route.request(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${ownerAccess}` },
          body: form,
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const { data } = (await response.json()) as { data: IChatMessage };
        expect(data.metadata).not.toHaveProperty("employeeTrainingReplyImage");
        return data;
      };
      const send = (description: string, ...files: File[]) =>
        sendTo(named.threadId, description, ...files);
      const imageFile = async (background: string) => {
        const bytes = await sharp({
          create: { width: 600, height: 300, channels: 3, background },
        })
          .png()
          .toBuffer();
        return new File([Uint8Array.from(bytes)], "reference.png", {
          type: "image/png",
        });
      };
      const learnedFact = "Стул серии М13 сделан из ясеня.";
      const question =
        "Из какого материала сделан стул серии М13 и какого цвета приложенная обложка?";
      const savedMessage = await sendTo(
        employee.threadId,
        `Запомни ${learnedFact}`,
      );
      const separateQuestion = "Как подготовиться к отдельному совещанию?";
      const separate = await sendTo(
        employee.threadId,
        separateQuestion,
        await imageFile("#ff00ff"),
      );
      const [origin] = await social.messagesToKnowledgeModuleSources.find({
        params: {
          filters: {
            and: [
              { column: "messageId", method: "eq", value: savedMessage.id },
            ],
          },
        },
      });
      const indexed = await worker.modules.knowledge.source.findById({
        id: origin.knowledgeModuleSourceId,
      });
      expect(indexed?.indexedContentHash).toBe(indexed?.contentHash);
      expect(indexed?.lastIndexedAt).toBeTruthy();

      const fileOnly = await send(
        "",
        new File(["Вложение без запроса"], "reference.txt", {
          type: "text/plain",
        }),
      );
      await expect(
        subject.customerWork.pendingForMessage({
          messageId: fileOnly.id,
          threadId: named.threadId,
        }),
      ).resolves.toBeNull();

      const model = "gpt-6.2-astra";
      const pendingMessage = async (messageId: string) => {
        const pending = await subject.customerWork.pendingForMessage({
          messageId,
          threadId: named.threadId,
        });
        if (!pending) {
          throw new Error("Expected private training work");
        }
        return pending;
      };
      const attachmentText = "Высота сиденья кресла М13 составляет 450 мм.";
      const message = await send(
        question,
        new File([attachmentText], "specification.txt", { type: "text/plain" }),
        await imageFile("#ff0000"),
      );
      const pending = await pendingMessage(message.id);
      const defaultWork = await subject.customerWork.pendingForMessage({
        threadId: employee.threadId,
        messageId: separate.id,
      });
      expect(defaultWork?.taskId).toBeTruthy();
      expect(defaultWork?.taskId).not.toBe(pending.taskId);
      await expect(
        subject.customerWork.pendingForMessage({
          threadId: named.threadId,
          messageId: separate.id,
        }),
      ).resolves.toBeNull();
      const taskScope = { storeId: store.id, taskId: pending.taskId };
      const task = await crm.task.get(taskScope);
      expect(isStoreEmployeeTraining(task.openingKey)).toBe(true);
      expect(task).toMatchObject({
        customerId: owner.id,
        assigneeId: employee.id,
        funnelId: funnel.id,
        productId: null,
        offerId: null,
        orderId: null,
      });
      await expect(
        subject.customerWork.viewForThread(owner.id, named.threadId),
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
        expect(placed.threadId).toBe(named.threadId);
      };
      const reply = "Стул М13 сделан из ясеня.";
      const followUpQuestion = "Какого цвета фон на последней фотографии?";
      const followUpReply = "Каркас М13 изготовлен из ясеня.";
      const inFlight: { followUp?: typeof pending } = {};
      const providerFetch = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (url, options) => {
          if (String(url).endsWith("/embeddings")) {
            return embeddingResponse(url, options);
          }
          if (String(url).endsWith("/responses/input_tokens")) {
            return Response.json({
              object: "response.input_tokens",
              input_tokens: 500,
            });
          }
          expect(String(url)).toBe("https://api.openai.com/v1/responses");
          expect(new Headers(options?.headers).get("Authorization")).toBe(
            `Bearer ${secret}`,
          );
          const body = String(options?.body);
          const request = JSON.parse(body);
          expect(request.model).toBe(model);
          expect(request.reasoning.effort).toBe("high");
          const messages = request.input;
          expect(messages).toContainEqual({
            role: "system",
            content: `Assigned employee role\n${employeeRole}`,
          });
          const parts = messages.at(-1).content;
          expect(parts[0].text).toContain(
            inFlight.followUp ? followUpQuestion : question,
          );
          const photo = parts.at(-1);
          expect(photo.type).toBe("input_image");
          const urlData = photo.image_url;
          expect(urlData).toMatch(/^data:image\/png;base64,/);
          const image = Buffer.from(urlData.split(",")[1], "base64");
          expect(await sharp(image).metadata()).toMatchObject({
            format: "png",
            width: 600,
            height: 300,
          });
          const [red, , blue] = await sharp(image)
            .resize(1, 1)
            .raw()
            .toBuffer();
          expect(inFlight.followUp ? blue : red).toBeGreaterThan(245);
          expect(inFlight.followUp ? red : blue).toBeLessThan(10);
          if (!inFlight.followUp) {
            expect(parts).toHaveLength(3);
            expect(parts[1]).toMatchObject({
              type: "input_file",
              filename: "specification.txt",
            });
            expect(
              Buffer.from(
                parts[1].file_data.split(",")[1],
                "base64",
              ).toString(),
            ).toBe(attachmentText);
          } else {
            expect(parts).toHaveLength(2);
          }
          expect(body).not.toContain("Вложение без запроса");
          expect(body).not.toContain(separateQuestion);
          expect(body).toContain(learnedFact);
          expect(body).not.toContain(customerInstruction);
          expect(body).not.toContain("close-customer-task");
          expect(body).not.toContain("request-routing");
          let answer = followUpReply;
          if (!inFlight.followUp) {
            expect(body).toContain(question);
            const newer = await saveFunnel({
              ...funnel.definition,
              workFunding: {
                payer: "store-owner",
                currencyId: currency.id,
                maxRunAmount: "5",
                maxTaskAmount: "11",
              },
            });
            const uploaded = await send("", await imageFile("#0000ff"));
            await expect(
              subject.customerWork.pendingForMessage({
                messageId: uploaded.id,
                threadId: named.threadId,
              }),
            ).resolves.toBeNull();
            // Previous installations stored a single private object under customerWorkMedia.
            const source = await social.message.findById({ id: uploaded.id });
            const [file] = source?.metadata?.customerWorkAttachments as {
              id: string;
              mimeType: string;
              digest: string;
            }[];
            await tx
              .update(SocialMessage)
              .set({
                metadata: {
                  customerWorkMedia: {
                    id: file.id,
                    mimeType: file.mimeType,
                    digest: file.digest,
                  },
                },
              })
              .where(eq(SocialMessage.id, uploaded.id));
            const second = await send(followUpQuestion);
            const savedQuestion = await social.message.findById({
              id: second.id,
            });
            expect(savedQuestion?.metadata?.employeeTrainingReplyImage).toEqual(
              { id: file.id, digest: file.digest, messageId: uploaded.id },
            );
            const next = await pendingMessage(second.id);
            inFlight.followUp = next;
            expect(next.taskId).toBe(pending.taskId);
            const nextTask = await crm.task.get({
              ...taskScope,
              taskId: next.taskId,
            });
            expect(nextTask.funnelId).toBe(newer.id);
            expect(await pendingMessage(message.id)).toEqual(pending);
            answer = reply;
          } else {
            expect(body).toContain(followUpQuestion);
          }
          return Response.json({
            id: `mock-training-reply-${randomUUID()}`,
            status: "completed",
            output: [
              {
                type: "message",
                role: "assistant",
                content: [{ type: "output_text", text: answer }],
              },
            ],
            usage: { input_tokens: 100, output_tokens: 25 },
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
            "Expected a second training message after editing the funnel",
          );
        }
        await send("", await imageFile("#00ff00"));
        const replay = await worker.dispatch(pending);
        expect(replay.id).toBe(result.id);
        const followUp = await worker.dispatch(inFlight.followUp);
        await Promise.all(providerFetch.mock.results.map(({ value }) => value));
        expect(followUp.state).toBe("delivered");
        await replyInThread(followUp.id, followUpReply);

        const stock = "M13: 18 стульев на складе";
        const callStock = jest.fn(async ({ sku }: { sku: string }) => {
          if (sku === "M14") {
            return {
              isError: true,
              content: [
                { type: "text" as const, text: "private inventory diagnostic" },
              ],
            };
          }
          expect(sku).toBe("M13");
          return {
            content: [{ type: "text" as const, text: stock }],
            structuredContent: {
              available: 18,
              privateReference: "private supplier code",
            },
          };
        });
        const mcpServer = new McpServer({ name: "stock", version: "1" });
        mcpServer.registerTool(
          "catalog_stock",
          {
            description: "Read product availability",
            inputSchema: { sku: z.string() },
          },
          callStock,
        );
        const mcpClient = new McpClient({ name: "employee", version: "1" });
        const [clientTransport, serverTransport] =
          InMemoryTransport.createLinkedPair();
        const exchange = async (
          _url: Parameters<typeof fetch>[0],
          options?: RequestInit,
        ) => {
          const token = JSON.parse(String(options?.body)).subject_token;
          const claims = await verifyJwt(token, RBAC_JWT_SECRET!, {
            type: "access",
          });
          expect(claims.subject).toEqual({ id: owner.id });
          return Response.json({
            access_token: "employee-mcp-token",
            token_type: "Bearer",
            scope: "mcp",
            expires_in: 60,
          });
        };
        const listTools = jest.fn(() => mcpClient.listTools());
        const close = jest.fn(() => mcpClient.close());
        const catalog = new ProfileMcpCatalog(
          new ProfileMcpClient({
            mcpUrl: "https://mcp.example.test/mcp",
            exchangeSecret: "test-exchange",
            fetch: exchange as typeof fetch,
            createWireClient: async ({ accessToken }) => {
              expect(accessToken).toBe("employee-mcp-token");
              await mcpServer.connect(serverTransport);
              await mcpClient.connect(clientTransport);
              return {
                listTools,
                callTool: (params, _schema, options) =>
                  mcpClient.callTool(params, undefined, options),
                close,
              };
            },
          }),
        );
        await social.profile.update({
          id: employee.profileId,
          data: { allowedMcpServerIds: ["singlepagestartup"] },
        });
        const openTools = jest
          .spyOn(subject, "socialModuleProfileMcpCatalogOpen")
          .mockImplementation((options) => catalog.open(options));
        const stockQuestion = await send("Проверь на складе остаток М13.");
        const stockRun = await pendingMessage(stockQuestion.id);
        // A disconnected catalog must leave the original input pending, with no paid operation to replay.
        openTools.mockRejectedValueOnce(
          Object.assign(new Error("MCP unavailable"), { code: "ECONNREFUSED" }),
        );
        await expect(worker.dispatch(stockRun)).rejects.toBeInstanceOf(
          McpCatalogUnavailable,
        );
        expect(
          await subject.customerWork.pendingForMessage({
            messageId: stockQuestion.id,
            threadId: named.threadId,
          }),
        ).toMatchObject({ eventId: stockRun.eventId });
        expect(
          await worker.count({
            params: {
              filters: {
                and: [
                  { column: "eventId", method: "eq", value: stockRun.eventId },
                ],
              },
            },
          }),
        ).toBe(0);
        const callsBeforeMcp = providerFetch.mock.calls.filter(([url]) =>
          /\/(?:chat\/completions|responses)$/.test(String(url)),
        ).length;
        try {
          await providerFetch.withImplementation(
            async (url, options) => {
              if (String(url).endsWith("/embeddings")) {
                return embeddingResponse(url, options);
              }
              expect(String(url)).toBe("https://api.openai.com/v1/responses");
              const body = JSON.parse(String(options?.body));
              expect(body.store).toBe(false);
              const previous = body.input.at(-1);
              let output;
              if (body.tools) {
                const repeat = previous.type === "function_call_output";
                expect(body.tools).toEqual([
                  expect.objectContaining({
                    type: "function",
                    strict: false,
                    name: expect.stringMatching(
                      /^singlepagestartup_catalog_stock_/,
                    ),
                    parameters: expect.objectContaining({ required: ["sku"] }),
                  }),
                ]);
                if (repeat) {
                  expect(previous).toMatchObject({
                    call_id: "lookup",
                    output: expect.stringContaining(stock),
                  });
                  expect(body.input).toContainEqual(
                    expect.objectContaining({
                      type: "reasoning",
                      id: "rs_lookup",
                      encrypted_content: "opaque lookup state",
                    }),
                  );
                }
                const callId = repeat ? "lookup-next" : "lookup";
                output = [
                  {
                    type: "reasoning",
                    id: "rs_" + callId,
                    encrypted_content: "opaque lookup state",
                    summary: [],
                  },
                  {
                    type: "function_call",
                    id: "fc_" + callId,
                    call_id: callId,
                    name: body.tools[0].name,
                    arguments: JSON.stringify({ sku: repeat ? "M14" : "M13" }),
                  },
                ];
              } else {
                expect(previous).toMatchObject({
                  type: "function_call_output",
                  call_id: "lookup-next",
                  output: expect.stringContaining('"isError":true'),
                });
                output = [
                  {
                    type: "message",
                    content: [{ type: "output_text", text: stock }],
                  },
                ];
              }
              return Response.json({
                id: randomUUID(),
                status: "completed",
                output,
                usage: { input_tokens: 100, output_tokens: 25 },
              });
            },
            async () => {
              const result = await worker.dispatch(stockRun);
              expect(result.state).toBe("delivered");
              await replyInThread(result.id, stock);
              await expect(worker.dispatch(stockRun)).resolves.toEqual(result);
            },
          );
          expect(callStock).toHaveBeenCalledTimes(2);
          expect(listTools).toHaveBeenCalledTimes(1);
          expect(close).toHaveBeenCalledTimes(1);
          expect(openTools).toHaveBeenCalledTimes(2);
          const traces = await social.action.find({
            params: {
              filters: {
                and: [
                  {
                    column: "payload->>runId",
                    method: "eq",
                    value: stockRun.eventId,
                  },
                ],
              },
            },
          });
          expect(traces).toHaveLength(1);
          const [trace] = traces;
          const readActions = async (threadId: string) => {
            const response = await route.request(
              `/subjects/${owner.id}/profiles/${scope.actorProfileId}/chats/${chat.id}/actions?socialModuleThreadId=${threadId}`,
              {
                headers: { Authorization: `Bearer ${ownerAccess}` },
              },
            );
            expect(response.status).toBe(200);
            return (
              (await response.json()) as { data: { id: string }[] }
            ).data.map(({ id }) => id);
          };
          expect(await readActions(named.threadId)).toContain(trace.id);
          expect(await readActions(employee.threadId)).not.toContain(trace.id);
          expect(trace?.payload).toMatchObject({
            runId: stockRun.eventId,
            triggerMessageId: stockQuestion.id,
            replySocialProfileId: employee.profileId,
            status: "failed",
            steps: [
              {
                serverId: "singlepagestartup",
                toolName: "catalog_stock",
                status: "succeeded",
                parameters: { sku: "M13" },
                resultSummary: { available: 18 },
              },
              {
                serverId: "singlepagestartup",
                toolName: "catalog_stock",
                status: "failed",
                parameters: { sku: "M14" },
                errorCode: "tool_error",
              },
            ],
          });
          expect(JSON.stringify(trace?.payload)).not.toMatch(
            /private supplier|private inventory|Bearer|privateReference/,
          );
          const placement = {
            params: {
              filters: {
                and: [
                  {
                    column: "actionId",
                    method: "eq" as const,
                    value: trace.id,
                  },
                ],
              },
            },
          };
          expect(await social.threadsToActions.find(placement)).toEqual([
            expect.objectContaining({ threadId: named.threadId }),
          ]);
          expect(await social.chatsToActions.find(placement)).toEqual([
            expect.objectContaining({ chatId: chat.id }),
          ]);
          expect(await social.profilesToActions.find(placement)).toEqual([
            expect.objectContaining({ profileId: employee.profileId }),
          ]);
          const charges = await worker.find({
            params: {
              filters: {
                and: [
                  { column: "eventId", method: "eq", value: stockRun.eventId },
                ],
              },
            },
          });
          expect(
            charges.map(({ stepKey, state, workReceiptId }) => ({
              stepKey,
              state,
              paid: Boolean(workReceiptId),
            })),
          ).toEqual(
            expect.arrayContaining([
              { stepKey: "mcp-tools-1", state: "delivered", paid: true },
              { stepKey: "mcp-tools-2", state: "delivered", paid: true },
              { stepKey: "reply", state: "delivered", paid: true },
            ]),
          );
        } finally {
          openTools.mockRestore();
          await mcpServer.close();
          await social.profile.update({
            id: employee.profileId,
            data: { allowedMcpServerIds: [] },
          });
        }
        const paidCalls = callsBeforeMcp + 3;

        await saveFunnel({
          ...funnel.definition,
          workFunding: {
            payer: "store-owner",
            currencyId: currency.id,
            maxRunAmount: "0.50",
            maxTaskAmount: "11",
          },
        });
        const unaffordable = await send("Уточни размер сиденья.");
        const unaffordableRun = await pendingMessage(unaffordable.id);
        const ordinaryQuestion =
          await subject.customerWork.contextForRun(unaffordableRun);
        expect(ordinaryQuestion.inputAttachments).toEqual([]);
        const beforeTooSmall = await balance(owner.id);
        const beforeOperations = (
          await subject.providerConnections.list(owner.id, store.id)
        ).operations;
        const declined = await worker.dispatch(unaffordableRun);
        expect(declined).toEqual({
          id: unaffordableRun.eventId,
          state: "delivered",
        });
        await replyInThread(
          declined.id,
          "Бюджета или средств на балансе магазина не хватило для ответа ИИ.",
        );
        expect(
          providerFetch.mock.calls.filter(([url]) =>
            /\/(?:chat\/completions|responses)$/.test(String(url)),
          ),
        ).toHaveLength(paidCalls);
        expect(await balance(owner.id)).toBe(beforeTooSmall);
        expect(
          (await subject.providerConnections.list(owner.id, store.id))
            .operations,
        ).toEqual(beforeOperations);

        const third = await send("Что ещё известно о М13?");
        const unfunded = await pendingMessage(third.id);
        const beforeRevocation = await balance(owner.id);
        await saveFunnel({
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
        expect(
          providerFetch.mock.calls.filter(([url]) =>
            /\/(?:chat\/completions|responses)$/.test(String(url)),
          ),
        ).toHaveLength(paidCalls);
        expect(await balance(owner.id)).toBe(beforeRevocation);
        expect(
          await subject.customerWork.pendingForMessage({
            messageId: third.id,
            threadId: named.threadId,
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
        model,
        terms: { inputUsdPerMillion: "8", outputUsdPerMillion: "40" },
        result: {
          usage: {
            basis: "rate-card",
            inputTokens: 100,
            outputTokens: 25,
            usd: "0.0018",
          },
        },
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

it("manages the employee profile and keeps training attachments in its private Social chat", async () => {
  const jwtSecret = RBAC_JWT_SECRET;
  if (!jwtSecret || !RBAC_SECRET_KEY) {
    throw new Error("The scenario needs the fixture RBAC configuration");
  }
  const operation = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const { rbac, ecommerce, crm, social } =
        createService(createAppAssembly()).modules;
      const subject = rbac.subject;
      const [owner, buyer] = await Promise.all([
        subject.create({ data: {} }),
        subject.create({ data: {} }),
      ]);
      const identity = await rbac.identity.create({
        data: { email: `training-${owner.id}@example.test` },
      });
      await rbac.subjectsToIdentities.create({
        data: { subjectId: owner.id, identityId: identity.id },
      });
      const store = await ecommerce.store.create({ data: {} });
      await rbac.subjectsToEcommerceModuleStores.create({
        data: {
          subjectId: owner.id,
          ecommerceModuleStoreId: store.id,
          variant: "owner",
        },
      });
      const createEmployee = {
        kind: "create-employee" as const,
        employee: {
          storeId: store.id,
          name: "Редактор",
          operationKey: randomUUID(),
        },
      };
      const created = await subject.crmWorkspace.execute(
        owner.id,
        createEmployee,
      );
      if (created.kind !== "create-employee") {
        throw new Error("Expected an employee and staff conversation");
      }
      await expect(
        subject.crmWorkspace.execute(owner.id, createEmployee),
      ).resolves.toEqual(created);
      const { id, profileId, chatId, threadId } = created.data;
      const employeeScope = { storeId: store.id, subjectId: id };
      const initial = await subject.crmWorkspace.employeeDetail(
        owner.id,
        employeeScope,
      );
      const actorProfile = initial.training?.actorProfile;
      expect(initial).toMatchObject({
        id,
        canTrain: true,
        training: { profileId, chatId, threadId },
      });
      if (!actorProfile) {
        throw new Error("Expected the manager's profile in the staff chat");
      }
      await expect(
        subject.crmWorkspace.employeeDetail(buyer.id, employeeScope),
      ).rejects.toThrow("Permission");

      const buyerProfile = await social.profile.create({ data: {} });
      await rbac.subjectsToSocialModuleProfiles.create({
        data: { subjectId: buyer.id, socialModuleProfileId: buyerProfile.id },
      });
      const shopperChat = await subject.chatOwnership.create(buyer.id, {
        variant: "customer-work",
      });
      const shopperThread = await social.thread.create({ data: {} });
      const funnel = await crm.funnel.save({
        storeId: store.id,
        kind: "consultation",
        name: "Customer consultation",
        definition: {
          initialStageId: "answer",
          stages: [{ id: "answer", name: "Answer", actions: [] }],
        },
      });
      const task = await crm.task.open({
        storeId: store.id,
        funnelId: funnel.id,
        customerId: buyer.id,
        actorId: buyer.id,
        operationKey: randomUUID(),
      });
      await crm.task.assign({
        storeId: store.id,
        taskId: task.id,
        actorId: owner.id,
        expectedRevision: task.revision,
        operationKey: randomUUID(),
        assigneeId: id,
        assigneeKind: "ai",
      });
      await social.chatsToThreads.create({
        data: { chatId: shopperChat.id, threadId: shopperThread.id },
      });
      await social.chatsToCrmModuleTasks.create({
        data: { chatId: shopperChat.id, crmModuleTaskId: task.id },
      });
      for (const memberId of [buyerProfile.id, actorProfile.id, profileId]) {
        await social.profilesToChats.create({
          data: { chatId: shopperChat.id, profileId: memberId },
        });
      }
      const tasks = await subject.crmWorkspace.tasks(owner.id, {
        storeId: store.id,
        assigneeId: id,
        current: true,
        includeStageNames: true,
      });
      expect(tasks.items).toEqual([
        expect.objectContaining({
          id: task.id,
          stageName: "Answer",
          status: task.status,
        }),
      ]);
      await expect(
        subject.customerWork.assertChatAccess({
          subjectId: buyer.id,
          chatId: shopperChat.id,
          threadId: shopperThread.id,
          edit: false,
        }),
      ).resolves.toBeUndefined();
      await expect(
        subject.customerWork.assertChatAccess({
          subjectId: owner.id,
          chatId: shopperChat.id,
          threadId: shopperThread.id,
          edit: false,
        }),
      ).resolves.toBe("staff");
      await expect(
        subject.customerWork.assertChatAccess({
          subjectId: owner.id,
          chatId: shopperChat.id,
          edit: true,
          settingsOperation: "update-chat",
        }),
      ).rejects.toThrow("chat owner");
      await expect(
        subject.customerWork.assertChatAccess({
          subjectId: owner.id,
          chatId,
          threadId: shopperThread.id,
          edit: false,
        }),
      ).rejects.toThrow("Not Found");

      const app = new DefaultApp(
        {} as never,
        new SubjectController(subject),
        {} as never,
      );
      app.useRoutes();
      const profileRelationApp = new DefaultApp(
        {} as never,
        new RESTController(rbac.subjectsToSocialModuleProfiles),
        {} as never,
      );
      profileRelationApp.hono.use(new ParseQueryMiddleware().init());
      profileRelationApp.useRoutes();
      const browser = new Hono()
        .route(subjectRoute, app.hono)
        .route(subjectProfilesRoute, profileRelationApp.hono);
      const request = async (
        actorId: string,
        path: string,
        method = "GET",
        data?: object,
        expectSuccess = true,
      ) => {
        const accessToken = await signJwt(
          { subjectId: actorId, type: "access", lifetimeInSeconds: 60 },
          jwtSecret,
        );
        const body =
          data instanceof FormData ? data : data && JSON.stringify({ data });
        const response = await browser.request(path, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(typeof body === "string" && {
              "content-type": "application/json",
            }),
          },
          body,
        });
        if (expectSuccess && !response.ok) {
          const details = await response.text();
          throw new Error(
            `${method} ${path} returned ${response.status}. ${details}`,
          );
        }
        return response;
      };
      const staffChatPath = `${subjectRoute}/${owner.id}/social-module/profiles/${actorProfile.id}/chats/${chatId}`;
      const staffProfilePath = `${staffChatPath}/profiles/${profileId}`;
      const shopperProfilePath = `${subjectRoute}/${buyer.id}/social-module/profiles/${buyerProfile.id}/chats/${shopperChat.id}/profiles/${profileId}`;
      const network = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (url, options) => {
          const destination = new URL(String(url));
          const { pathname } = destination;
          if (pathname === subjectProfilesRoute) {
            expect(new Headers(options?.headers).has("X-RBAC-SECRET-KEY")).toBe(
              true,
            );
            return browser.request(destination, options);
          }
          const requestingProfileId = [actorProfile.id, buyerProfile.id].find(
            (memberId) => pathname === `${socialProfilesRoute}/${memberId}`,
          );
          if (requestingProfileId) {
            expect(options?.method ?? "GET").toBe("GET");
            const data = await social.profile.findById({
              id: requestingProfileId,
            });
            return Response.json({ data });
          }
          if (pathname === `${socialProfilesRoute}/${profileId}`) {
            expect(new Headers(options?.headers).has("X-RBAC-SECRET-KEY")).toBe(
              true,
            );
            if (options?.method === "PATCH") {
              expect(options.body).toBeInstanceOf(FormData);
              const form = options.body as FormData;
              const data = JSON.parse(String(form.get("data")));
              const profile = await social.profile.update({
                id: profileId,
                data,
              });
              return Response.json({ data: profile });
            }
            expect(options?.method ?? "GET").toBe("GET");
            return Response.json({
              data: await social.profile.findById({ id: profileId }),
            });
          }
          if (pathname.endsWith("/embeddings")) {
            return embeddingResponse(url, options);
          }
          throw new Error(
            `Unexpected network pathname in staff chat fixture. ${pathname}`,
          );
        });
      try {
        const commandPath = `${subjectRoute}/${owner.id}/crm-module/workspace/command`;
        const command = {
          kind: "create-employee-thread",
          employee: {
            ...employeeScope,
            title: "Инструкции",
            operationKey: randomUUID(),
          },
        };
        const newlyCreated = await request(
          owner.id,
          commandPath,
          "POST",
          command,
        );
        const newThreadId = (await newlyCreated.json()).data.data.threadId;
        expect(newThreadId).not.toBe(threadId);
        const replay = await request(owner.id, commandPath, "POST", command);
        expect((await replay.json()).data.data.threadId).toBe(newThreadId);
        const threadListPath = `${subjectRoute}/${owner.id}/social-module/chats/${chatId}/threads`;
        const filtered = await request(
          owner.id,
          `${threadListPath}?threadId=${newThreadId}&limit=1`,
        );
        expect((await filtered.json()).data).toEqual([
          expect.objectContaining({ id: newThreadId, title: "Инструкции" }),
        ]);
        const messagesPath = `${staffChatPath}/threads/${threadId}/messages`;
        const siblingMessagesPath = `${staffChatPath}/threads/${newThreadId}/messages`;
        const fileName = "Инструкция.txt";
        const fileContents = "Проверить поля макета.\n";
        const sourceSystemId = randomUUID();
        const sendFile = (text: string, key: string, expectSuccess = true) => {
          const form = new FormData();
          form.set("data", JSON.stringify({ sourceSystemId: key }));
          form.append(
            "files",
            new File([text], fileName, { type: "text/plain" }),
          );
          return request(owner.id, messagesPath, "POST", form, expectSuccess);
        };

        const sent = await sendFile(fileContents, sourceSystemId);
        const { data: message }: { data: IChatMessage } = await sent.json();
        expect(message).toMatchObject({
          description: "",
          authorProfileIds: [actorProfile.id],
          attachments: [],
          privateAttachments: [{ id: expect.any(String), name: fileName }],
        });
        expect(message.metadata).not.toHaveProperty("customerWorkAttachments");
        const [file] = message.privateAttachments ?? [];
        if (!file) {
          throw new Error("Expected a protected training attachment");
        }

        const replayed = await sendFile(fileContents, sourceSystemId);
        expect((await replayed.json()).data).toMatchObject({
          id: message.id,
          privateAttachments: [file],
        });
        const changed = await sendFile("Другой файл", sourceSystemId, false);
        expect(changed.status).toBe(409);

        const listed = await request(owner.id, messagesPath);
        const { data: messages }: { data: IChatMessage[] } =
          await listed.json();
        expect(messages.filter(({ id }) => id === message.id)).toEqual([
          expect.objectContaining({
            id: message.id,
            description: "",
            attachments: [],
            privateAttachments: [file],
          }),
        ]);
        // Exercise the normal multipart route for both typed and opaque media.
        // Playback is a browser concern. This fixture checks container headers
        // and byte-for-byte delivery to the authorized thread participant.
        const media = [
          new File(
            [
              Buffer.from(
                "524946462600000057415645666d74201000000001000100401f0000803e00000200100064617461020000000000",
                "hex",
              ),
            ],
            "Запись.wav",
            { type: "audio/wav" },
          ),
          new File(
            [
              Buffer.from(
                "000000186674797069736f6d0000000069736f6d6d703432",
                "hex",
              ),
            ],
            "Ролик.mp4",
            { type: "video/mp4" },
          ),
        ];
        const mediaForm = new FormData();
        mediaForm.set("data", JSON.stringify({ sourceSystemId: randomUUID() }));
        for (const clip of media) {
          mediaForm.append("files", clip);
        }
        const secondSend = await request(
          owner.id,
          messagesPath,
          "POST",
          mediaForm,
        );
        const { data: wrongMessage }: { data: IChatMessage } =
          await secondSend.json();
        const uploadedMedia = wrongMessage.privateAttachments ?? [];
        expect(uploadedMedia.map(({ name }) => name)).toEqual(
          media.map(({ name }) => name),
        );
        for (const [index, attachment] of uploadedMedia.entries()) {
          const path = customerWorkAttachmentPath(
            owner.id,
            threadId,
            wrongMessage.id,
            attachment.id,
          );
          const response = await request(owner.id, path);
          expect(new Uint8Array(await response.arrayBuffer())).toEqual(
            new Uint8Array(await media[index].arrayBuffer()),
          );
        }
        const unauthorizedMessages = await request(
          buyer.id,
          `${subjectRoute}/${buyer.id}/social-module/profiles/${buyerProfile.id}/chats/${chatId}/threads/${threadId}/messages`,
          "GET",
          undefined,
          false,
        );
        expect(unauthorizedMessages.status).toBe(404);

        const download = customerWorkAttachmentPath(
          owner.id,
          threadId,
          message.id,
          file.id,
        );
        const fileResponse = await request(owner.id, download);
        expect(fileResponse.headers.get("Content-Type")).toBe(
          "application/octet-stream",
        );
        expect(fileResponse.headers.get("Cache-Control")).toBe(
          "private, no-store",
        );
        expect(fileResponse.headers.get("Content-Disposition")).toContain(
          `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        );
        expect(await fileResponse.text()).toBe(fileContents);
        const head = await request(owner.id, download, "HEAD");
        expect(head.headers.get("Content-Length")).toBe(
          String(Buffer.byteLength(fileContents)),
        );
        expect(await head.text()).toBe("");

        const emptySibling = await request(owner.id, siblingMessagesPath);
        expect((await emptySibling.json()).data).toEqual([]);
        const inaccessible = [
          { actorId: owner.id, threadId: newThreadId, messageId: message.id },
          {
            actorId: owner.id,
            threadId: shopperThread.id,
            messageId: message.id,
          },
          { actorId: owner.id, threadId, messageId: wrongMessage.id },
          { actorId: buyer.id, threadId, messageId: message.id },
        ];
        for (const access of inaccessible) {
          const { actorId } = access;
          const path = customerWorkAttachmentPath(
            actorId,
            access.threadId,
            access.messageId,
            file.id,
          );
          for (const method of ["GET", "HEAD"]) {
            const refused = await request(
              actorId,
              path,
              method,
              undefined,
              false,
            );
            expect(refused.status).toBe(404);
          }
        }
        const wrongSession = await request(
          buyer.id,
          download,
          "GET",
          undefined,
          false,
        );
        expect(wrongSession.ok).toBe(false);
        expect((await browser.request(download)).ok).toBe(false);

        const savedProfile = await request(
          owner.id,
          staffProfilePath,
          "PATCH",
          {
            title: { en: "Editor", ru: "Редактор обложек" },
            description: { ru: "Проверяет обложки перед публикацией." },
          },
        );
        expect(savedProfile.status).toBe(200);
        const employee = await subject.crmWorkspace.employeeDetail(
          owner.id,
          employeeScope,
        );
        expect(employee.name).toBe("Редактор обложек");
        expect(employee.training).toEqual({
          ...initial.training,
          threads: [
            { id: threadId, title: "Редактор" },
            { id: newThreadId, title: command.employee.title },
          ],
        });
        await expect(
          social.profile.findById({ id: profileId }),
        ).resolves.toMatchObject({
          title: { en: "Editor", ru: "Редактор обложек" },
          description: { ru: "Проверяет обложки перед публикацией." },
        });

        const source = {
          title: "Материалы",
          content: "Каркас сделан из ясеня.",
        };
        expect(
          (
            await request(
              owner.id,
              `${staffProfilePath}/knowledge/sources`,
              "POST",
              source,
            )
          ).status,
        ).toBe(200);
        const knowledge = await request(
          owner.id,
          `${staffProfilePath}/knowledge/sources`,
        );
        expect(knowledge.status).toBe(200);
        expect((await knowledge.json()).data).toContainEqual(
          expect.objectContaining(source),
        );

        const ownNotesPath = `${subjectRoute}/${owner.id}/social-module/profiles/${actorProfile.id}/knowledge/sources/personal`;
        const firstNote = {
          title: "Мой стиль",
          content: "Для макета я выбираю красный.",
          operationKey: randomUUID(),
        };
        const createdNote = (
          await (
            await request(owner.id, ownNotesPath, "POST", firstNote)
          ).json()
        ).data;
        expect(createdNote).toMatchObject({
          editable: true,
          indexedContentHash: createdNote.contentHash,
        });
        const edit = {
          title: firstNote.title,
          content: "Для макета я выбираю синий.",
          expectedContentHash: createdNote.contentHash,
          expectedTitle: createdNote.title,
        };
        const editedNote = (
          await (
            await request(
              owner.id,
              `${ownNotesPath}/${createdNote.id}`,
              "PATCH",
              edit,
            )
          ).json()
        ).data;
        expect(editedNote.contentHash).not.toBe(createdNote.contentHash);
        expect(editedNote.indexedContentHash).toBe(editedNote.contentHash);
        const personalList = (
          await (await request(owner.id, ownNotesPath)).json()
        ).data;
        expect(personalList).toContainEqual(
          expect.objectContaining({
            id: createdNote.id,
            editable: true,
            content: edit.content,
          }),
        );
        const staffTraining = new EmployeeTraining(subject);
        const scope = await staffTraining.knowledgeScope({
          ...employeeScope,
          profileId,
          chatId,
          threadId,
          actorProfileId: actorProfile.id,
        });
        expect(scope.personalKnowledgeSourceIds).toContain(createdNote.id);
        const references = await staffTraining.references(
          scope,
          "Какой цвет я выбираю для макета?",
        );
        const preference = references.find(
          (entry) => entry.id === createdNote.id,
        );
        expect(preference).toMatchObject({
          version: editedNote.contentHash,
          text: expect.stringContaining(edit.content),
        });
        expect(preference?.text).not.toContain(firstNote.content);

        const skill = {
          slug: "review",
          title: "Проверка",
          description: "Проверь поля.",
        };
        const createdSkill = await request(
          owner.id,
          `${staffProfilePath}/skills`,
          "POST",
          skill,
        );
        expect(createdSkill.status).toBe(200);
        const { id: skillId } = (await createdSkill.json()).data as {
          id: string;
        };
        const edited = { ...skill, description: "Сверь поля с брифом." };
        expect(
          (
            await request(
              owner.id,
              `${staffProfilePath}/skills/${skillId}`,
              "PATCH",
              edited,
            )
          ).status,
        ).toBe(200);
        const skills = await request(owner.id, `${staffProfilePath}/skills`);
        expect(skills.status).toBe(200);
        expect((await skills.json()).data).toContainEqual(
          expect.objectContaining(edited),
        );

        expect(
          (
            await request(
              buyer.id,
              staffProfilePath,
              "PATCH",
              { title: { ru: "Чужой" } },
              false,
            )
          ).ok,
        ).toBe(false);
        expect(
          (
            await request(
              buyer.id,
              `${shopperProfilePath}/skills`,
              "GET",
              undefined,
              false,
            )
          ).ok,
        ).toBe(false);
        expect(
          (
            await request(
              buyer.id,
              `${shopperProfilePath}/knowledge/sources`,
              "GET",
              undefined,
              false,
            )
          ).ok,
        ).toBe(false);
      } finally {
        network.mockRestore();
      }
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
