import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
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
import { Table as Currency } from "@sps/billing/models/currency/backend/repository/database";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";
import { loadScenarioEnv } from "../issue-154/test-utils/env";

loadScenarioEnv();
const rollback = new Error("rollback scenario fixtures");
const savedEnvironment = {
  SPS_PROVIDER_SECRET_DIR: process.env.SPS_PROVIDER_SECRET_DIR,
  SPS_PROVIDER_ACTIVE_MASTER_KEY: process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY,
  SPS_PROVIDER_MASTER_KEYS: process.env.SPS_PROVIDER_MASTER_KEYS,
};
let vault: string;

beforeAll(async () => {
  vault = await mkdtemp(path.join(tmpdir(), "sps-test-work-"));
  process.env.SPS_PROVIDER_SECRET_DIR = vault;
  process.env.SPS_PROVIDER_ACTIVE_MASTER_KEY = "scenario";
  process.env.SPS_PROVIDER_MASTER_KEYS = JSON.stringify({
    scenario: randomBytes(32).toString("base64"),
  });
});

afterAll(async () => {
  for (const [key, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(vault, { recursive: true, force: true });
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) kv.client.disconnect();
});

it.each(["openrouter", "openai"] as const)(
  "settles a CRM chat reply once through the assigned %s identity",
  async (provider) => {
    // Exercise the regular services and database. Only the paid HTTP boundary is replaced.
    const external = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url) => {
        expect(String(url)).toBe(
          provider === "openrouter"
            ? "https://openrouter.ai/api/v1/chat/completions"
            : "https://api.openai.com/v1/chat/completions",
        );
        return Response.json({
          id: "scenario-completion",
          choices: [
            {
              message: {
                content: "The selected phone uses a lithium-ion battery.",
              },
            },
          ],
          usage: {
            prompt_tokens: 40,
            completion_tokens: 10,
            ...(provider === "openrouter" ? { cost: 0.001 } : {}),
          },
        });
      });
    try {
      await getDrizzle({}).transaction(async (tx) =>
        withConsistencyDatabase(tx, async () => {
          const service = createService(createAppAssembly());
          const { rbac, ecommerce, crm } = service.modules;
          const owner = await rbac.subject.create({
            data: { variant: "default" },
          });
          const customer = await rbac.subject.create({
            data: { variant: "default" },
          });
          const store = await ecommerce.store.create({ data: {} });
          const product = await ecommerce.product.create({
            data: { adminTitle: "Scenario phone" },
          });
          const offer = await ecommerce.storesToProducts.create({
            data: {
              storeId: store.id,
              productId: product.id,
              sku: randomUUID(),
            },
          });
          const storeId = store.id;
          const currencyId = randomUUID();
          await tx
            .insert(Currency)
            .values({ id: currencyId, title: "Work credits", symbol: "SPS" });
          await tx
            .insert(Wallet)
            .values({
              subjectId: owner.id,
              billingModuleCurrencyId: currencyId,
              amount: "20",
            });
          await rbac.subjectsToEcommerceModuleStores.create({
            data: {
              subjectId: owner.id,
              ecommerceModuleStoreId: storeId,
              variant: "owner",
            },
          });
          const funnel = await crm.funnel.saveDraft({
            storeId,
            name: "Product question",
            kind: "consultation",
            bindings: { offerIds: [offer.id] },
            definition: {
              initialStageId: "reply",
              workFunding: {
                payer: "store-owner",
                currencyId,
                maxTaskAmount: "20",
                maxRunAmount: "5",
              },
              stages: [
                {
                  id: "reply",
                  name: "Reply",
                  instruction: "Answer the product question.",
                  actions: [],
                },
              ],
            },
          });
          await crm.funnel.publish({
            storeId,
            funnelId: funnel.id,
            expectedRevision: funnel.revision,
            actorId: owner.id,
            operationKey: randomUUID(),
          });
          const initial = await rbac.subject.customerWork.execute(customer.id, {
            operation: "ask",
            storeId,
            offerId: offer.id,
            productId: product.id,
            operationKey: randomUUID(),
          });
          const task = await crm.task.get({ storeId, taskId: initial.taskId });
          if (!task.assigneeId)
            throw new Error("Consultation must have an assigned assistant");
          const connections = rbac.subject.providerConnections;
          const credential = "synthetic-test-credential";
          const connected = await connections.change(owner.id, {
            operation: "connect",
            storeId,
            label: provider,
            provider,
            externalAccount: "scenario-account",
            secret: credential,
          });
          await connections.change(owner.id, {
            ...(provider === "openai"
              ? { operation: "assign-default" as const }
              : { operation: "assign" as const, assistantId: task.assigneeId }),
            storeId,
            connectionId: connected.id,
            capability: "text",
            model: "scenario-model",
            terms: {
              maxInputTokens: 32000,
              maxOutputTokens: 128,
              maxCostUsd: "1",
              inputUsdPerMillion: "2",
              outputUsdPerMillion: "4",
              usdPerSps: "0.01",
              workMultiplier: "1.5",
              version: "test-v1",
            },
          });
          await expect(connections.list(customer.id, storeId)).rejects.toThrow(
            "Store ownership",
          );
          const posted = await rbac.subject.customerWork.execute(customer.id, {
            operation: "message",
            storeId,
            taskId: initial.taskId,
            operationKey: randomUUID(),
            text: "Which battery does this phone use?",
          });
          const item = posted.messages.find(
            (row) => row.body === "Which battery does this phone use?",
          );
          if (!item) throw new Error("Customer message missing");
          const pending = await rbac.subject.customerWork.pendingForMessage({
            threadId: posted.threadId,
            messageId: item.id,
          });
          if (!pending) throw new Error("Assigned CRM event missing");
          const reply = await service.dispatch(pending);
          expect(reply.state).toBe("delivered");
          expect(await service.dispatch(pending)).toEqual(reply);
          expect(external).toHaveBeenCalledTimes(1);
          const view = await rbac.subject.customerWork.viewForThread(
            customer.id,
            initial.threadId,
          );
          expect(
            view?.messages.filter((row) => row.body.includes("lithium-ion")),
          ).toHaveLength(1);
          const report = await connections.list(owner.id, storeId);
          expect(JSON.stringify(report)).not.toContain(credential);
          const held = report.operations.find((op) => op.kind === "reserve");
          const transfers = report.operations.filter(
            (op) => op.kind === "transfer",
          );
          expect(held?.providerWork).toMatchObject({
            provider,
            attemptId: reply.id,
            state: "delivered",
            basis: provider === "openrouter" ? "provider" : "rate-card",
          });
          expect(transfers).toHaveLength(2);
          const charge = provider === "openrouter" ? 0.1 : 0.012;
          expect(
            Number(transfers.find((op) => op.senderId === owner.id)?.amount),
          ).toBeCloseTo(charge * 1.5, 10);
          expect(
            Number(
              transfers.find(
                (op) => op.recipientId === report.connections[0].subjectId,
              )?.amount,
            ),
          ).toBeCloseTo(charge, 10);
          expect(
            Number(
              await rbac.subjectsToBillingModuleCurrencies.total(
                customer.id,
                currencyId,
              ),
            ),
          ).toBe(0);
          const ambiguous = await rbac.subject.customerWork.execute(
            customer.id,
            {
              operation: "message",
              storeId,
              taskId: initial.taskId,
              operationKey: randomUUID(),
              text: "One more question",
            },
          );
          const messageId = ambiguous.messages.find(
            (row) => row.body === "One more question",
          )?.id;
          if (!messageId) throw new Error("Second customer event missing");
          const second = await rbac.subject.customerWork.pendingForMessage({
            threadId: ambiguous.threadId,
            messageId,
          });
          if (!second) throw new Error("Second work request missing");
          external.mockRejectedValueOnce(new Error("Transport interrupted"));
          const unknown = await service.dispatch(second);
          expect(unknown.state).toBe("unknown");
          expect(await service.dispatch(second)).toEqual(unknown);
          const resolution =
            provider === "openai"
              ? { kind: "no-charge" as const, reference: "statement-218" }
              : {
                  kind: "charged" as const,
                  reference: "statement-418",
                  usd: "0.0004",
                  inputTokens: 12,
                  outputTokens: 6,
                };
          await connections.change(owner.id, {
            operation: "reconcile",
            storeId,
            connectionId: connected.id,
            attemptId: unknown.id,
            resolution,
          });
          await service.reconcile(30, storeId);
          const reconciled = (
            await connections.list(owner.id, storeId)
          ).operations.find((op) => op.providerWork?.attemptId === unknown.id);
          expect(reconciled?.state).toBe(
            provider === "openai" ? "released" : "settled",
          );
          expect(reconciled?.providerWork?.resolution).toMatchObject({
            ...resolution,
            actorId: owner.id,
          });
          expect(reconciled?.providerWork?.state).toBe("failed");
          expect(external).toHaveBeenCalledTimes(2);
          throw rollback;
        }),
      );
      throw new Error("Expected scenario rollback");
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      external.mockRestore();
    }
  },
  90_000,
);
