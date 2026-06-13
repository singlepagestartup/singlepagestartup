/**
 * BDD Suite: RBAC profile-scoped Knowledge document deletion.
 *
 * Given: Knowledge document deletion is orchestrated by RBAC.
 * When: a profile-scoped delete request is handled.
 * Then: RBAC validates profile document access before deleting Knowledge data.
 */

const deleteDocument = jest.fn();

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => {
  return {
    KnowledgeService: jest.fn().mockImplementation(() => {
      return {
        deleteDocument,
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
          knowledgeModuleDocumentId: "document-1",
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

describe("rbac profile-scoped Knowledge document deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteDocument.mockResolvedValue({
      id: "document-1",
      title: "Deleted knowledge",
    });
  });

  /**
   * BDD Scenario: scoped target profile deletion.
   *
   * Given: a requester profile and target AI profile are connected to the same chat.
   * When: the document is linked to the target profile.
   * Then: Knowledge hard delete runs for the requested document id.
   */
  it("deletes a document linked to the target profile in the chat", async () => {
    const profilesToChatsFind = jest
      .fn()
      .mockResolvedValueOnce([{ id: "requester-chat-link" }])
      .mockResolvedValueOnce([{ id: "target-chat-link" }]);
    const profilesToKnowledgeModuleDocumentsFind = jest
      .fn()
      .mockResolvedValue([{ id: "profile-document-link" }]);
    const service = {
      socialModule: {
        profilesToChats: {
          find: profilesToChatsFind,
        },
        profilesToKnowledgeModuleDocuments: {
          find: profilesToKnowledgeModuleDocumentsFind,
        },
      },
    } as any;
    const context = createContext() as any;

    await new Handler(service).execute(context, jest.fn());

    expect(profilesToChatsFind).toHaveBeenCalledTimes(2);
    expect(profilesToKnowledgeModuleDocumentsFind).toHaveBeenCalledWith(
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
                column: "knowledgeModuleDocumentId",
                method: "eq",
                value: "document-1",
              }),
            ]),
          }),
        }),
      }),
    );
    expect(deleteDocument).toHaveBeenCalledWith("document-1");
    expect(context.json).toHaveBeenCalledWith({
      data: {
        id: "document-1",
        title: "Deleted knowledge",
      },
    });
  });

  /**
   * BDD Scenario: unlinked document deletion.
   *
   * Given: the target profile does not own the requested Knowledge document.
   * When: a delete request is handled.
   * Then: Knowledge hard delete is not called.
   */
  it("does not delete a document that is not linked to the target profile", async () => {
    const service = {
      socialModule: {
        profilesToChats: {
          find: jest
            .fn()
            .mockResolvedValueOnce([{ id: "requester-chat-link" }])
            .mockResolvedValueOnce([{ id: "target-chat-link" }]),
        },
        profilesToKnowledgeModuleDocuments: {
          find: jest.fn().mockResolvedValue([]),
        },
      },
    } as any;

    await expect(
      new Handler(service).execute(createContext() as any, jest.fn()),
    ).rejects.toThrow("Requested Knowledge document is not linked to profile");
    expect(deleteDocument).not.toHaveBeenCalled();
  });
});
