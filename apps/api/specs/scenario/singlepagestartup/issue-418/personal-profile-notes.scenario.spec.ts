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
import { Service as PersonalSources } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/personal";
import { Service as ProfileSources } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/sources";
import { Service as Training } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/crm/workspace/training";
import { useFixtureEmbeddings } from "../../test-utils/knowledge-embeddings";

useFixtureEmbeddings();
const rollback = new Error("Roll back personal knowledge scenario");
const previousKey = process.env.OPEN_AI_API_KEY;
beforeAll(() => {
  process.env.OPEN_AI_API_KEY = "personal-notes-embedding-fixture";
});

it("rolls back private and employee sources, links, chat messages and chunks when embeddings fail, and permits retry", async () => {
  const scenario = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const subject = createService(createAppAssembly());
      const { social, knowledge, ecommerce, fileStorage } = subject.modules;
      const [owner, store] = await Promise.all([
        subject.create({ data: {} }),
        ecommerce.store.create({ data: {} }),
      ]);
      await subject.module.subjectsToEcommerceModuleStores.create({
        data: {
          subjectId: owner.id,
          ecommerceModuleStoreId: store.id,
          variant: "owner",
        },
      });
      const employee = await subject.crmWorkspace.employees.create(owner.id, {
        storeId: store.id,
        name: "Training rollback",
        operationKey: randomUUID(),
      });
      const chat = await social.chat.findById({ id: employee.chatId });
      if (!chat) {
        throw new Error("Missing training chat");
      }
      const scope = await subject.crmWorkspace.employees.scopeForChat(
        owner.id,
        chat,
        employee.threadId,
      );
      const notes = new PersonalSources(subject);
      const staff = new ProfileSources(subject);
      const training = new Training(subject);
      const request = {
        actorId: owner.id,
        actorProfileId: scope.actorProfileId,
        chat,
        threadId: scope.threadId,
        text: "Remember the agreed delivery time.",
        sourceSystemId: randomUUID(),
        attachments: [
          new File(["example"], "terms.txt", { type: "text/plain" }),
        ],
      };
      const first = {
        title: "Original title",
        content: "Original indexed content.",
        operationKey: randomUUID(),
      };
      const privateSource = (
        await notes.create(owner.id, scope.actorProfileId, first)
      ).source;
      const newPrivate = {
        title: "New personal note",
        content: "New text to index",
        operationKey: randomUUID(),
      };
      const staffNote = {
        profileId: employee.profileId,
        storeId: store.id,
        slug: "staff-" + randomUUID(),
        title: "New staff note",
        content: "Index this staff note.",
      };
      const originalStaff = (
        await staff.create(owner.id, {
          ...staffNote,
          slug: "staff-" + randomUUID(),
          title: "Established staff note",
          content: "Established staff instructions",
        })
      ).source;
      const staffEdit = {
        sourceId: originalStaff.id,
        title: "Edited staff title",
        content: "Changed staff instructions",
      };
      const edit = {
        expectedContentHash: privateSource.contentHash,
        expectedTitle: privateSource.title,
        title: "Changed title",
        content: "New personal index version",
      };
      const counts = () =>
        Promise.all([
          knowledge.source.count(),
          knowledge.source.module.sourcesToChunks.count(),
          knowledge.source.module.chunk.count(),
          social.message.count(),
          social.chatsToMessages.count(),
          social.threadsToMessages.count(),
          social.profilesToMessages.count(),
          social.profilesToKnowledgeModuleSources.count(),
          social.messagesToKnowledgeModuleSources.count(),
          fileStorage.file.privateContent.count(),
        ]);
      const before = await counts();
      const oldIndex = await knowledge.source.module.sourcesToChunks.forSources(
        [privateSource.id],
      );
      expect(oldIndex.length).toBeGreaterThan(0);
      const fixtureFetch = globalThis.fetch;
      const failing = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (url, init) => {
          if (String(url).endsWith("/embeddings")) {
            return Response.json(
              { error: { message: "synthetic provider outage" } },
              { status: 503 },
            );
          }
          return fixtureFetch(url, init);
        });
      try {
        await expect(
          notes.create(owner.id, scope.actorProfileId, newPrivate),
        ).rejects.toMatchObject({ status: 503 });
        await expect(
          notes.update(owner.id, scope.actorProfileId, privateSource.id, edit),
        ).rejects.toMatchObject({ status: 503 });
        await expect(staff.create(owner.id, staffNote)).rejects.toMatchObject({
          status: 503,
        });
        await expect(
          staff.knowledge.updateSource(staffEdit),
        ).rejects.toMatchObject({ status: 503 });
        await expect(training.send(request)).rejects.toMatchObject({
          status: 503,
        });
        expect(await counts()).toEqual(before);
        expect(
          await knowledge.source.findById({ id: privateSource.id }),
        ).toMatchObject({
          title: first.title,
          content: first.content,
          contentHash: privateSource.contentHash,
          indexedContentHash: privateSource.contentHash,
        });
        expect(
          await knowledge.source.module.sourcesToChunks.forSources([
            privateSource.id,
          ]),
        ).toEqual(oldIndex);
        expect(
          await knowledge.source.findById({ id: originalStaff.id }),
        ).toMatchObject({
          title: originalStaff.title,
          content: originalStaff.content,
          contentHash: originalStaff.contentHash,
          indexedContentHash: originalStaff.contentHash,
        });
      } finally {
        failing.mockRestore();
      }
      const saved = await notes.create(
        owner.id,
        scope.actorProfileId,
        newPrivate,
      );
      const edited = await notes.update(
        owner.id,
        scope.actorProfileId,
        privateSource.id,
        edit,
      );
      const learned = await staff.create(owner.id, staffNote);
      const updatedStaff = await staff.knowledge.updateSource(staffEdit);
      const message = await training.send(request);
      for (const { source } of [saved, edited, learned, updatedStaff]) {
        expect(source.indexedContentHash).toBe(source.contentHash);
      }
      const after = await counts();
      expect(
        (await notes.create(owner.id, scope.actorProfileId, newPrivate)).source
          .id,
      ).toBe(saved.source.id);
      expect((await staff.create(owner.id, staffNote)).source.id).toBe(
        learned.source.id,
      );
      expect((await training.send(request)).id).toBe(message.id);
      expect(await counts()).toEqual(after);
      throw rollback;
    }),
  );
  await expect(scenario).rejects.toBe(rollback);
});
afterAll(async () => {
  if (previousKey === undefined) {
    delete process.env.OPEN_AI_API_KEY;
  } else {
    process.env.OPEN_AI_API_KEY = previousKey;
  }
  await getPostgresClient().end();
  resetPostgresClient();
});

