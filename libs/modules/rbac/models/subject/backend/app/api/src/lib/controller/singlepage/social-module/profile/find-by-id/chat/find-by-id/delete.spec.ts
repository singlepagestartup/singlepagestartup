/**
 * BDD Suite: RBAC social chat deletion.
 *
 * Given: an admin subject can view all social-module chats.
 * When: the admin deletes a chat through the profile-scoped chat endpoint.
 * Then: the chat is deleted even if the current profile is not linked to that chat.
 */

const mockSocialModuleChatDelete = jest.fn();
const mockSocialModuleActionDelete = jest.fn();
const mockSocialModuleMessageDelete = jest.fn();
const mockSocialModuleThreadDelete = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/social/models/chat/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockSocialModuleChatDelete(...args),
  },
}));

jest.mock("@sps/social/models/action/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockSocialModuleActionDelete(...args),
  },
}));

jest.mock("@sps/social/models/message/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockSocialModuleMessageDelete(...args),
  },
}));

jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    delete: (...args: unknown[]) => mockSocialModuleThreadDelete(...args),
  },
}));

import { Handler } from "./delete";

function createContext() {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
          socialModuleChatId: "chat-1",
        }[name];
      },
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(props: { isAdmin: boolean }) {
  return {
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest
      .fn()
      .mockResolvedValue(undefined),
    subjectsToRoles: {
      find: jest.fn().mockResolvedValue(
        props.isAdmin
          ? [
              {
                subjectId: "subject-1",
                roleId: "role-admin",
              },
            ]
          : [],
      ),
    },
    role: {
      find: jest.fn().mockResolvedValue(
        props.isAdmin
          ? [
              {
                id: "role-admin",
                slug: "admin",
              },
            ]
          : [],
      ),
    },
    socialModule: {
      profile: {
        findById: jest.fn(),
      },
      chat: {
        findById: jest.fn().mockResolvedValue({
          id: "chat-1",
          title: {
            en: "Lupapupa",
          },
        }),
      },
      profilesToChats: {
        find: jest.fn().mockResolvedValue([]),
      },
      chatsToThreads: {
        find: jest.fn().mockResolvedValue([]),
      },
      chatsToMessages: {
        find: jest.fn().mockResolvedValue([]),
      },
      chatsToActions: {
        find: jest.fn().mockResolvedValue([]),
      },
    },
  } as any;
}

describe("Given: RBAC social chat deletion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocialModuleChatDelete.mockResolvedValue({
      id: "chat-1",
    });
  });

  /**
   * BDD Scenario
   * Given: the subject has the admin role and the selected profile is not a chat member.
   * When: the profile-scoped chat delete handler deletes the chat.
   * Then: the profile-chat membership check is skipped and the chat is deleted.
   */
  it("When: admin deletes an unlinked profile-scoped chat Then: deletes the chat", async () => {
    const service = createService({ isAdmin: true });
    const handler = new Handler(service);

    const response = await handler.execute(createContext(), jest.fn());

    expect(
      service.socialModuleChatLifecycleAssertSubjectOwnsChat,
    ).toHaveBeenCalledWith({
      subjectId: "subject-1",
      socialModuleChatId: "chat-1",
    });
    expect(service.socialModule.profilesToChats.find).not.toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filters: expect.objectContaining({
            and: expect.arrayContaining([
              expect.objectContaining({
                column: "profileId",
                value: "profile-1",
              }),
            ]),
          }),
        }),
      }),
    );
    expect(mockSocialModuleChatDelete).toHaveBeenCalledWith({
      id: "chat-1",
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
    expect(response).toEqual({
      data: {
        id: "chat-1",
        title: {
          en: "Lupapupa",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the subject is not admin and the selected profile is not a chat member.
   * When: the profile-scoped chat delete handler checks membership.
   * Then: deletion is rejected with the existing not-found message.
   */
  it("When: non-admin deletes an unlinked profile-scoped chat Then: rejects deletion", async () => {
    const service = createService({ isAdmin: false });
    const handler = new Handler(service);

    await expect(handler.execute(createContext(), jest.fn())).rejects.toThrow(
      "Not found error. Requested social-module chat not found",
    );
    expect(mockSocialModuleChatDelete).not.toHaveBeenCalled();
  });
});
