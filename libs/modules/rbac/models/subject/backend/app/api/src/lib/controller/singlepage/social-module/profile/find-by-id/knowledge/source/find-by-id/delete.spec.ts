/**
 * BDD Suite: RBAC profile-scoped Knowledge Source deletion.
 *
 * Given: Knowledge Source deletion is orchestrated by RBAC.
 * When: a profile-scoped delete request is handled.
 * Then: RBAC validates profile source access before deleting Knowledge data.
 */

const deleteSource = jest.fn();

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => {
  return {
    KnowledgeService: jest.fn().mockImplementation(() => {
      return {
        deleteSource,
      };
    }),
  };
});

import { Handler } from "./delete";

function createContext() {
  return {
    req: {
      param: jest.fn((name: string) => {
        const params: Record<string, string> = {
          socialModuleProfileId: "profile-1",
          knowledgeModuleSourceId: "source-1",
        };

        return params[name];
      }),
      query: jest.fn((name: string) => {
        const params: Record<string, string> = {
          targetSocialModuleProfileId: "assistant-profile-1",
          socialModuleChatId: "chat-1",
        };

        return params[name];
      }),
    },
    json: jest.fn((body: unknown) => {
      return new Response(JSON.stringify(body));
    }),
  };
}

describe("rbac profile-scoped Knowledge Source deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteSource.mockResolvedValue({
      id: "source-1",
      title: "Deleted knowledge",
    });
  });

  /**
   * BDD Scenario: scoped target profile deletion.
   *
   * Given: a requester profile and target AI profile are connected to the same chat.
   * When: the source is linked to the target profile.
   * Then: Knowledge hard delete runs for the requested source id.
   */
  it("deletes a source linked to the target profile in the chat", async () => {
    const profilesToChatsFind = jest
      .fn()
      .mockResolvedValueOnce([{ id: "requester-chat-link" }])
      .mockResolvedValueOnce([{ id: "target-chat-link" }]);
    const profilesToKnowledgeModuleSourcesFind = jest
      .fn()
      .mockResolvedValue([{ id: "profile-source-link" }]);
    const service = {
      socialModule: {
        profilesToChats: {
          find: profilesToChatsFind,
        },
        profilesToKnowledgeModuleSources: {
          find: profilesToKnowledgeModuleSourcesFind,
        },
      },
    } as any;
    const context = createContext() as any;

    await new Handler(service).execute(context, jest.fn());

    expect(profilesToChatsFind).toHaveBeenCalledTimes(2);
    expect(profilesToKnowledgeModuleSourcesFind).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filters: expect.objectContaining({
            and: expect.arrayContaining([
              expect.objectContaining({
                column: "profileId",
                method: "eq",
                value: "assistant-profile-1",
              }),
              expect.objectContaining({
                column: "knowledgeModuleSourceId",
                method: "eq",
                value: "source-1",
              }),
            ]),
          }),
        }),
      }),
    );
    expect(deleteSource).toHaveBeenCalledWith("source-1");
    expect(context.json).toHaveBeenCalledWith({
      data: {
        id: "source-1",
        title: "Deleted knowledge",
      },
    });
  });

  /**
   * BDD Scenario: unlinked source deletion.
   *
   * Given: the target profile does not own the requested Knowledge Source.
   * When: a delete request is handled.
   * Then: Knowledge hard delete is not called.
   */
  it("does not delete a source that is not linked to the target profile", async () => {
    const service = {
      socialModule: {
        profilesToChats: {
          find: jest
            .fn()
            .mockResolvedValueOnce([{ id: "requester-chat-link" }])
            .mockResolvedValueOnce([{ id: "target-chat-link" }]),
        },
        profilesToKnowledgeModuleSources: {
          find: jest.fn().mockResolvedValue([]),
        },
      },
    } as any;

    await expect(
      new Handler(service).execute(createContext() as any, jest.fn()),
    ).rejects.toThrow("Requested Knowledge Source is not linked to profile");
    expect(deleteSource).not.toHaveBeenCalled();
  });
});
