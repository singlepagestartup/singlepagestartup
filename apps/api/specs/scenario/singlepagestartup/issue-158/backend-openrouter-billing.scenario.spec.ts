/**
 * BDD Suite: issue-158 OpenRouter billing metadata with real API and database.
 *
 * Given: API server, database, and a scenario subject are available from apps/api/.env.
 * When: the subject triggers the OpenRouter reaction route for a text message.
 * Then: the generated assistant message persists metadata.openRouter.billing with the settled usage trace.
 */

import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
import { api as subjectsToBillingModuleCurrenciesApi } from "@sps/rbac/relations/subjects-to-billing-module-currencies/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as socialModuleMessageApi } from "@sps/social/models/message/sdk/server";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { authenticateScenarioSubject } from "../issue-152/test-utils/auth";
import {
  getApiUrl,
  getRequiredEnv,
  loadScenarioEnv,
} from "../issue-154/test-utils/env";

describe("Given: issue-158 OpenRouter billing metadata scenario", () => {
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

  const getSingleDefaultThread = (threads: ISocialModuleThread[]) => {
    const defaultThreads = threads.filter((thread) => {
      return thread.variant === "default";
    });

    expect(defaultThreads).toHaveLength(1);

    return defaultThreads[0];
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

  const getMessageId = (messagePayload: any) => {
    const messageId =
      messagePayload?.id || messagePayload?.socialModule?.message?.id;

    if (!messageId) {
      throw new Error(
        `Message response has no id: ${JSON.stringify(messagePayload)}`,
      );
    }

    return messageId;
  };

  const ensureScenarioSocialProfile = async () => {
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
  };

  const clearSubjectProfileChats = async () => {
    if (!subjectId || !socialModuleProfileId || !jwt) {
      return;
    }

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

    for (const chat of chats || []) {
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

  const ensureScenarioBalance = async () => {
    const permissionResolution = await permissionApi.resolveByRoute({
      params: {
        permission: {
          method: "POST",
          route:
            "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/messages/message-1/react-by/openrouter",
          type: "HTTP",
        },
        includeBillingRequirements: true,
      },
      options: {
        headers: secretHeaders(),
      },
    });

    const billingModuleCurrencyId =
      permissionResolution?.permissionsToBillingModuleCurrencies?.[0]
        ?.billingModuleCurrencyId;

    if (!billingModuleCurrencyId) {
      throw new Error(
        "OpenRouter route permission does not resolve a billing currency",
      );
    }

    const subjectCurrencies = await subjectsToBillingModuleCurrenciesApi.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
            {
              column: "billingModuleCurrencyId",
              method: "eq",
              value: billingModuleCurrencyId,
            },
          ],
        },
        limit: 1,
      },
      options: {
        headers: secretHeaders(),
      },
    });

    const existingCurrency = subjectCurrencies?.[0];

    if (existingCurrency?.id) {
      await subjectsToBillingModuleCurrenciesApi.update({
        id: existingCurrency.id,
        data: {
          ...existingCurrency,
          amount: "10",
        },
        options: {
          headers: secretHeaders(),
        },
      });
      return;
    }

    await subjectsToBillingModuleCurrenciesApi.create({
      data: {
        subjectId,
        billingModuleCurrencyId,
        amount: "10",
      },
      options: {
        headers: secretHeaders(),
      },
    });
  };

  const getOpenRouterProfile = async () => {
    const openRouterProfiles = await socialModuleProfileApi.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: "open-router",
            },
          ],
        },
        limit: 1,
      },
      options: {
        headers: secretHeaders(),
      },
    });

    const openRouterProfile = openRouterProfiles?.[0];

    if (!openRouterProfile?.id) {
      throw new Error("OpenRouter social profile is not available");
    }

    return openRouterProfile;
  };

  const ensureProfileCanReplyInChat = async (props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }) => {
    const existingRelations = await socialModuleProfilesToChatsApi.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
            {
              column: "chatId",
              method: "eq",
              value: props.socialModuleChatId,
            },
          ],
        },
        limit: 1,
      },
      options: {
        headers: secretHeaders(),
      },
    });

    if (existingRelations?.length) {
      return;
    }

    await socialModuleProfilesToChatsApi.create({
      data: {
        profileId: props.socialModuleProfileId,
        chatId: props.socialModuleChatId,
      },
      options: {
        headers: secretHeaders(),
      },
    });
  };

  beforeAll(async () => {
    loadScenarioEnv();
    host = getApiUrl();
    secretKey = getRequiredEnv("RBAC_SECRET_KEY");

    const scenarioSubject = await authenticateScenarioSubject();
    subjectId = scenarioSubject.id;
    jwt = scenarioSubject.jwt;

    await ensureScenarioSocialProfile();
  });

  beforeEach(async () => {
    await clearSubjectProfileChats();
    await ensureScenarioBalance();
  });

  afterAll(async () => {
    await clearSubjectProfileChats();
  });

  /**
   * BDD Scenario
   * Given: the scenario subject has a funded billing relation and a chat with a default thread.
   * When: the subject triggers one OpenRouter reply for a text message.
   * Then: the persisted assistant message includes the settled metadata.openRouter.billing payload.
   */
  it("persists metadata.openRouter.billing on the generated assistant message", async () => {
    loadScenarioEnv();

    if (!process.env["OPEN_ROUTER_API_KEY"]) {
      return;
    }

    const openRouterProfile = await getOpenRouterProfile();
    const chat = await subjectApi.socialModuleProfileFindByIdChatCreate({
      host,
      id: subjectId,
      socialModuleProfileId,
      data: {},
      options: {
        headers: authHeaders(),
      },
    });

    const socialModuleChatId = getChatId(chat);

    await ensureProfileCanReplyInChat({
      socialModuleProfileId: openRouterProfile.id,
      socialModuleChatId,
    });

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

    const defaultThread = getSingleDefaultThread(threads || []);

    const inputMessage =
      await subjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate(
        {
          host,
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId,
          socialModuleThreadId: defaultThread.id,
          data: {
            description: "Reply with the word OK and nothing else.",
          },
          options: {
            headers: authHeaders(),
          },
        },
      );

    if (!inputMessage?.id) {
      throw new Error(
        `Create input message response has no id: ${JSON.stringify(inputMessage)}`,
      );
    }

    const replyMessage =
      await subjectApi.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter(
        {
          host,
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId,
          socialModuleMessageId: inputMessage.id,
          data: {
            shouldReplySocialModuleProfile: openRouterProfile,
          },
          options: {
            headers: authHeaders(),
          },
        },
      );

    const replyMessageId = getMessageId(replyMessage);

    const persistedReply = await socialModuleMessageApi.findById({
      id: replyMessageId,
      options: {
        headers: secretHeaders(),
      },
    });

    expect(persistedReply?.metadata?.openRouter?.billing).toMatchObject({
      prechargeTokens: 1,
      selectedModelId: expect.any(String),
      exactTokens: expect.any(Number),
      deltaTokens: expect.any(Number),
      totalUsd: expect.any(Number),
      calls: expect.arrayContaining([
        expect.objectContaining({
          purpose: expect.any(String),
          modelId: expect.any(String),
          totalUsd: expect.any(Number),
          status: expect.any(String),
        }),
      ]),
      settlement: expect.objectContaining({
        prechargeAmount: 1,
        exactAmount: expect.any(Number),
        deltaAmount: expect.any(Number),
      }),
    });
  });
});
