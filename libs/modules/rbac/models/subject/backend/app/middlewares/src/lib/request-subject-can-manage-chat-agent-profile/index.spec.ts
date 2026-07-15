/**
 * BDD Suite: chat agent profile management authorization.
 *
 * Given: an authenticated subject owns the chat and its requesting profile but
 * the requesting profile is not itself a chat participant.
 * When: the subject manages an AI profile that is connected to the chat.
 * Then: RBAC plus target-profile guards authorize the request without a
 * duplicate requester-profile-to-chat requirement.
 */

import { Hono } from "hono";
import { Middleware } from ".";

function createService() {
  const requesterProfileId = "requester-profile-id";
  const targetProfileId = "target-profile-id";

  return {
    find: jest.fn(async () => [{ id: "agent-subject-id", variant: "agent" }]),
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(async () => true),
    socialModule: {
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
      profilesToKnowledgeModuleDocuments: {
        find: jest.fn(async () => []),
      },
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
  };
}

describe("Given: RBAC authorizes management of a chat AI profile", () => {
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
      "/subjects/:id/profiles/:socialModuleProfileId/chats/:socialModuleChatId/profiles/:targetSocialModuleProfileId/knowledge/documents";

    app.get(route, new Middleware(service as any).init(), (c) =>
      c.json({ ok: true }),
    );

    const response = await app.request(
      "/subjects/subject-id/profiles/requester-profile-id/chats/chat-id/profiles/target-profile-id/knowledge/documents",
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(
      service.socialModuleChatLifecycleAssertSubjectOwnsChat,
    ).toHaveBeenCalledWith({
      subjectId: "subject-id",
      socialModuleChatId: "chat-id",
    });
    expect(service.socialModule.profilesToChats.find).toHaveBeenCalledTimes(1);
  });
});
