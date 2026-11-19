import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
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
import { Table as PaymentIntent } from "@sps/billing/models/payment-intent/backend/repository/database";
import { Table as SocialMessage } from "@sps/social/models/message/backend/repository/database";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Handler as AttachmentHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/customer-work";
import { Handler as MessageHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create";
import { Handler as MessageUpdateHandler } from "@sps/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/update";
import { customerWorkAttachmentPath } from "@sps/rbac/models/subject/sdk/model";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import {
  RequestCustomerWorkChat,
  RequestSubjectIdOwner,
} from "@sps/rbac/models/subject/backend/app/middlewares";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER, RBAC_JWT_SECRET } from "@sps/shared-utils";

const rollback = new Error("Remove cart consent fixtures");
const previousEnv = {
  SPS_PROVIDER_SECRET_DIR: process.env.SPS_PROVIDER_SECRET_DIR,
  SPS_PROVIDER_ACTIVE_MASTER_KEY: process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY,
  SPS_PROVIDER_MASTER_KEYS: process.env.SPS_PROVIDER_MASTER_KEYS,
};
let vault: string;

beforeAll(async () => {
  vault = await mkdtemp(join(tmpdir(), "sps-cart-consent-"));
  process.env.SPS_PROVIDER_SECRET_DIR = vault;
  process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY = "cart-fixture";
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    "cart-fixture": randomBytes(32).toString("base64"),
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

it("checks out the buyer-approved 300 RUB selection and preserves only that purchase’s expert specification", async () => {
  try {
    await getDrizzle({}).transaction((tx) =>
      withConsistencyDatabase(tx, async () => {
        const worker = createService(createAppAssembly());
        const { rbac, ecommerce, crm, billing, social, knowledge } =
          worker.modules;
        const subject = rbac.subject;
        ecommerce.order.configureExpertArchive((scope) =>
          subject.orderWork.captureExpertArchive(scope),
        );
        const owner = await subject.create({ data: {} });
        const buyer = await subject.create({ data: {} });
        const stranger = await subject.create({ data: {} });
        const store = await ecommerce.store.create({ data: {} });
        const otherStore = await ecommerce.store.create({ data: {} });
        for (const target of [store, otherStore]) {
          await rbac.subjectsToEcommerceModuleStores.create({
            data: {
              subjectId: owner.id,
              ecommerceModuleStoreId: target.id,
              variant: "owner",
            },
          });
        }
        const rub = await billing.currency.create({
          data: {
            slug: `cart-rub-${randomUUID()}`,
            title: "RUB",
            symbol: "₽",
            minorUnitDigits: 2,
          },
        });
        const credits = await billing.currency.create({
          data: {
            slug: `cart-credits-${randomUUID()}`,
            title: "Work credits",
            symbol: "SPS",
          },
        });
        await tx.insert(Wallet).values({
          subjectId: owner.id,
          billingModuleCurrencyId: credits.id,
          amount: "20",
        });

        const createOffer = (storeId: string, title: string) =>
          subject.ecommerceCatalog.createOffer({
            subjectId: owner.id,
            data: {
              storeId,
              product: {
                title: { en: title },
                kind: "digital",
                formula: "unit_price * quantity",
              },
              prices: [{ currencyId: rub.id, amount: "1" }],
            },
          });
        const topUp = await createOffer(store.id, "Account top-up");
        const unrelatedOffer = await createOffer(store.id, "Separate item");
        const foreign = await createOffer(otherStore.id, "Other store top-up");
        const expert = await social.profile.create({
          data: {
            variant: "artificial-intelligence",
            title: { en: "Account expert" },
          },
        });
        await social.profilesToEcommerceModuleProducts.create({
          data: {
            profileId: expert.id,
            storeId: store.id,
            offerId: topUp.offer.id,
            variant: "store-expert",
          },
        });
        const specification = await knowledge.source.upsertSourceBySlug({
          slug: `cart-specification-${randomUUID()}`,
          title: "Top-up conditions",
          content: "Top-up conditions version A",
        });
        const specificationLink = {
          profileId: expert.id,
          knowledgeModuleSourceId: specification.id,
          offerId: topUp.offer.id,
          variant: "product-specification" as const,
        };
        await expect(
          social.profilesToKnowledgeModuleSources.create({
            data: { ...specificationLink, storeId: otherStore.id },
          }),
        ).rejects.toThrow(/offer.*store/i);
        await social.profilesToKnowledgeModuleSources.create({
          data: { ...specificationLink, storeId: store.id },
        });
        const privateNote = await knowledge.source.upsertSourceBySlug({
          slug: `cart-private-note-${randomUUID()}`,
          title: "Personal note",
          content: "Customer information must stay private",
          variant: "customer-memory",
        });
        await expect(
          social.profilesToKnowledgeModuleSources.create({
            data: {
              ...specificationLink,
              storeId: store.id,
              knowledgeModuleSourceId: privateNote.id,
            },
          }),
        ).rejects.toThrow(/specification needs content/i);
        const orderDraft = await crm.funnel.saveDraft({
          storeId: store.id,
          name: "Top-up purchases",
          kind: "physical-order",
          bindings: { offerIds: [topUp.offer.id] },
          definition: {
            initialStageId: "payment",
            stages: [
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
            ],
          },
        });
        await crm.funnel.publish({
          storeId: store.id,
          funnelId: orderDraft.id,
          expectedRevision: orderDraft.revision,
          actorId: owner.id,
          operationKey: randomUUID(),
        });
        const unrelated = await subject.ecommerceModuleOrderCreate({
          subjectId: buyer.id,
          storeId: store.id,
          productId: unrelatedOffer.product.id,
          offerId: unrelatedOffer.offer.id,
          billingModuleCurrencyId: rub.id,
          quantity: 2,
        });
        const form = await crm.form.create({
          data: { title: { en: "Account top-up enquiry" } },
        });
        const formStep = await crm.step.create({
          data: { title: { en: "Question" } },
        });
        const formField = await crm.input.create({
          data: {
            title: { en: "Message" },
            variant: "text-default",
            type: "text",
            isRequired: true,
          },
        });
        await crm.formsToSteps.create({
          data: { formId: form.id, stepId: formStep.id },
        });
        await crm.stepsToInputs.create({
          data: { stepId: formStep.id, inputId: formField.id },
        });
        const draft = await crm.funnel.saveDraft({
          storeId: store.id,
          name: "Top-up consultations",
          kind: "consultation",
          bindings: { offerIds: [topUp.offer.id], formIds: [form.id] },
          definition: {
            initialStageId: "choose",
            workFunding: {
              payer: "store-owner",
              currencyId: credits.id,
              maxTaskAmount: "20",
              maxRunAmount: "5",
            },
            stages: [
              {
                id: "choose",
                name: "Choose amount",
                cartOfferIds: [topUp.offer.id],
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
        const connection = await subject.providerConnections.change(owner.id, {
          operation: "connect",
          storeId: store.id,
          label: "Fixture",
          provider: "openai",
          externalAccount: "fixture-cart-account",
          secret: "offline-synthetic-key",
        });
        await subject.providerConnections.change(owner.id, {
          operation: "assign-default",
          storeId: store.id,
          connectionId: connection.id,
          capability: "text",
          model: "cart-fixture-model",
          terms: {
            maxInputTokens: 32000,
            maxOutputTokens: 300,
            maxCostUsd: "1",
            inputUsdPerMillion: "2",
            outputUsdPerMillion: "4",
            usdPerSps: "0.01",
            workMultiplier: "1.5",
            version: "test-v1",
          },
        });
        const ask = () =>
          subject.customerWork.execute(buyer.id, {
            operation: "ask",
            storeId: store.id,
            productId: topUp.product.id,
            offerId: topUp.offer.id,
            operationKey: randomUUID(),
          });
        async function submit(taskId: string, threadId: string) {
          const text = "Хочу пополнить на 300 рублей";
          const saved = await subject.customerWork.execute(buyer.id, {
            operation: "message",
            storeId: store.id,
            taskId,
            operationKey: randomUUID(),
            text,
          });
          const message = saved.messages.find((item) => item.body === text);
          if (!message) {
            throw new Error("The buyer message was not recorded");
          }
          const run = await subject.customerWork.pendingForMessage({
            threadId,
            messageId: message.id,
          });
          if (!run) {
            throw new Error("The store-funded request was not queued");
          }
          return run;
        }
        const consultation = await ask();
        const run = await submit(consultation.taskId, consultation.threadId);
        const { cartOffers, messages: originalContext } =
          await subject.customerWork.contextForRun(run);
        expect(
          originalContext.map(({ content }) => content).join("\n"),
        ).toContain("Top-up conditions version A");
        expect(cartOffers).toEqual([
          {
            offerId: topUp.offer.id,
            productId: topUp.product.id,
            title: "Account top-up",
            prices: [
              { currencyId: rub.id, currency: "RUB", unitAmount: "1.00" },
            ],
          },
        ]);
        const selection = {
          offerId: topUp.offer.id,
          currencyId: rub.id,
          quantity: 300,
        };
        await expect(
          subject.customerWork.deliverReply({
            ...run,
            attemptId: randomUUID(),
            text: "Other store",
            cartSelection: { ...selection, offerId: foreign.offer.id },
          }),
        ).rejects.toThrow(/unavailable for the current stage/);

        const external = jest
          .spyOn(globalThis, "fetch")
          .mockImplementation(async (request) => {
            expect(String(request)).toBe(
              "https://api.openai.com/v1/chat/completions",
            );
            return Response.json({
              id: "cart-fixture-result",
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      reply: "Предлагаю пополнение на 300 рублей.",
                      actionId: null,
                      cartSelection: selection,
                    }),
                  },
                },
              ],
              usage: { prompt_tokens: 30, completion_tokens: 10 },
            });
          });
        try {
          const execution = await worker.dispatch(run);
          expect(execution.state).toBe("delivered");
          expect((await worker.findById({ id: execution.id }))?.payerId).toBe(
            owner.id,
          );
          expect(external).toHaveBeenCalledTimes(1);
        } finally {
          external.mockRestore();
        }
        const waiting = await subject.customerWork.viewForThread(
          buyer.id,
          consultation.threadId,
        );
        const proposal = waiting.cartProposal;
        expect(proposal).toMatchObject({
          ...selection,
          amount: "300.00",
          currency: "RUB",
        });
        expect(proposal?.orderId).toBeUndefined();
        const command = {
          operation: "confirm-cart" as const,
          storeId: store.id,
          taskId: consultation.taskId,
          proposalId: proposal!.id,
          operationKey: randomUUID(),
        };
        await expect(
          subject.customerWork.execute(stranger.id, command),
        ).rejects.toThrow(/conversation could not be found/);
        const accepted = await subject.customerWork.execute(buyer.id, command);
        const orderId = accepted.cartProposal?.orderId;
        expect(orderId).toBeTruthy();
        expect(
          (
            await subject.customerWork.execute(buyer.id, {
              ...command,
              operationKey: randomUUID(),
            })
          ).cartProposal?.orderId,
        ).toBe(orderId);
        const typed = await subject.customerWork.execute(buyer.id, {
          operation: "message",
          storeId: store.id,
          taskId: consultation.taskId,
          text: "Добавить в корзину",
          operationKey: randomUUID(),
        });
        expect(typed.cartProposal?.orderId).toBe(orderId);
        const cart = await ecommerce.order.findByIdCartDetails({
          id: orderId!,
        });
        expect(
          cart.lines.map(({ offerId, quantity }) => ({ offerId, quantity })),
        ).toEqual([{ offerId: topUp.offer.id, quantity: 300 }]);
        await subject.ecommerceOrderCheckout(
          {
            id: buyer.id,
            provider: "dummy",
            billingModule: { currency: { id: rub.id } },
            ecommerceModule: { orders: [{ id: orderId! }] },
          },
          { deferProviderCheckout: true },
        );
        const paymentClaims =
          await ecommerce.order.ordersToBillingModulePaymentIntents.find({
            params: {
              filters: {
                and: [{ column: "orderId", method: "eq", value: orderId! }],
              },
            },
          });
        expect(paymentClaims).toHaveLength(1);
        expect(
          (await ecommerce.order.findById({ id: unrelated.orderId }))?.type,
        ).toBe("cart");
        expect(
          await ecommerce.order.ordersToBillingModulePaymentIntents.find({
            params: {
              filters: {
                and: [
                  { column: "orderId", method: "eq", value: unrelated.orderId },
                ],
              },
            },
          }),
        ).toHaveLength(0);

        const purchase = await ecommerce.order.work.findByOrder(orderId!);
        expect(purchase?.storeId).toBe(store.id);
        const purchaseScope = {
          orderId: orderId!,
          storeId: store.id,
          taskId: purchase!.taskId,
        };
        const readPurchase = () =>
          subject.orderWork.read(buyer.id, purchaseScope);
        expect((await readPurchase()).expertArchive).toBeUndefined();
        const intentId = paymentClaims[0].billingModulePaymentIntentId;
        await tx
          .update(PaymentIntent)
          .set({ status: "succeeded" })
          .where(eq(PaymentIntent.id, intentId));
        const invoice = await billing.invoice.create({
          data: { amount: 300, status: "paid", provider: "dummy" },
        });
        await billing.paymentIntentsToInvoices.create({
          data: { paymentIntentId: intentId, invoiceId: invoice.id },
        });
        const paying = await ecommerce.order.findById({ id: orderId! });
        const settle = {
          id: orderId!,
          expectedStatus: "paying",
          expectedUpdatedAt: paying!.updatedAt,
          onPaymentSucceeded: async () => {},
        };
        await ecommerce.order.completePaymentStatus(settle);
        const archived = [
          {
            sourceId: specification.id,
            versionDigest: specification.contentHash,
            title: specification.title,
            content: "Top-up conditions version A",
          },
        ];
        expect((await readPurchase()).expertArchive).toEqual(archived);
        await expect(
          subject.orderWork.read(stranger.id, purchaseScope),
        ).rejects.toThrow();
        await knowledge.source.updateSource({
          sourceId: specification.id,
          content: "Top-up conditions version B",
        });
        await ecommerce.order.completePaymentStatus(settle);
        expect((await readPurchase()).expertArchive).toEqual(archived);

        const expiryConsultation = await ask();
        const expiryRun = await submit(
          expiryConsultation.taskId,
          expiryConsultation.threadId,
        );
        const { messages: newContext } =
          await subject.customerWork.contextForRun(expiryRun);
        const currentContext = newContext
          .map(({ content }) => content)
          .join("\n");
        expect(currentContext).toContain("Top-up conditions version B");
        expect(currentContext).not.toContain("Top-up conditions version A");
        const expiryId = randomUUID();
        const delivered = await subject.customerWork.deliverReply({
          ...expiryRun,
          attemptId: expiryId,
          text: "This quote will expire",
          cartSelection: selection,
        });
        const message = await social.message.findById({
          id: delivered.messageId,
        });
        const expiredProposal = {
          ...message?.metadata?.customerWorkCartProposal,
          expiresAt: new Date(Date.now() - 1000).toISOString(),
        };
        await tx
          .update(SocialMessage)
          .set({
            metadata: {
              ...message?.metadata,
              customerWorkCartProposal: expiredProposal,
            },
          })
          .where(eq(SocialMessage.id, delivered.messageId));
        await expect(
          subject.customerWork.execute(buyer.id, {
            ...command,
            taskId: expiryConsultation.taskId,
            proposalId: expiryId,
            operationKey: randomUUID(),
          }),
        ).rejects.toThrow(/expired/);

        const notify = jest
          .spyOn(subjectApi, "notify")
          .mockImplementation(async () => {
            throw new Error("Synthetic delivery deferred");
          });
        try {
          const submitted = await subject.crmModuleFormRequestCreate({
            subjectId: buyer.id,
            crmModuleFormId: form.id,
            data: {
              submissionId: randomUUID(),
              steps: [
                {
                  id: formStep.id,
                  inputs: [
                    { id: formField.id, string: "I need help with a top-up." },
                  ],
                },
              ],
            },
          });
          const formTask = (
            await crm.task.find({
              params: {
                filters: {
                  and: [
                    {
                      column: "openingKey",
                      method: "eq",
                      value: `crm-form:${submitted.submissionResult.requestId}`,
                    },
                  ],
                },
              },
            })
          )[0];
          expect(formTask).toMatchObject({
            storeId: store.id,
            customerId: buyer.id,
            offerId: topUp.offer.id,
            productId: topUp.product.id,
          });
          expect(
            (
              await subject.customerWork.view(buyer.id, {
                storeId: store.id,
                taskId: formTask.id,
              })
            ).threadId,
          ).toBeTruthy();
          expect(notify).toHaveBeenCalledWith(
            expect.objectContaining({ id: owner.id }),
          );
        } finally {
          notify.mockRestore();
        }

        const telegramProfile = await social.profile.create({
          data: { variant: "telegram" },
        });
        const telegramChat = await social.chat.create({
          data: { variant: "telegram", sourceSystemId: "99224411" },
        });
        const telegramThread = await social.thread.create({ data: {} });
        await rbac.subjectsToSocialModuleProfiles.create({
          data: {
            variant: "telegram",
            subjectId: buyer.id,
            socialModuleProfileId: telegramProfile.id,
          },
        });
        await social.profilesToChats.create({
          data: { chatId: telegramChat.id, profileId: telegramProfile.id },
        });
        await social.chatsToThreads.create({
          data: { chatId: telegramChat.id, threadId: telegramThread.id },
        });
        await social.threadsToEcommerceModuleProducts.create({
          data: {
            threadId: telegramThread.id,
            ecommerceModuleProductId: topUp.product.id,
          },
        });
        const telegramInput = {
          customerId: buyer.id,
          chatId: telegramChat.id,
          threadId: telegramThread.id,
          profileId: telegramProfile.id,
          text: "Хочу пополнить на 300 рублей",
          sourceSystemId: "355",
          hasAttachments: false,
        };
        const telegramMessage =
          await subject.customerWork.messageFromThread(telegramInput);
        expect(telegramMessage?.description).toBe(telegramInput.text);
        expect(
          (await subject.customerWork.messageFromThread(telegramInput))?.id,
        ).toBe(telegramMessage?.id);
        const telegramWork = await subject.customerWork.viewForThread(
          buyer.id,
          telegramThread.id,
        );
        expect(telegramWork).toMatchObject({
          storeId: store.id,
          offerId: topUp.offer.id,
          chatId: telegramChat.id,
        });
        const browserThread = await ask();
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
        expect(buyerProfile).toBeDefined();
        const router = new Hono();
        const ownerGuard = new RequestSubjectIdOwner().init({
          requireJwt: true,
          activeSubjectId: (token) =>
            subject.isAuthorizedService.getSubjectId(token),
        });
        const authorization = async (subjectId: string) => ({
          Authorization: `Bearer ${await signJwt(
            { subjectId, type: "access", lifetimeInSeconds: 600 },
            RBAC_JWT_SECRET!,
          )}`,
        });
        const buyerHeaders = await authorization(buyer.id);
        const strangerHeaders = await authorization(stranger.id);
        const workChatGuard = new RequestCustomerWorkChat(
          subject.customerWork,
        ).init(true);
        router.post(
          "/api/rbac/subjects/:id/social-module/chats/:socialModuleChatId/profiles",
          ownerGuard,
          workChatGuard,
          (context) => context.body(null, 204),
        );
        router.patch(
          "/api/rbac/subjects/:id/social-module/chats/:socialModuleChatId",
          ownerGuard,
          workChatGuard,
          (context) => context.body(null, 204),
        );
        router.patch(
          "/api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId",
          ownerGuard,
          workChatGuard,
          (context, next) =>
            new MessageUpdateHandler(subject).execute(context, next),
        );
        router.post(
          "/api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/threads/:socialModuleThreadId/messages",
          ownerGuard,
          (context, next) => new MessageHandler(subject).execute(context, next),
        );
        router.on(
          ["GET", "HEAD"],
          "/api/rbac/subjects/:id/customer-work/threads/:threadId/messages/:messageId/attachments/:attachmentId",
          ownerGuard,
          (context) => new AttachmentHandler(subject).attachment(context),
        );
        const sourceSystemId = randomUUID();
        const script = "const fixture = 42;\n";
        const postMessage = async (source: string) => {
          const form = new FormData();
          form.set("data", JSON.stringify({ sourceSystemId }));
          form.append(
            "files",
            new File([source], "пример.js", { type: "text/javascript" }),
          );
          form.append("files", new File([], "empty.unknown"));
          return router.request(
            `/api/rbac/subjects/${buyer.id}/social-module/profiles/${buyerProfile.socialModuleProfileId}/chats/${browserThread.chatId}/threads/${browserThread.threadId}/messages`,
            { method: "POST", body: form, headers: buyerHeaders },
          );
        };
        const firstSend = await postMessage(script);
        expect(firstSend.status).toBe(200);
        const { data: chatMessage }: { data: IChatMessage } =
          await firstSend.json();
        expect(chatMessage.description).toBe("");
        expect(chatMessage.metadata).not.toHaveProperty(
          "customerWorkAttachments",
        );
        expect(chatMessage.privateAttachments?.map(({ name }) => name)).toEqual(
          ["пример.js", "empty.unknown"],
        );
        const repeated = await postMessage(script);
        const { data: replay }: { data: IChatMessage } = await repeated.json();
        expect(replay).toMatchObject({
          id: chatMessage.id,
          privateAttachments: chatMessage.privateAttachments,
        });
        expect((await postMessage("const fixture = 7;")).status).toBe(409);
        const [scriptFile] = chatMessage.privateAttachments!;
        const downloadPath = customerWorkAttachmentPath(
          buyer.id,
          browserThread.threadId,
          chatMessage.id,
          scriptFile.id,
        );
        const downloaded = await router.request(downloadPath, {
          headers: buyerHeaders,
        });
        expect(downloaded.status).toBe(200);
        expect(downloaded.headers.get("Content-Type")).toBe(
          "application/octet-stream",
        );
        expect(downloaded.headers.get("Content-Disposition")).toContain(
          "attachment;",
        );
        expect(downloaded.headers.get("X-Content-Type-Options")).toBe(
          "nosniff",
        );
        expect(await downloaded.text()).toBe(script);
        const head = await router.request(downloadPath, {
          method: "HEAD",
          headers: buyerHeaders,
        });
        expect(head.status).toBe(200);
        expect(await head.text()).toBe("");
        const other = customerWorkAttachmentPath(
          stranger.id,
          browserThread.threadId,
          chatMessage.id,
          scriptFile.id,
        );
        expect(
          (await router.request(other, { headers: strangerHeaders })).status,
        ).toBe(404);
        expect(
          (await router.request(downloadPath, { headers: strangerHeaders })).ok,
        ).toBe(false);
        expect((await router.request(downloadPath)).ok).toBe(false);
        const misplaced = customerWorkAttachmentPath(
          buyer.id,
          consultation.threadId,
          chatMessage.id,
          scriptFile.id,
        );
        expect(
          (await router.request(misplaced, { headers: buyerHeaders })).status,
        ).toBe(404);
        const fileEvent = await subject.customerWork.pendingForMessage({
          threadId: browserThread.threadId,
          messageId: chatMessage.id,
        });
        expect(fileEvent).toBeDefined();
        const fileContext = await subject.customerWork.contextForRun(
          fileEvent!,
        );
        expect(fileContext.media).toBeUndefined();
        expect(
          fileContext.attachments.map(({ id, name, mimeType }) => ({
            id,
            name,
            mimeType,
          })),
        ).toContainEqual({
          ...scriptFile,
          mimeType: "application/octet-stream",
        });
        const workedChat = `/api/rbac/subjects/${buyer.id}/social-module/chats/${browserThread.chatId}`;
        expect(
          (
            await router.request(workedChat + "/profiles", {
              method: "POST",
              headers: buyerHeaders,
            })
          ).status,
        ).toBe(403);
        expect(
          (
            await router.request(workedChat, {
              method: "PATCH",
              headers: buyerHeaders,
            })
          ).status,
        ).toBe(403);
        const ordinaryChat = await social.chat.create({ data: {} });
        await social.profilesToChats.create({
          data: {
            chatId: ordinaryChat.id,
            profileId: buyerProfile.socialModuleProfileId,
          },
        });
        const misplacedEdit = `/api/rbac/subjects/${buyer.id}/social-module/profiles/${buyerProfile.socialModuleProfileId}/chats/${ordinaryChat.id}/messages/${chatMessage.id}`;
        expect(
          (
            await router.request(misplacedEdit, {
              method: "PATCH",
              headers: buyerHeaders,
            })
          ).status,
        ).toBe(404);
        await expect(
          social.message.update({
            id: chatMessage.id,
            data: { description: "changed" },
          }),
        ).rejects.toThrow(/assigned workflow/);
        await expect(
          social.message.delete({ id: chatMessage.id }),
        ).rejects.toThrow(/assigned workflow/);
        expect(
          await social.message.findById({ id: chatMessage.id }),
        ).toMatchObject({
          description: "",
          variant: "customer-work",
        });
        expect(telegramWork.messages).toHaveLength(1);
        throw rollback;
      }),
    );
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  }
});
