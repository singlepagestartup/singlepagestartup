import { randomUUID } from "node:crypto";
import {
  createAppAssembly,
  withConsistencyDatabase,
  withConsistencyTransaction,
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
import { Service as CustomerKnowledge } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/knowledge";
import { Service as PersonalKnowledge } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/personal";
import { orderArtifactPath } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import { jsPDF } from "jspdf";

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
            storeId: null,
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

it("copies the paid delivered original privately and exposes its facts to the next expert through the buyer's profile", async () => {
  const rollback = new Error("Roll back order result fixtures");
  const scenario = withConsistencyTransaction(getDrizzle({}), async () => {
    const subject = createService(createAppAssembly());
    const { ecommerce, billing, knowledge, social } = subject.modules;
    const buyer = await subject.create({ data: {} });
    const stranger = await subject.create({ data: {} });
    const profile = await social.profile.create({
      data: { variant: "default" },
    });
    const secondProfile = await social.profile.create({
      data: { variant: "telegram" },
    });
    await subject.module.subjectsToSocialModuleProfiles.create({
      data: { subjectId: buyer.id, socialModuleProfileId: profile.id },
    });
    await subject.module.subjectsToSocialModuleProfiles.create({
      data: {
        subjectId: buyer.id,
        socialModuleProfileId: secondProfile.id,
        variant: "telegram",
      },
    });
    const order = await ecommerce.order.create({ data: {} });
    await subject.module.subjectsToEcommerceModuleOrders.create({
      data: { subjectId: buyer.id, ecommerceModuleOrderId: order.id },
    });
    const store = await ecommerce.store.create({ data: {} });
    const currency = await billing.currency.create({
      data: {
        slug: `order-result-${randomUUID()}`,
        title: "Fixture",
        symbol: "$",
      },
    });
    const work = ecommerce.order.work;
    const scope = {
      orderId: order.id,
      customerId: buyer.id,
      taskId: randomUUID(),
      storeId: store.id,
    };
    await work.register({ ...scope, kind: "individual-service" });
    const fact = "The business operates from Oak Quay 57.";
    const pdf = new jsPDF();
    pdf.text(fact, 20, 20);
    const original = Buffer.from(pdf.output("arraybuffer"));
    const revision = await work.publishResult({
      ...scope,
      actorId: buyer.id,
      operationKey: randomUUID(),
      currencyId: currency.id,
      price: "25",
      original: {
        name: "business-brief.pdf",
        mimeType: "application/pdf",
        bytes: original,
      },
      preview: {
        name: "preview.pdf",
        mimeType: "application/pdf",
        bytes: Buffer.from("Preview"),
      },
    });
    await work.accept({
      ...scope,
      fileId: revision.id,
      operationKey: randomUUID(),
    });
    const save = (actorId = buyer.id, artifactId = revision.originalFileId) =>
      subject.orderWork.setArtifactKnowledge(
        actorId,
        order.id,
        artifactId,
        "POST",
      );
    await expect(save()).rejects.toThrow(
      "Delivered order result is unavailable",
    );
    await ecommerce.order.repository.patchFulfillment(order.id, {
      state: "delivered",
      paid: {
        ...scope,
        id: randomUUID(),
        fileId: revision.id,
        currencyId: currency.id,
        invoiceId: randomUUID(),
        paymentIntentId: randomUUID(),
        price: "25",
        paidAt: new Date().toISOString(),
      },
      deliveredAt: new Date().toISOString(),
      resultFileId: revision.originalFileId,
      receiptFileId: randomUUID(),
    });
    await expect(save(stranger.id)).rejects.toThrow("does not belong");
    await expect(save(buyer.id, revision.previewFileId)).rejects.toThrow(
      "Delivered order result is unavailable",
    );
    await expect(save()).rejects.toThrow("Order artifact does not exist");
    const { role, subjectsToRoles } = subject.module;
    const grant = await role.create({
      data: {
        slug: `order-result-${randomUUID()}`,
        title: "Read the order result",
      },
    });
    const permission = await role.module.permission.create({
      data: {
        type: "HTTP",
        method: "GET",
        path: orderArtifactPath(buyer.id, order.id, revision.originalFileId),
      },
    });
    await role.module.rolesToPermissions.create({
      data: { roleId: grant.id, permissionId: permission.id },
    });
    await subjectsToRoles.create({
      data: { subjectId: buyer.id, roleId: grant.id },
    });

    const fetchEmbedding = globalThis.fetch;
    const provider = jest
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (request, init) => {
        if (String(request).endsWith("/chat/completions")) {
          return Response.json({
            choices: [{ finish_reason: "stop", message: { content: fact } }],
          });
        }
        return fetchEmbedding(request, init);
      });
    try {
      const slug = `personal-profile-${profile.id}-order-${order.id}-result-${revision.id}`;
      const sources = () => knowledge.source.find(criteria({ slug }));
      provider.mockImplementationOnce(async () =>
        Response.json({}, { status: 503 }),
      );
      await expect(save()).rejects.toThrow("OpenAI could not analyze");
      expect(await sources()).toEqual([]);
      expect(
        await social.profilesToKnowledgeModuleSources.find(
          criteria({ profileId: profile.id }),
        ),
      ).toEqual([]);

      const saved = await save();
      expect(saved).toEqual({
        profileId: profile.id,
        sourceId: expect.any(String),
      });
      await expect(save()).resolves.toEqual(saved);
      const [source] = await sources();
      expect(source.indexedContentHash).toBe(source.contentHash);
      expect(source.content).toContain(fact);
      await expect(
        new PersonalKnowledge(subject).update(buyer.id, profile.id, source.id, {
          expectedContentHash: source.contentHash!,
          expectedTitle: source.title,
          title: source.title,
          content: "This text was never delivered",
        }),
      ).rejects.toThrow("personal note is unavailable");
      const [attached] = await knowledge.source.sourceFiles(source.id);
      expect(attached.relation.variant).toBe("private-material");
      expect(attached.file.id).not.toBe(revision.originalFileId);
      const copy = await knowledge.source.readPrivateMaterial(
        source.id,
        attached.file.id,
      );
      expect(copy.bytes).toEqual(original);

      const expert = await social.profile.create({
        data: { variant: "artificial-intelligence" },
      });
      const skill = await social.skill.create({
        data: {
          slug: `strategy-${randomUUID()}`,
          title: "Strategy",
          description: "Prioritize local partnerships.",
        },
      });
      await social.profilesToSkills.create({
        data: { profileId: expert.id, skillId: skill.id },
      });
      const task = {
        id: randomUUID(),
        storeId: store.id,
        customerId: buyer.id,
        assigneeId: randomUUID(),
        assigneeKind: "ai",
      } as Task;
      const retrieval = new CustomerKnowledge(subject);
      const references = (senderProfileId: string) =>
        retrieval.context(
          task,
          {
            senderProfileId,
            agentProfileId: expert.id,
            stage: {
              name: "Strategy",
              skillIds: [skill.id],
              defaultAssigneeSubjectId: task.assigneeId!,
            },
          },
          "Which neighborhood should we prioritize?",
        );
      const next = await references(profile.id);
      expect(next.content).toContain(fact);
      expect(next.skillGuidance).toContain("Prioritize local partnerships.");
      expect(next.sourceVersions).toEqual([
        {
          id: source.id,
          version: source.contentHash,
          orderResultPath: `/rbac/subjects/orders/${order.id}#result-${revision.id}`,
        },
      ]);
      expect((await references(secondProfile.id)).knowledgeSourceIds).toEqual(
        [],
      );
      await expect(
        subject.orderWork.setArtifactKnowledge(
          buyer.id,
          order.id,
          revision.originalFileId,
          "DELETE",
        ),
      ).resolves.toEqual({ profileId: profile.id, sourceId: null });
      expect((await references(profile.id)).knowledgeSourceIds).toEqual([]);
      expect(await sources()).toEqual([]);
      expect(
        await subject.orderWork.artifact(
          buyer.id,
          order.id,
          revision.originalFileId,
          "GET",
        ),
      ).toMatchObject({ bytes: original });
    } finally {
      provider.mockRestore();
    }
    throw rollback;
  });
  await expect(scenario).rejects.toBe(rollback);
});
