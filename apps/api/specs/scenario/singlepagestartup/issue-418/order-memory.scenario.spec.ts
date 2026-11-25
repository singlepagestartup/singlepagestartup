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
import { criteria } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/utils";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER } from "@sps/shared-utils";
import { useFixtureEmbeddings } from "../../test-utils/knowledge-embeddings";

useFixtureEmbeddings();
const originalKey = process.env.OPEN_AI_API_KEY;
beforeAll(() => {
  process.env.OPEN_AI_API_KEY = "order-memory-embedding-fixture";
});
afterAll(async () => {
  if (originalKey === undefined) {
    delete process.env.OPEN_AI_API_KEY;
  } else {
    process.env.OPEN_AI_API_KEY = originalKey;
  }
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("commits an order note, its profile link and its current vectors together on create, edit and chat retry", async () => {
  const rollback = new Error("Roll back order-memory fixtures");
  const scenario = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const subject = createService(createAppAssembly());
      const { crm, ecommerce, knowledge, social } = subject.modules;
      const buyer = await subject.create({ data: {} });
      const identity = await subject.module.identity.create({
        data: { email: buyer.id + "@example.test" },
      });
      await subject.module.subjectsToIdentities.create({
        data: { subjectId: buyer.id, identityId: identity.id },
      });
      const store = await ecommerce.store.create({ data: {} });
      const product = await ecommerce.product.create({
        data: { adminTitle: "Test clock" },
      });
      const offer = await ecommerce.storesToProducts.create({
        data: { storeId: store.id, productId: product.id, sku: randomUUID() },
      });
      await crm.funnel.save({
        storeId: store.id,
        name: "Clock orders",
        kind: "consultation",
        bindings: { offerIds: [offer.id] },
        definition: {
          initialStageId: "review",
          stages: [{ id: "review", name: "Review", actions: [] }],
        },
      });
      const work = subject.customerWork;
      const order = await work.execute(buyer.id, {
        operation: "ask",
        storeId: store.id,
        productId: product.id,
        offerId: offer.id,
        operationKey: randomUUID(),
      });
      const [owner] = await subject.module.subjectsToSocialModuleProfiles.find(
        criteria({ subjectId: buyer.id, variant: "default" }),
      );
      const profileId = owner.socialModuleProfileId;
      const scope = { storeId: store.id, taskId: order.taskId };
      const note = {
        ...scope,
        operation: "remember" as const,
        text: "Use blue for my clock designs.",
        operationKey: randomUUID(),
      };
      const links = () =>
        social.profilesToKnowledgeModuleSources.find(
          criteria({ profileId, variant: "customer-memory" }),
        );
      const stored = () =>
        knowledge.source.find(
          criteria({
            slug: `customer-memory-${profileId}-${note.operationKey}`,
          }),
        );
      const provider = jest.spyOn(globalThis, "fetch");
      const fail = () =>
        provider.mockImplementationOnce(async (url) => {
          expect(String(url)).toBe("https://api.openai.com/v1/embeddings");
          return Response.json(
            { error: { message: "Embedding provider unavailable" } },
            { status: 503 },
          );
        });
      try {
        fail();
        await expect(work.execute(buyer.id, note)).rejects.toMatchObject({
          status: 503,
        });
        expect(await stored()).toEqual([]);
        expect(await links()).toEqual([]);
        await work.execute(buyer.id, note);
        const [initial] = await stored();
        expect(initial.indexedContentHash).toBe(initial.contentHash);
        expect(await links()).toEqual([
          expect.objectContaining({
            knowledgeModuleSourceId: initial.id,
            storeId: store.id,
            projectId: null,
          }),
        ]);
        const [initialChunk] = await knowledge.sourcesToChunks.forSources([
          initial.id,
        ]);
        const rendered = await knowledge.chunk.findById({
          id: initialChunk.chunkId,
        });
        expect(rendered?.text).toContain(note.text);
        expect(rendered?.embedding.length).toBeGreaterThan(0);

        const edit = {
          ...note,
          sourceId: initial.id,
          text: "Use green for my clock designs.",
          operationKey: randomUUID(),
        };
        fail();
        await expect(work.execute(buyer.id, edit)).rejects.toMatchObject({
          status: 503,
        });
        expect(await stored()).toEqual([initial]);
        expect(
          await knowledge.sourcesToChunks.forSources([initial.id]),
        ).toEqual([initialChunk]);
        await work.execute(buyer.id, edit);
        const [current] = await stored();
        expect(current.contentHash).not.toBe(initial.contentHash);
        expect(current.indexedContentHash).toBe(current.contentHash);
        const [updatedChunk] = await knowledge.sourcesToChunks.forSources([
          initial.id,
        ]);
        expect(
          (await knowledge.chunk.findById({ id: updatedChunk.chunkId }))?.text,
        ).toContain(edit.text);

        const chatMessage = {
          customerId: buyer.id,
          profileId,
          chatId: order.chatId,
          threadId: order.threadId,
          sourceSystemId: randomUUID(),
          hasAttachments: false,
          text: "Запомни: Мне нравятся крупные цифры.",
        };
        fail();
        await expect(work.messageFromThread(chatMessage)).rejects.toMatchObject(
          { status: 503 },
        );
        expect(
          await social.message.find(
            criteria({ sourceSystemId: chatMessage.sourceSystemId }),
          ),
        ).toEqual([]);
        expect(await links()).toHaveLength(1);
        const message = await work.messageFromThread(chatMessage);
        expect(message?.description).toBe(chatMessage.text);
        const [chatLink] = (await links()).filter(
          (x) => x.knowledgeModuleSourceId !== initial.id,
        );
        expect(
          await knowledge.source.freshHeaders(
            [chatLink.knowledgeModuleSourceId],
            true,
          ),
        ).toHaveLength(1);
        const calls = provider.mock.calls.length;
        expect((await work.messageFromThread(chatMessage))?.id).toBe(
          message?.id,
        );
        expect(provider).toHaveBeenCalledTimes(calls);
        expect(await links()).toHaveLength(2);
      } finally {
        provider.mockRestore();
      }
      throw rollback;
    }),
  );
  await expect(scenario).rejects.toBe(rollback);
});
