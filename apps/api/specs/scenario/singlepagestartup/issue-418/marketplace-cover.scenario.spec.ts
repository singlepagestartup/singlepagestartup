import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
import { Handler as MessageHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Table as Wallet } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/repository/database";
import { Table as ThreadMessage } from "@sps/social/relations/threads-to-messages/backend/repository/database";
import { Table as SocialMessage } from "@sps/social/models/message/backend/repository/database";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";

const rollback = new Error("Remove marketplace cover fixtures");
const previousEnv = {
  SPS_PROVIDER_SECRET_DIR: process.env.SPS_PROVIDER_SECRET_DIR,
  SPS_PROVIDER_ACTIVE_MASTER_KEY: process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY,
  SPS_PROVIDER_MASTER_KEYS: process.env.SPS_PROVIDER_MASTER_KEYS,
};
let vault: string;

beforeAll(async () => {
  vault = await mkdtemp(join(tmpdir(), "sps-cover-test-"));
  process.env.SPS_PROVIDER_SECRET_DIR = vault;
  process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY = "cover-fixture";
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    "cover-fixture": randomBytes(32).toString("base64"),
  });
});

afterAll(async () => {
  for (const [key, value] of Object.entries(previousEnv)) {
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

async function verifyCover(provider: "openai" | "openrouter") {
  const startsInIntake = provider === "openrouter";
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
          amount: "25",
        });
        const { product, offer } = await subject.ecommerceCatalog.createOffer({
          subjectId: owner.id,
          data: {
            storeId: store.id,
            product: {
              title: { en: "Commission a cover" },
              kind: "service",
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
        const funnel = await crm.funnel.saveDraft({
          storeId: store.id,
          name: "Commissioned cover",
          kind: "individual-service",
          bindings: { offerIds: [offer.id] },
          definition: {
            initialStageId: startsInIntake ? "intake" : "design",
            workFunding: {
              payer: "store-owner",
              currencyId: credits.id,
              maxTaskAmount: "20",
              maxRunAmount: "10",
            },
            stages: [
              ...(startsInIntake
                ? [
                    {
                      id: "intake",
                      name: "Бриф",
                      instruction: "Уточните детали для обложки.",
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
                instruction: "Подготовить обложку товара.",
                output: "image",
                imageBrief: "marketplace-cover",
                actions: [],
              },
            ],
          },
        });
        await crm.funnel.publish({
          storeId: store.id,
          funnelId: funnel.id,
          actorId: owner.id,
          operationKey: randomUUID(),
          expectedRevision: funnel.revision,
        });
        const connection = await subject.providerConnections.change(owner.id, {
          operation: "connect",
          storeId: store.id,
          label: "Mock image provider",
          provider,
          externalAccount: "cover-mock-account",
          secret: "offline-cover-key",
        });
        await subject.providerConnections.change(owner.id, {
          operation: "assign-default",
          storeId: store.id,
          connectionId: connection.id,
          capability: "image",
          model:
            provider === "openai"
              ? "gpt-image-2.5-flare-2026-09-08"
              : "openai/gpt-image-2.5-flare",
          terms: {
            maxInputTokens: 32_000,
            maxOutputTokens: 16_384,
            maxCostUsd: "1",
            inputUsdPerMillion: "8",
            outputUsdPerMillion: provider === "openai" ? "30" : "40",
            usdPerSps: "0.1",
            workMultiplier: "1",
            version: "test-v1",
          },
        });
        if (startsInIntake) {
          await subject.providerConnections.change(owner.id, {
            operation: "assign-default",
            storeId: store.id,
            connectionId: connection.id,
            capability: "text",
            model: "test-intake-model",
            terms: {
              maxInputTokens: 32_000,
              maxOutputTokens: 200,
              maxCostUsd: "1",
              inputUsdPerMillion: "1",
              outputUsdPerMillion: "1",
              usdPerSps: "0.1",
              workMultiplier: "1",
              version: "test-v1",
            },
          });
        }
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
        if (command.operation === "open-cart-discussion") {
          const cart = await subject.ecommerceModuleOrderCartDetails({
            subjectId: buyer.id,
            orderId: command.orderId,
          });
          expect(cart.work?.state).toBe("requires-discussion");
          await expect(
            subject.customerWork.execute(stranger.id, command),
          ).rejects.toThrow("The selected cart order is unavailable");
        }
        const view = await subject.customerWork.execute(buyer.id, command);
        expect(view.orderId).toBeDefined();
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
        expect(cart.work?.state).toBe("awaiting-result");
        expect(cart.discussion).toEqual({
          storeId: store.id,
          taskId: view.taskId,
          threadId: view.threadId,
          chatId: view.chatId,
        });
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
        const route = new Hono();
        route.post(
          "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
          (context, next) => new MessageHandler(subject).execute(context, next),
        );

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
        const submit = async (text: string, file?: File) => {
          const form = new FormData();
          form.set(
            "data",
            JSON.stringify({ sourceSystemId: randomUUID(), description: text }),
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
          const request = await subject.customerWork.pendingForMessage({
            threadId: view.threadId,
            messageId: message.id,
          });
          if (!request) {
            throw new Error("The buyer message did not queue work");
          }
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
          return { ...result, reply, request, message };
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
            width: 1024,
            height: 1024,
            channels: 3,
            background: "#284c36",
          },
        })
          .png()
          .toBuffer();
        const url =
          provider === "openai"
            ? "https://api.openai.com/v1/images/generations"
            : "https://openrouter.ai/api/v1/images";
        let backgroundsSent = 0;
        let intakeCalls = 0;
        const network = jest
          .spyOn(globalThis, "fetch")
          .mockImplementation(async (destination, init) => {
            expect(new Headers(init?.headers).get("Authorization")).toBe(
              "Bearer offline-cover-key",
            );
            const body = JSON.parse(String(init?.body));
            if (
              startsInIntake &&
              String(destination) ===
                "https://openrouter.ai/api/v1/chat/completions"
            ) {
              intakeCalls += 1;
              const ready = body.messages.at(-1)?.content === "Формат: 3:4";
              expect(body.messages[0].content).toContain(
                "include its exact actionId in the same JSON response",
              );
              expect(body.messages[0].content).toContain(
                "ask only for the missing information in the current stage",
              );
              if (intakeCalls > 1) {
                expect(body.messages).toContainEqual({
                  role: "assistant",
                  content: `Уточняю детали. Ответ ${intakeCalls - 1}.`,
                });
              }
              const result = {
                reply: ready
                  ? "Непривязанный ответ модели"
                  : `Уточняю детали. Ответ ${intakeCalls}.`,
                actionId: ready ? "advance" : null,
              };
              return Response.json({
                id: `cover-intake-${intakeCalls}`,
                choices: [{ message: { content: JSON.stringify(result) } }],
                usage: {
                  prompt_tokens: 25,
                  completion_tokens: 20,
                  cost: 0.0001,
                },
              });
            }
            expect(String(destination)).toBe(url);
            backgroundsSent += 1;
            expect(body.prompt).toContain("1200×1600");
            expect(body.prompt).toContain("чистый студийный");
            expect(body.prompt).toContain(palette);
            expect(body.prompt).toContain("мягкая тень у стула");
            expect(body.prompt).toContain("Оставьте внизу место для подписи.");
            expect(body.prompt).toContain("минимализм");
            expect(body.prompt).not.toContain("Стул Берёза");
            expect(String(init?.body)).not.toMatch(
              /Фото стула|buyer-font|offline-cover-key|data:image|"b64_json"\s*:/,
            );
            const usage =
              provider === "openai"
                ? {
                    input_tokens: 10,
                    output_tokens: 20,
                    input_tokens_details: { text_tokens: 10, image_tokens: 0 },
                  }
                : { prompt_tokens: 10, completion_tokens: 20, cost: 0.001 };
            return Response.json({
              id: "fixture-cover-request",
              usage,
              data: [{ b64_json: mockBackground.toString("base64") }],
            });
          });
        try {
          const originalPhoto = new File(
            [new Uint8Array(pixels)],
            "Фото стула.png",
            { type: "image/png" },
          );
          const photoReply = await submit("Фото товара", originalPhoto);
          if (startsInIntake) {
            // Replies persisted before the event metadata remain visible on the next turn.
            const { customerWorkReplyEvent: _replyEvent, ...legacy } =
              photoReply.reply.metadata ?? {};
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
          const previewRequest = startsInIntake
            ? await submit("Формат: 3:4")
            : fontReply;
          if (startsInIntake) {
            expect(intakeCalls).toBeGreaterThan(0);
            expect(
              (await crm.task.get({ storeId: store.id, taskId: view.taskId }))
                .stageId,
            ).toBe("design");
            expect(previewRequest.reply.description).not.toContain(
              "Непривязанный ответ модели",
            );
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
            await setHistoryTime(previewRequest.reply.id, new Date(0));
            const replay = await subject.customerWork.contextForRun(
              fontReply.request,
            );
            expect(replay.messages).toEqual(selectedScope.messages);
            await advanceHistory(fontReply.reply.id);
            await advanceHistory(previewRequest.reply.id);
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

          const work = await ecommerce.order.work.findByOrder(view.orderId!);
          expect(work?.versions).toHaveLength(1);
          const [version] = work!.versions;
          expect(approval.reply.metadata).toMatchObject({
            customerWorkResultVersionId: version.id,
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
            (await ecommerce.order.work.findByOrder(view.orderId!))?.versions,
          ).toHaveLength(1);

          const original = await fileStorage.privateFile.findById({
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
          expect(rgb(600, 650)).toEqual([0xc2, 0x57, 0x27]);
          expect(rgb(200, 1290)).toEqual([0xff, 0xf7, 0xe7]);
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
        throw rollback;
      }),
    );
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  }
}

it.each(["openai", "openrouter"] as const)(
  "uses the confirmed private cover brief, exact size and font with %s background generation",
  verifyCover,
);
