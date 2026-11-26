import { Hono } from "hono";
import { Middleware } from ".";

function createService() {
  const requesterProfileId = "requester-profile-id";
  const targetProfileId = "target-profile-id";

  return {
    find: jest.fn(async () => [{ id: "agent-subject-id", variant: "agent" }]),
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(async () => true),
    modules: {
      social: {
        chat: { findById: jest.fn(async () => ({ variant: "default" })) },
        profile: {
          findById: jest.fn(async () => ({
            id: targetProfileId,
            variant: "artificial-intelligence",
          })),
        },
        profilesToChats: {
          find: jest.fn(async (props: any) => {
            const filters = props?.params?.filters?.and || [];
            const profileId = filters.find(
              (filter: any) => filter.column === "profileId",
            )?.value;

            return profileId === targetProfileId
              ? [{ id: "target-chat-relation" }]
              : [];
          }),
        },
        profilesToSkills: { find: jest.fn(async () => []) },
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () => []),
        },
      },
    },
    module: {
      subjectsToEcommerceModuleStores: {
        find: jest.fn(async () => [] as { id: string }[]),
      },
      subjectsToSocialModuleProfiles: {
        find: jest.fn(async (props: any) => {
          const filters = props?.params?.filters?.and || [];
          const profileId = filters.find(
            (filter: any) => filter.column === "socialModuleProfileId",
          )?.value;

          if (profileId === requesterProfileId) {
            return [{ id: "requester-owner-relation" }];
          }

          if (profileId === targetProfileId) {
            return [
              {
                id: "target-owner-relation",
                subjectId: "agent-subject-id",
              },
            ];
          }

          return [];
        }),
      },
    },
  };
}

describe("Given: RBAC authorizes management of a chat AI profile", () => {
  it("rejects a customer chat as a way to edit an employee's knowledge", async () => {
    const service = createService();
    service.module.subjectsToEcommerceModuleStores.find.mockResolvedValue([
      { id: "store-grant" },
    ]);
    const app = new Hono();
    app.get(
      "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/sources",
      new Middleware(service as any).init(),
      (c) => c.json({ ok: true }),
    );
    const response = await app.request(
      "/subjects/subject-id/profiles/requester-profile-id/chats/chat-id/profiles/target-profile-id/knowledge/sources",
    );
    expect(response.status).toBe(404);
  });
  /**
   * BDD Scenario
   * Given: the requester owns its profile and chat, but that profile is not a
   * participant in the chat.
   * When: the protected Knowledge collection route is requested.
   * Then: the request succeeds because chat participation is required only for
   * the target AI profile.
   */
  it("When: requester profile is outside the chat Then: permits target management", async () => {
    const service = createService();
    const app = new Hono();
    const route =
      "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/sources";

    app.get(route, new Middleware(service as any).init(), (c) =>
      c.json({ ok: true }),
    );

    const response = await app.request(
      "/subjects/subject-id/profiles/requester-profile-id/chats/chat-id/profiles/target-profile-id/knowledge/sources",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(
      service.socialModuleChatLifecycleAssertSubjectOwnsChat,
    ).toHaveBeenCalledWith({
      subjectId: "subject-id",
      socialModuleChatId: "chat-id",
    });
    expect(service.modules.social.profilesToChats.find).toHaveBeenCalledTimes(
      1,
    );
  });

  /**
   * BDD Scenario
   * Given: an existing global skill is not yet linked to the manageable target profile.
   * When: the link-existing route opts out of the linked-skill precondition.
   * Then: profile and chat authorization succeeds so the handler can create the relation.
   */
  it("When: link-existing opts out Then: an unlinked skill reaches the handler", async () => {
    const service = createService();
    const app = new Hono();
    const route =
      "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/skills/:socialModuleSkillId";

    app.post(
      route,
      new Middleware(service as any).init({ requireLinkedSkill: false }),
      (c) => c.json({ ok: true }),
    );

    const response = await app.request(
      "/subjects/subject-id/profiles/requester-profile-id/chats/chat-id/profiles/target-profile-id/skills/skill-id",
      { method: "POST" },
    );

    expect(response.status).toBe(200);
    expect(service.modules.social.profilesToSkills.find).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an unlinked skill id is sent to a relation-only update or unlink route.
   * When: the default management middleware validates the target resource.
   * Then: authorization is denied before the handler can mutate another relation.
   */
  it("When: a protected skill is not linked Then: access is denied", async () => {
    const service = createService();
    const app = new Hono();
    const route =
      "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/skills/:socialModuleSkillId";

    app.delete(route, new Middleware(service as any).init(), (c) =>
      c.json({ ok: true }),
    );

    const response = await app.request(
      "/subjects/subject-id/profiles/requester-profile-id/chats/chat-id/profiles/target-profile-id/skills/skill-id",
      { method: "DELETE" },
    );

    expect(response.status).toBe(401);
    expect(service.modules.social.profilesToSkills.find).toHaveBeenCalledTimes(
      1,
    );
  });
});
