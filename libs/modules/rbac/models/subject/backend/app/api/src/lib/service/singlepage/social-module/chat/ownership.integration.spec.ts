import { randomUUID } from "node:crypto";
import {
  createAppAssembly,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Provider as KvProvider } from "@sps/providers-kv";
import { DATABASE_OPTIONS, KV_PROVIDER } from "@sps/shared-utils";
import { bootstrap } from "../../../../bootstrap";

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("records one creator atomically and keeps chat membership independent of ownership", async () => {
  expect(["localhost", "127.0.0.1", "::1"]).toContain(DATABASE_OPTIONS.host);
  const { service } = await bootstrap(createAppAssembly());
  const rollback = new Error("Rollback chat ownership fixtures");
  await expect(
    withConsistencyTransaction(getDrizzle({}), async () => {
      const owner = await service.create({ data: {} });
      const member = await service.create({ data: {} });
      const creatorProfile = await service.modules.social.profile.create({
        data: {},
      });
      await service.module.subjectsToSocialModuleProfiles.create({
        data: { subjectId: owner.id, socialModuleProfileId: creatorProfile.id },
      });
      const { socialModuleChat: chat, socialModuleDefaultThread: thread } =
        await service.socialModuleChatLifecycleCreateChatWithDefaultThread({
          subjectId: owner.id,
          data: { variant: "ai-chat" },
          autoBootstrapProfile: false,
        });
      expect(thread.id).toBeTruthy();
      const memberProfile = await service.modules.social.profile.create({
        data: {},
      });
      await service.module.subjectsToSocialModuleProfiles.create({
        data: { subjectId: member.id, socialModuleProfileId: memberProfile.id },
      });
      await service.modules.social.profilesToChats.create({
        data: { chatId: chat.id, profileId: memberProfile.id },
      });
      await expect(
        service.chatOwnership.assertOwner(owner.id, chat.id),
      ).resolves.toBeUndefined();
      await expect(
        service.chatOwnership.assertOwner(member.id, chat.id),
      ).rejects.toThrow("Forbidden");
      const slug = randomUUID();
      await expect(
        service.chatOwnership.create(randomUUID(), { slug }),
      ).rejects.toThrow();
      await expect(
        service.modules.social.chat.find({
          params: {
            filters: { and: [{ column: "slug", method: "eq", value: slug }] },
          },
        }),
      ).resolves.toEqual([]);
      throw rollback;
    }),
  ).rejects.toBe(rollback);
});
