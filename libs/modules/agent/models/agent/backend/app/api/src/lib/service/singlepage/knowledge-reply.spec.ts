/**
 * BDD Suite: agent Knowledge reply dispatch.
 *
 * Given: social chats can opt into profile-scoped Knowledge/RAG mode.
 * When: an artificial-intelligence chat-gpt profile receives a message in a Knowledge chat.
 * Then: the agent dispatches through the RBAC Knowledge reaction endpoint instead of OpenRouter.
 */

jest.mock("@sps/shared-utils", () => {
  const actual = jest.requireActual("@sps/shared-utils");

  return {
    ...actual,
    RBAC_SECRET_KEY: "rbac-secret",
    RBAC_JWT_SECRET: "jwt-secret",
    RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS: 3600,
  };
});

jest.mock("@sps/rbac/models/subject/sdk/server", () => {
  return {
    api: {
      socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByKnowledge:
        jest.fn(),
      socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter:
        jest.fn(),
      socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate:
        jest.fn(),
      socialModuleProfileFindByIdChatFindByIdMessageCreate: jest.fn(),
    },
  };
});

jest.mock("hono/jwt", () => {
  return {
    sign: jest.fn(),
  };
});

import { Service } from "./index";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import * as jwt from "hono/jwt";

const mockedSign = jwt.sign as jest.Mock;
const mockedReactByKnowledge =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByKnowledge as jest.Mock;

function createService() {
  const service = Object.create(Service.prototype) as Service;

  (service as any).rbacModule = {
    subjectsToSocialModuleProfiles: {
      find: jest.fn().mockResolvedValue([
        {
          subjectId: "assistant-subject",
        },
      ]),
    },
    subject: {
      findById: jest.fn().mockResolvedValue({
        id: "assistant-subject",
      }),
    },
  };
  (service as any).resolveThreadIdForMessageInChat = jest
    .fn()
    .mockResolvedValue("thread-1");
  (service as any).getMessageFromRbacModuleSubject = jest
    .fn()
    .mockResolvedValue({
      id: "sender-subject",
    });
  (service as any).telegramBotCommands = [];

  return service;
}

describe("Given: agent Knowledge reply dispatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSign.mockResolvedValue("signed-jwt");
    mockedReactByKnowledge.mockResolvedValue({
      id: "assistant-message-1",
    });
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat targets a chat-gpt artificial-intelligence profile.
   * When: the agent social profile handler receives a user message.
   * Then: it dispatches to the Knowledge reply path.
   */
  it("When: knowledge chat targets chat-gpt AI Then: it dispatches Knowledge reply", async () => {
    const service = createService();
    const knowledgeReplyMessageCreate = jest
      .fn()
      .mockResolvedValue({ id: "assistant-message-1" });

    (service as any).knowledgeReplyMessageCreate = knowledgeReplyMessageCreate;

    await service.agentSocialModuleProfileHandler({
      shouldReplySocialModuleProfile: {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
      } as any,
      socialModuleChat: {
        id: "chat-1",
        variant: "knowledge",
      } as any,
      socialModuleMessage: {
        id: "message-1",
        description: "Question",
      } as any,
      messageFromSocialModuleProfile: {
        id: "sender-profile-1",
      } as any,
    });

    expect(knowledgeReplyMessageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldReplySocialModuleProfile: expect.objectContaining({
          id: "assistant-profile-1",
        }),
        socialModuleChat: expect.objectContaining({
          variant: "knowledge",
        }),
        socialModuleMessage: expect.objectContaining({
          id: "message-1",
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a Knowledge reply has a sender profile connected to an RBAC subject.
   * When: the agent creates the assistant reply.
   * Then: it calls the RBAC Knowledge reaction endpoint as the sender subject.
   */
  it("When: Knowledge reply is created Then: it calls the RBAC Knowledge endpoint as sender", async () => {
    const service = createService();

    await service.knowledgeReplyMessageCreate({
      jwtToken: "assistant-jwt",
      rbacModuleSubject: {
        id: "assistant-subject",
      } as any,
      shouldReplySocialModuleProfile: {
        id: "assistant-profile-1",
        slug: "chat-gpt-1",
        variant: "artificial-intelligence",
      } as any,
      socialModuleChat: {
        id: "chat-1",
        variant: "knowledge",
      } as any,
      socialModuleMessage: {
        id: "message-1",
        description: "Question",
      } as any,
      messageFromSocialModuleProfile: {
        id: "sender-profile-1",
      } as any,
    });

    expect(mockedReactByKnowledge).toHaveBeenCalledWith({
      id: "sender-subject",
      socialModuleChatId: "chat-1",
      socialModuleMessageId: "message-1",
      socialModuleProfileId: "sender-profile-1",
      data: {
        shouldReplySocialModuleProfile: expect.objectContaining({
          id: "assistant-profile-1",
        }),
      },
      options: {
        headers: {
          Authorization: "Bearer signed-jwt",
        },
      },
    });
  });
});
