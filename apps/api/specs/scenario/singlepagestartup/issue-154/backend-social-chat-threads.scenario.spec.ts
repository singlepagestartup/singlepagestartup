/**
 * BDD Suite: issue-154 social chat thread behavior with real API and database.
 *
 * Given: API server, database, and fixed RBAC scenario subject are running from apps/api/.env.
 * When: subject works with chat threads through canonical chat-thread routes.
 * Then: default-thread bootstrap, thread routing, and thread-link normalization are consistent and rerunnable.
 */

import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleChatsToMessagesApi } from "@sps/social/relations/chats-to-messages/sdk/server";
import { api as socialModuleChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import { api as socialModuleProfilesToMessagesApi } from "@sps/social/relations/profiles-to-messages/sdk/server";
import { api as socialModuleThreadsToMessagesApi } from "@sps/social/relations/threads-to-messages/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { loadScenarioEnv, getApiUrl, getRequiredEnv } from "./test-utils/env";

describe("Given: issue-154 social chat thread scenario", () => {
  let host = "";
  let secretKey = "";
  let subjectId = "";
  let jwt = "";
  let socialModuleProfileId = "";

  const authHeaders = () => {
    return {
      Authorization: `Bearer ${jwt}`,
    };
  };

  const secretHeaders = () => {
    return {
      "X-RBAC-SECRET-KEY": secretKey,
    };
  };

  const parseStatus = (error: unknown) => {
    const err = error as any;

    if (typeof err?.status === "number") {
      return err.status;
    }

    if (typeof err?.cause?.status === "number") {
      return err.cause.status;
    }

    if (typeof err?.message === "string") {
      try {
        const parsedMessage = JSON.parse(err.message);
        if (typeof parsedMessage?.status === "number") {
          return parsedMessage.status;
        }
      } catch {}
    }

    return 500;
  };

  const getChatId = (chatPayload: any) => {
    const chatId = chatPayload?.id || chatPayload?.socialModuleChat?.id;

    if (!chatId) {
      throw new Error(
        `Create chat response has no chat id: ${JSON.stringify(chatPayload)}`,
      );
    }

    return chatId;
  };

  const getSingleDefaultThread = (threads: ISocialModuleThread[]) => {
    const defaultThreads = threads.filter((thread) => {
      return thread.variant === "default";
    });

    expect(defaultThreads).toHaveLength(1);

    return defaultThreads[0];
  };

  const listSubjectProfileChats = async () => {
    const chats = await subjectApi.socialModuleProfileFindByIdChatFind({
      host,
      id: subjectId,
      socialModuleProfileId,
      params: {
        cb: Date.now().toString(),
      },
      options: {
        headers: authHeaders(),
      },
    });

    return chats || [];
  };

  const clearSubjectProfileChats = async () => {
    const chats = await listSubjectProfileChats();

    for (const chat of chats) {
      try {
        await subjectApi.socialModuleProfileFindByIdChatFindByIdDelete({
          host,
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId: chat.id,
          options: {
            headers: authHeaders(),
          },
        });
      } catch {}
    }
  };

  const createSubjectProfileChat = async () => {
    const chatPayload = await subjectApi.socialModuleChatCreate({
      host,
      id: subjectId,
      data: {},
      options: {
        headers: authHeaders(),
      },
    });

    return {
      id: getChatId(chatPayload),
      raw: chatPayload,
    };
  };

  const listChatThreads = async (socialModuleChatId: string) => {
    const threads = await subjectApi.socialModuleChatFindByIdThreadFind({
      host,
      id: subjectId,
      socialModuleChatId,
      params: {
        cb: Date.now().toString(),
      },
      options: {
        headers: authHeaders(),
      },
    });

    return threads || [];
  };

  const createCustomThread = async (props: {
    socialModuleChatId: string;
    title?: string;
  }) => {
    const thread = await subjectApi.socialModuleChatFindByIdThreadCreate({
      host,
      id: subjectId,
      socialModuleChatId: props.socialModuleChatId,
      data: {
        title:
          props.title || `issue-154-custom-thread-${Date.now().toString(36)}`,
      },
      options: {
        headers: authHeaders(),
      },
    });

    if (!thread?.id) {
      throw new Error(
        `Create custom thread response has no id: ${JSON.stringify(thread)}`,
      );
    }

    return thread;
  };

  const createThreadMessage = async (props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
    description: string;
    sourceSystemId?: string;
  }) => {
    const message =
      await subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
        {
          host,
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleThreadId: props.socialModuleThreadId,
          data: {
            description: props.description,
            ...(props.sourceSystemId
              ? {
                  sourceSystemId: props.sourceSystemId,
                }
              : {}),
          },
          options: {
            headers: authHeaders(),
          },
        },
      );

    if (!message?.id) {
      throw new Error(
        `Create thread message response has no id: ${JSON.stringify(message)}`,
      );
    }

    return message;
  };

  const listThreadMessages = async (props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }) => {
    const messages =
      await subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(
        {
          host,
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleThreadId: props.socialModuleThreadId,
          params: {
            cb: Date.now().toString(),
          },
          options: {
            headers: authHeaders(),
          },
        },
      );

    return messages || [];
  };

  beforeAll(async () => {
    loadScenarioEnv();
    host = getApiUrl();
    secretKey = getRequiredEnv("RBAC_SECRET_KEY");

    const email = getRequiredEnv("RBAC_SUBJECT_IDENTITY_EMAIL");
    const password = getRequiredEnv("RBAC_SUBJECT_IDENTITY_PASSWORD");

    const auth = await subjectApi.authenticationEmailAndPasswordAuthentication({
      host,
      data: {
        login: email,
        password,
      },
    });

    if (!auth?.jwt) {
      throw new Error(
        `Authentication payload does not include jwt: ${JSON.stringify(auth)}`,
      );
    }

    jwt = auth.jwt;

    const me = await subjectApi.authenticationMe({
      host,
      options: {
        headers: authHeaders(),
      },
    });

    if (!me?.id) {
      throw new Error(
        `Authentication me payload does not include id: ${JSON.stringify(me)}`,
      );
    }

    subjectId = me.id;

    const subjectToProfiles = await subjectsToSocialModuleProfilesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
          ],
        },
        limit: 1,
      },
      options: {
        headers: secretHeaders(),
      },
    });

    const existingSocialModuleProfileId =
      subjectToProfiles?.[0]?.socialModuleProfileId;

    if (existingSocialModuleProfileId) {
      socialModuleProfileId = existingSocialModuleProfileId;
      return;
    }

    const socialModuleProfile = await socialModuleProfileApi.create({
      data: {},
      options: {
        headers: secretHeaders(),
      },
    });

    if (!socialModuleProfile?.id) {
      throw new Error("Could not create social profile for scenario subject");
    }

    await subjectsToSocialModuleProfilesApi.create({
      data: {
        subjectId,
        socialModuleProfileId: socialModuleProfile.id,
      },
      options: {
        headers: secretHeaders(),
      },
    });

    socialModuleProfileId = socialModuleProfile.id;
  });

  beforeEach(async () => {
    await clearSubjectProfileChats();
  });

  afterAll(async () => {
    await clearSubjectProfileChats();
  });

  /**
   * BDD Scenario
   * Given: subject has a social profile.
   * When: subject creates a new chat.
   * Then: chat has exactly one default thread.
   */
  it("When: chat is created Then: exactly one default thread exists", async () => {
    const socialModuleChat = await createSubjectProfileChat();

    const threads = await listChatThreads(socialModuleChat.id);

    expect(threads.length).toBeGreaterThan(0);
    getSingleDefaultThread(threads);
  });

  /**
   * BDD Scenario
   * Given: chat has default and custom threads.
   * When: subject sends messages into each thread and fetches messages by thread route.
   * Then: each route returns only messages from its selected thread.
   */
  it("When: messages are created in different threads Then: thread routes return isolated message sets", async () => {
    const socialModuleChat = await createSubjectProfileChat();

    const initialThreads = await listChatThreads(socialModuleChat.id);
    const defaultThread = getSingleDefaultThread(initialThreads);

    const customThread = await createCustomThread({
      socialModuleChatId: socialModuleChat.id,
      title: `issue-154-custom-thread-${Date.now().toString(36)}`,
    });

    const defaultThreadMessage = await createThreadMessage({
      socialModuleChatId: socialModuleChat.id,
      socialModuleThreadId: defaultThread.id,
      description: `issue-154 default thread message ${Date.now()}`,
    });

    const customThreadMessage = await createThreadMessage({
      socialModuleChatId: socialModuleChat.id,
      socialModuleThreadId: customThread.id,
      description: `issue-154 custom thread message ${Date.now()}`,
    });

    const defaultThreadMessages = await listThreadMessages({
      socialModuleChatId: socialModuleChat.id,
      socialModuleThreadId: defaultThread.id,
    });
    const customThreadMessages = await listThreadMessages({
      socialModuleChatId: socialModuleChat.id,
      socialModuleThreadId: customThread.id,
    });

    const defaultThreadMessageIds = new Set(
      defaultThreadMessages.map((message) => message.id),
    );
    const customThreadMessageIds = new Set(
      customThreadMessages.map((message) => message.id),
    );

    expect(defaultThreadMessageIds.has(defaultThreadMessage.id)).toBe(true);
    expect(defaultThreadMessageIds.has(customThreadMessage.id)).toBe(false);
    expect(customThreadMessageIds.has(customThreadMessage.id)).toBe(true);
    expect(customThreadMessageIds.has(defaultThreadMessage.id)).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: subject has two chats with different thread sets.
   * When: subject tries to post into chat A using thread id from chat B.
   * Then: API rejects cross-chat thread usage.
   */
  it("When: thread does not belong to chat Then: thread-scoped message create is rejected", async () => {
    const firstChat = await createSubjectProfileChat();
    const secondChat = await createSubjectProfileChat();

    const firstChatThreads = await listChatThreads(firstChat.id);
    const secondChatThreads = await listChatThreads(secondChat.id);

    const firstChatDefaultThread = getSingleDefaultThread(firstChatThreads);
    const secondChatDefaultThread = getSingleDefaultThread(secondChatThreads);

    expect(firstChatDefaultThread.id).not.toBe(secondChatDefaultThread.id);

    let invalidCreateStatus = 200;
    try {
      await subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
        {
          host,
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId: firstChat.id,
          socialModuleThreadId: secondChatDefaultThread.id,
          data: {
            description: `issue-154 invalid cross-chat thread message ${Date.now()}`,
          },
          options: {
            headers: authHeaders(),
          },
        },
      );
    } catch (error) {
      invalidCreateStatus = parseStatus(error);
    }

    expect(invalidCreateStatus).toBeGreaterThanOrEqual(400);

    const firstChatDefaultThreadMessages = await listThreadMessages({
      socialModuleChatId: firstChat.id,
      socialModuleThreadId: firstChatDefaultThread.id,
    });

    expect(firstChatDefaultThreadMessages).toHaveLength(0);
  });
});