it("creates and reindexes the owner's note, rejects shared sources, and preserves order memory scope", async () => {
  const scenario = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const subject = createService(createAppAssembly());
      const { knowledge, social, ecommerce } = subject.modules;
      const [owner, profile, peer] = await Promise.all([
        subject.create({ data: {} }),
        social.profile.create({ data: {} }),
        social.profile.create({ data: {} }),
      ]);
      const notes = new PersonalSources(subject);
      await subject.module.subjectsToSocialModuleProfiles.create({
        data: {
          subjectId: owner.id,
          socialModuleProfileId: profile.id,
          variant: "default",
        },
      });
      const first = {
        operationKey: randomUUID(),
        title: "My note",
        content: "Original user text",
      };
      const saved = await notes.create(owner.id, profile.id, first);
      expect(saved.source).toMatchObject({
        content: first.content,
        variant: "customer-memory",
        indexedContentHash: saved.source.contentHash,
      });
      expect(await knowledge.source.freshHeaders([saved.source.id])).toEqual(
        [],
      );
      expect(
        await knowledge.source.freshHeaders([saved.source.id], true),
      ).toHaveLength(1);
      expect((await notes.create(owner.id, profile.id, first)).source.id).toBe(
        saved.source.id,
      );
      await expect(
        notes.create(owner.id, profile.id, {
          ...first,
          content: "Different operation",
        }),
      ).rejects.toThrow("Conflict error");
      const changed = {
        title: "Edited",
        content: "The updated original",
        expectedContentHash: saved.source.contentHash,
        expectedTitle: saved.source.title,
      };
      const edited = await notes.update(
        owner.id,
        profile.id,
        saved.source.id,
        changed,
      );
      expect(edited.source).toMatchObject({
        id: saved.source.id,
        title: changed.title,
        content: changed.content,
        indexedContentHash: edited.source.contentHash,
      });
      expect(edited.source.contentHash).not.toBe(saved.source.contentHash);
      await expect(
        notes.update(owner.id, profile.id, saved.source.id, {
          ...changed,
          expectedTitle: edited.source.title,
        }),
      ).rejects.toThrow("Conflict error");
      const current = {
        ...changed,
        expectedTitle: edited.source.title,
        expectedContentHash: edited.source.contentHash,
      };
      await expect(
        notes.update(owner.id, profile.id, saved.source.id, {
          ...current,
          title: "New title",
        }),
      ).resolves.toMatchObject({
        source: { title: "New title", contentHash: edited.source.contentHash },
      });
      await expect(
        notes.update(owner.id, profile.id, saved.source.id, {
          ...current,
          title: "Stale rename",
        }),
      ).rejects.toThrow("Conflict error");
      await expect(
        notes.update(owner.id, peer.id, saved.source.id, current),
      ).rejects.toThrow("Not Found");
      await social.profilesToKnowledgeModuleSources.create({
        data: {
          variant: "customer-memory",
          profileId: peer.id,
          knowledgeModuleSourceId: saved.source.id,
        },
      });
      await expect(
        notes.update(owner.id, profile.id, saved.source.id, current),
      ).rejects.toThrow("Not Found");
      const [store, project] = await Promise.all([
        ecommerce.store.create({ data: {} }),
        social.thread.create({ data: {} }),
      ]);
      const order = await knowledge.source.upsertSourceBySlug({
        slug: randomUUID(),
        variant: "customer-memory",
        title: "Order note",
        content: "First text",
      });
      const link = await social.profilesToKnowledgeModuleSources.create({
        data: {
          profileId: profile.id,
          knowledgeModuleSourceId: order.id,
          variant: "customer-memory",
          storeId: store.id,
          projectId: project.id,
        },
      });
      await notes.update(owner.id, profile.id, order.id, {
        ...changed,
        expectedContentHash: order.contentHash,
        expectedTitle: order.title,
      });
      expect(
        await social.profilesToKnowledgeModuleSources.findById({ id: link.id }),
      ).toMatchObject({
        storeId: store.id,
        projectId: project.id,
        profileId: profile.id,
        knowledgeModuleSourceId: order.id,
      });
      throw rollback;
    }),
  );
  await expect(scenario).rejects.toBe(rollback);
});
