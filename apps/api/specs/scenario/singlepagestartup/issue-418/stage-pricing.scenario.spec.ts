import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
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
import { loadScenarioEnv } from "../issue-154/test-utils/env";

loadScenarioEnv();
const rollback = new Error("Rollback stage pricing fixtures");
const originalKey = process.env.OPEN_AI_API_KEY;
const originalProduct = process.env.AI_WORK_TOKEN_TOPUP_PRODUCT_ID;
afterAll(async () => {
  if (originalKey === undefined) {
    delete process.env.OPEN_AI_API_KEY;
  } else {
    process.env.OPEN_AI_API_KEY = originalKey;
  }
  if (originalProduct === undefined) {
    delete process.env.AI_WORK_TOKEN_TOPUP_PRODUCT_ID;
  } else {
    process.env.AI_WORK_TOKEN_TOPUP_PRODUCT_ID = originalProduct;
  }
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it.each([
  { multiplier: "1.5", runLimit: undefined, balance: "100", allowed: true },
  { multiplier: "0", runLimit: "0", balance: "0", allowed: true },
  { multiplier: "1.5", runLimit: "0.01", balance: "100", allowed: true },
  { multiplier: "1.5", runLimit: "90", balance: "0", allowed: false },
])(
  "bills one reply at coefficient $multiplier, legacy run limit $runLimit and balance $balance",
  async ({ multiplier, runLimit, balance, allowed }) => {
    const paid = multiplier !== "0";
    const http = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
        return Response.json({
          id: "test-receipt",
          choices: [{ message: { content: "Answer from the assistant." } }],
          usage: { prompt_tokens: 100, completion_tokens: 25 },
        });
      });
    try {
      process.env.OPEN_AI_API_KEY = "synthetic-only";
      await getDrizzle({}).transaction((tx) =>
        withConsistencyDatabase(tx, async () => {
          const worker = createService(createAppAssembly());
          const { rbac, billing, ecommerce, crm } = worker.modules;
          const buyer = await rbac.subject.create({ data: {} });
          const owner = await rbac.subject.create({ data: {} });
          const identity = await rbac.identity.create({
            data: {
              provider: "email_and_password",
              email: buyer.id + "@example.invalid",
            },
          });
          await rbac.subjectsToIdentities.create({
            data: { subjectId: buyer.id, identityId: identity.id },
          });
          const store = await ecommerce.store.create({ data: {} });
          await rbac.subjectsToEcommerceModuleStores.create({
            data: {
              subjectId: owner.id,
              ecommerceModuleStoreId: store.id,
              variant: "owner",
            },
          });
          const [token] = await billing.currency.find({
            params: {
              filters: {
                and: [{ column: "slug", method: "eq", value: "token" }],
              },
            },
          });
          const [usd] = await billing.currency.find({
            params: {
              filters: {
                and: [{ column: "slug", method: "eq", value: "usd" }],
              },
            },
          });
          const pack = await ecommerce.product.create({
            data: { adminTitle: "Platform top-up" },
          });
          process.env.AI_WORK_TOKEN_TOPUP_PRODUCT_ID = pack.id;
          const moneyAttributeIds: string[] = [];
          for (const [type, amount, currencyId] of [
            ["price", "3", usd.id],
            ["topup", "1000", token.id],
          ]) {
            const key = await ecommerce.attributeKey.create({ data: { type } });
            const attribute = await ecommerce.attribute.create({
              data: { number: amount },
            });
            await ecommerce.attributeKeysToAttributes.create({
              data: { attributeKeyId: key.id, attributeId: attribute.id },
            });
            await ecommerce.attributesToBillingModuleCurrencies.create({
              data: {
                attributeId: attribute.id,
                billingModuleCurrencyId: currencyId,
              },
            });
            await ecommerce.productsToAttributes.create({
              data: { productId: pack.id, attributeId: attribute.id },
            });
            moneyAttributeIds.push(attribute.id);
          }
          const product = await ecommerce.product.create({ data: {} });
          const offer = await ecommerce.storesToProducts.create({
            data: {
              storeId: store.id,
              productId: product.id,
              sku: randomUUID(),
            },
          });
          const expert = await rbac.subject.crmWorkspace.execute(owner.id, {
            kind: "create-employee",
            employee: {
              storeId: store.id,
              name: "Store specialist",
              operationKey: randomUUID(),
            },
          });
          if (expert.kind !== "create-employee") {
            throw new Error("Expected a store employee");
          }
          await rbac.subjectsToEcommerceModuleProducts.create({
            data: {
              subjectId: expert.data.id,
              ecommerceModuleProductId: product.id,
              variant: "store-expert",
            },
          });
          const stage = {
            defaultAssigneeSubjectId: expert.data.id,
            id: "reply",
            name: "Reply",
            instruction: "Answer the question",
            actions: [],
            workFunding: {
              payer: "customer" as const,
              multiplier,
              currencyId: token.id,
              ...(runLimit !== undefined && {
                maxStageAmount: runLimit,
                maxRunAmount: runLimit,
              }),
            },
          };
          await crm.funnel.save({
            storeId: store.id,
            name: "Offer advice",
            kind: "consultation",
            definition: { initialStageId: "reply", stages: [stage] },
            bindings: { offerIds: [offer.id] },
          });
          if (balance !== "0") {
            await tx.insert(Wallet).values({
              subjectId: buyer.id,
              billingModuleCurrencyId: token.id,
              amount: balance,
            });
          }
          const work = rbac.subject.customerWork;
          const initial = await work.execute(buyer.id, {
            operation: "ask",
            storeId: store.id,
            offerId: offer.id,
            productId: product.id,
            operationKey: randomUUID(),
          });
          const scope = { storeId: store.id, taskId: initial.taskId };
          const quote = await work.view(buyer.id, scope);
          if (paid) {
            expect(quote.price?.rates[0]).toMatchObject({
              topupProductId: pack.id,
              topupUsd: "3",
              topupTokens: "1000",
              workMultiplier: multiplier,
            });
            if (!quote.price) {
              throw new Error("Missing customer quote");
            }
            await ecommerce.attribute.update({
              id: moneyAttributeIds[0],
              data: { number: "6" },
            });
            await expect(
              work.execute(buyer.id, {
                ...scope,
                operation: "approve-budget",
                maximum: "100",
                priceKey: quote.price.key,
                operationKey: randomUUID(),
              }),
            ).rejects.toThrow();
            await ecommerce.attribute.update({
              id: moneyAttributeIds[0],
              data: { number: "3" },
            });
            expect(quote.requiredMaximum).toBeUndefined();
            await expect(
              work.execute(buyer.id, {
                ...scope,
                operation: "approve-budget",
                maximum: "100",
                priceKey: quote.price.key,
                operationKey: randomUUID(),
              }),
            ).rejects.toThrow("Reload the current work price");
            await work.execute(buyer.id, {
              ...scope,
              operation: "approve-budget",
              priceKey: quote.price.key,
              operationKey: randomUUID(),
            });
          } else {
            expect(quote.price).toBeUndefined();
          }
          const posted = await work.execute(buyer.id, {
            ...scope,
            operation: "message",
            text: "Product details?",
            operationKey: randomUUID(),
          });
          const question = posted.messages.find(
            (it) => it.body === "Product details?",
          );
          if (!question) {
            throw new Error("Missing question");
          }
          const event = await work.pendingForMessage({
            threadId: posted.threadId,
            messageId: question.id,
          });
          if (!event) {
            throw new Error("Missing work event");
          }
          if (!allowed) {
            await expect(worker.dispatch(event)).rejects.toThrow(
              /Payment required/,
            );
            expect(http).not.toHaveBeenCalled();
            expect(
              (await rbac.subject.providerConnections.list(owner.id, store.id))
                .operations,
            ).toHaveLength(0);
            throw rollback;
          }
          const first = await worker.dispatch(event);
          expect(first.state).toBe("delivered");
          await ecommerce.attribute.update({
            id: moneyAttributeIds[0],
            data: { number: "99" },
          });
          expect(await worker.dispatch(event)).toEqual(first);
          expect(http).toHaveBeenCalledTimes(1);
          const attempt = await worker.findById({ id: first.id });
          expect(attempt?.payerId).toBe(buyer.id);
          const charges = (
            await rbac.subject.providerConnections.list(owner.id, store.id)
          ).operations.filter((it) => it.kind === "transfer");
          const expected = new Decimal("0.0018")
            .times(1000)
            .div(3)
            .times(multiplier);
          expect(charges).toHaveLength(paid ? 1 : 0);
          if (paid) {
            expect(new Decimal(charges[0].amount).equals(expected)).toBe(true);
            expect(charges[0].senderId).toBe(buyer.id);
          } else {
            expect(attempt?.workReceiptId).toBeNull();
            expect(attempt?.terms.workMultiplier).toBe("0");
          }
          throw rollback;
        }),
      );
      throw new Error("Expected rollback");
    } catch (err) {
      if (err !== rollback) {
        throw err;
      }
    } finally {
      http.mockRestore();
    }
  },
);
