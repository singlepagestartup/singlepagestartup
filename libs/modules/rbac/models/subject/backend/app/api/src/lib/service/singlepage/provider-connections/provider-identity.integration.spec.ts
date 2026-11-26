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
import { createService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { ProviderConnections } from ".";
import type { ProviderSecretStore } from "./secret-store";

it("keeps outbound provider assignments out of sign-in and scopes resolution to the assigned store and assistant", async () => {
  const db = getDrizzle({});
  const rollback = new Error("rollback provider fixtures");
  await expect(
    db.transaction(async (tx) =>
      withConsistencyDatabase(tx, async () => {
        const subject = createService(createAppAssembly());
        const owner = await subject.create({ data: {} });
        const assistant = await subject.create({ data: { variant: "agent" } });
        const store = await subject.modules.ecommerce.store.create({
          data: {},
        });
        const storeLinks = subject.module.subjectsToEcommerceModuleStores;
        await storeLinks.create({
          data: {
            variant: "owner",
            subjectId: owner.id,
            ecommerceModuleStoreId: store.id,
          },
        });
        await storeLinks.create({
          data: {
            variant: "crm-agent",
            subjectId: assistant.id,
            ecommerceModuleStoreId: store.id,
          },
        });
        const vault = { put: jest.fn(), read: jest.fn() };
        const providers = new ProviderConnections(
          subject,
          vault as unknown as ProviderSecretStore,
        );
        const connect = {
          operation: "connect",
          storeId: store.id,
          provider: "openai",
          label: "Store account",
          externalAccount: "synthetic",
          secret: "synthetic-secret",
        } as const;
        await expect(providers.change(assistant.id, connect)).rejects.toThrow(
          "ownership",
        );
        const created = await providers.change(owner.id, connect);
        const links = subject.module.subjectsToIdentities;
        const [connection] = await links.providerConnections(store.id, {
          id: created.id,
        });
        expect(
          (await subject.findById({ id: connection.subjectId }))?.variant,
        ).toBe("provider-agent");
        const identities = subject.module.identity;
        await expect(
          identities.findById({ id: connection.identityId }),
        ).resolves.toBeFalsy();
        await expect(
          identities.find({
            params: {
              filters: {
                and: [
                  { column: "id", method: "eq", value: connection.identityId },
                ],
              },
            },
          }),
        ).resolves.toEqual([]);
        await expect(
          identities.update({
            id: connection.identityId,
            data: { email: "test@example.com" } as Parameters<
              typeof identities.update
            >[0]["data"],
          }),
        ).resolves.toBeNull();
        await identities.delete({ id: connection.identityId });
        const assignment = {
          operation: "assign-default",
          storeId: store.id,
          connectionId: created.id,
          capability: "text",
          model: "example-model",
          terms: {
            maxInputTokens: 128,
            maxOutputTokens: 64,
            maxCostUsd: "1",
            inputUsdPerMillion: "1",
            outputUsdPerMillion: "1",
            usdPerSps: "1",
            workMultiplier: "1",
            version: "test",
          },
        } as const;
        await providers.change(owner.id, assignment);
        await providers.change(owner.id, {
          ...assignment,
          operation: "assign",
          assistantId: assistant.id,
          model: "assistant-model",
        });
        await expect(
          links.find({
            params: {
              filters: {
                and: [
                  {
                    column: "identityId",
                    method: "eq",
                    value: connection.identityId,
                  },
                ],
              },
            },
          }),
        ).resolves.toEqual([]);
        await expect(
          links.update({ id: connection.id, data: { variant: "default" } }),
        ).resolves.toBeNull();
        await expect(
          links.create({
            data: {
              identityId: connection.identityId,
              subjectId: assistant.id,
            },
          }),
        ).rejects.toThrow("inbound");
        await expect(
          providers.resolve(store.id, assistant.id, "text"),
        ).resolves.toMatchObject({
          identityId: connection.identityId,
          model: "assistant-model",
        });
        await expect(
          providers.resolve(randomUUID(), assistant.id, "text"),
        ).rejects.toThrow("does not belong");
        await providers.change(owner.id, {
          operation: "revoke",
          storeId: store.id,
          connectionId: connection.id,
          expectedVersion: connection.version,
        });
        await expect(
          providers.resolve(store.id, assistant.id, "text"),
        ).rejects.toThrow("inactive");
        throw rollback;
      }),
    ),
  ).rejects.toBe(rollback);
});

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
});
