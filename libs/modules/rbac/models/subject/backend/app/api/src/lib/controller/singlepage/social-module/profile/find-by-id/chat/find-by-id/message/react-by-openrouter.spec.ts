/**
 * BDD Suite: OpenRouter thread context and reply validation.
 *
 * Given: a chat has a thread with more messages than one context page.
 * When: OpenRouter context is collected and generated replies are validated.
 * Then: every eligible context message is considered and invalid empty text replies are rejected.
 */

jest.mock("@sps/backend-utils", () => {
  return {
    ...jest.requireActual("@sps/backend-utils"),
    blobifyFiles: jest.fn(async () => ["generated-file"]),
    getHttpErrorType: jest.fn((error) => {
      const message = error instanceof Error ? error.message : String(error);

      return {
        status: 500,
        message,
        details: [],
      };
    }),
  };
});

import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Handler } from "./react-by-openrouter";
import { blobifyFiles } from "@sps/backend-utils";
import {
  NEXT_PUBLIC_API_SERVICE_URL,
  AI_CHAT_DOCUMENTS,
} from "@sps/shared-utils";

import type { KnowledgeSearchResult } from "@sps/knowledge/backend/app/api/src/lib/types";

interface IFindThreadMessageIdsInChatHandler {
  findThreadMessageIdsInChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }): Promise<string[]>;
}

interface IOpenRouterModelRouterConfigHandler {
  getEnabledCandidatesByClass(
    modelClass: "CHAT" | "CODER" | "VISION" | "IMAGE",
  ): Array<{
    id: string;
    priority: number;
  }>;
}

interface IOpenRouterIdentityGuardHandler {
  assertReplyProfile(replyProfile?: { id: string; variant: string }): void;
  assertProfileCanAccessChat(props: {
    subjectId: string;
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }): Promise<void>;
  assertProfileCanAccessMessage(props: {
    socialModuleProfileId: string;
    socialModuleMessageId: string;
  }): Promise<void>;
  assertMessageBelongsToChat(props: {
    socialModuleChatId: string;
    socialModuleMessageId: string;
  }): Promise<void>;
  assertReplyProfileConnectedToChat(props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
  }): Promise<void>;
  resolveRbacSubjectForSocialProfile(socialModuleProfileId: string): Promise<{
    id: string;
  }>;
}

interface IOpenRouterPersistedRequestHandler {
  resolveAiReactionRequest(props: {
    data: {
      [key: string]: unknown;
      shouldReplySocialModuleProfile?: {
        id?: string;
      };
    };
    socialModuleMessage: {
      metadata?: Record<string, unknown> | null;
    };
  }): {
    version: 1;
    modelId: string;
    reasoning: string;
    skillIds: string[];
    useKnowledgeSearch: boolean;
  };
}

interface IOpenRouterReplyValidationHandler {
  buildNoValidModelResponseMessage(
    fallbackReasons: string[],
    language?: string,
  ): string;
  generateFinalOpenRouterReply(props: {
    billingLedger: any[];
    openRouter: {
      generate: jest.Mock;
    };
    modelSelection: {
      orderedCandidateIds: string[];
      selectedModelId: string | null;
      selectedBy: "llm" | "priority" | "manual";
    };
    expectedOutputModality: "text" | "image";
    generationContext: {
      role: "user" | "assistant" | "system";
      content: string | { type: "text"; text: string }[];
    }[];
    onModelAttempt?: (modelId: string) => Promise<void>;
  }): Promise<{
    selectedModelId: string | null;
    generationResult?: {
      text: string;
      images?: { url?: string; b64_json?: string }[];
      billing: any;
    };
    fallbackReasons: string[];
  }>;
  getGenerationValidationError(props: {
    expectedOutputModality: "text" | "image";
    result: {
      text: string;
      images?: { url?: string; b64_json?: string }[];
    };
  }): string | null;
  buildOpenRouterReplyMessageData(props: {
    expectedOutputModality: "text" | "image";
    generationResult: {
      text: string;
      images?: { url?: string; b64_json?: string }[];
      billing: any;
    };
    selectModelForRequest: string;
    billingSettlement: {
      summary: Record<string, unknown>;
      settlement: {
        settlement?: unknown;
      } | null;
    };
  }): Promise<{
    description: string;
    files?: unknown[];
    metadata: Record<string, unknown>;
  }>;
  buildGenerationContext(props: {
    context: {
      role: "user" | "assistant" | "system";
      content:
        | string
        | (
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
            | { type: "file_url"; file_url: { url: string } }
          )[];
    }[];
    expectedOutputModality: "text" | "image";
    language: string;
    profileSystemMessage?: {
      role: "user" | "assistant" | "system";
      content: string;
    };
  }): {
    role: "user" | "assistant" | "system";
    content:
      | string
      | (
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        )[];
  }[];
  isAudioFileStorageFile(file: {
    extension?: string | null;
    file: string;
    mimeType?: string | null;
  }): boolean;
}

interface IOpenRouterAttachmentContextHandler {
  detectInputModalitiesFromContext(
    context: Array<{
      role: "user" | "assistant" | "system";
      content:
        | string
        | Array<
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
            | { type: "file_url"; file_url: { url: string } }
          >;
    }>,
  ): string[];
  resolveOpenRouterMessageContext(props: {
    fileStorageFiles: Array<{
      extension?: string | null;
      file: string;
      mimeType?: string | null;
    }>;
    messageDescription: string;
  }): Promise<{
    content:
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
          | { type: "file_url"; file_url: { url: string } }
        >
      | null;
    routingText: string;
  }>;
}

interface IOpenRouterKnowledgeControlsHandler {
  toOpenRouterUserQuery(props: {
    rawQuery: string;
    requestedKnowledgeSearch: boolean;
    hasMentionedSkill: boolean;
    requestedSkillIds: string[];
  }): string;
  toOpenRouterReasoning(
    value: "auto" | "none" | "low" | "medium" | "high" | "xhigh",
  ):
    | {
        effort: string;
        exclude?: boolean;
      }
    | undefined;
  buildManualRequestClassification(props: {
    expectedOutputModality: "text" | "image" | "audio" | "file";
    requestText: string;
    requiredInputModalitiesList: ("text" | "image" | "file")[];
  }): {
    language: string;
    task: string;
    input_modalities: string[];
    output_modality: string;
    need_web: boolean;
    complexity: string;
    risk_level: string;
  };
  buildGenerationContext(props: {
    context: {
      role: "user" | "assistant" | "system";
      content: string;
    }[];
    expectedOutputModality: "text" | "image";
    language: string;
    profileSystemMessage?: {
      role: "user" | "assistant" | "system";
      content: string;
    };
  }): {
    role: "user" | "assistant" | "system";
    content: string | { type: "text"; text: string }[];
  }[];
  findPromptSkillsForProfile(props: {
    socialModuleProfileId: string;
    skillIds: string[];
    skillSlugs: string[];
  }): Promise<{ id: string; slug: string; status?: string }[]>;
  buildProfileCapabilityTools(props: {
    availableSkills: Array<{
      id: string;
      slug: string;
      title: string;
      description: string;
    }>;
    knowledgeSourceIds: string[];
  }): Array<{
    source: "skill" | "knowledge" | "mcp";
    definition: {
      function: {
        name: string;
        parameters: Record<string, unknown>;
      };
    };
    validateArguments?: (args: Record<string, unknown>) => void;
    execute: (args: Record<string, unknown>) => Promise<unknown>;
  }>;
  buildMcpCapabilityTools(catalogSession: unknown): Array<{
    source: "skill" | "knowledge" | "mcp";
    display?: {
      label: string;
      serverId?: string;
    };
    definition: {
      function: {
        name: string;
        parameters: Record<string, unknown>;
      };
    };
    execute: (args: Record<string, unknown>) => Promise<unknown>;
  }>;
  getMentionedSkillSlugs(value: string): string[];
  isOpenRouterLearnContextMessage(value: string): boolean;
  attachSkillMessagePrefixToContext(props: {
    context: {
      role: "user" | "assistant" | "system";
      content:
        | string
        | (
            | { type: "text"; text: string }
            | { type: "image_url"; image_url: { url: string } }
          )[];
    }[];
    skillMessagePrefix: string;
  }): {
    role: "user" | "assistant" | "system";
    content:
      | string
      | (
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        )[];
  }[];
  resolveManualExpectedOutputModality(model: {
    architecture?: {
      output_modalities?: string[];
    };
  }): "text" | "image" | "audio" | "file";
  resolveManualOpenRouterModel(props: {
    expectedOutputModality?: "text" | "image" | "audio" | "file";
    modelId: string;
    models: {
      id: string;
      architecture?: {
        input_modalities?: string[];
        output_modalities?: string[];
      };
    }[];
    requiredInputModalitiesList: ("text" | "image" | "file")[];
  }): {
    id: string;
    architecture?: {
      input_modalities?: string[];
      output_modalities?: string[];
    };
  };
  resolveOpenRouterKnowledgeContext(props: {
    billingLedger: any[];
    data: {
      skillIds?: string[];
      useKnowledgeSearch?: boolean;
    };
    openRouter: {
      generate: jest.Mock;
    };
    replyProfile: {
      id: string;
    };
    socialModuleMessage: {
      id: string;
      description: string;
    };
    sanitizedQuery: string;
    requestedKnowledgeSearch: boolean;
    requestedSkillIds: string[];
    reasoning?: {
      effort: "none" | "low" | "medium" | "high" | "xhigh";
      exclude?: boolean;
    };
    selectedModelId: string | null;
    threadContext: {
      role: "user" | "assistant" | "system";
      content: string;
    }[];
  }): Promise<{
    useKnowledgeSearch: boolean;
    searchSourceIds: string[];
    candidateSources: unknown[];
    sources: unknown[];
    retrieval: Record<string, unknown>;
    promptSkills: { id: string; slug: string; status?: string }[];
    skillMessagePrefix: string;
    systemMessages: {
      role: "user" | "assistant" | "system";
      content: string;
    }[];
  }>;
  toProfileSystemMessage(props: {
    language: string;
    replyProfile: {
      id: string;
      slug: string;
      adminTitle?: string;
      title?: Record<string, unknown>;
      subtitle?: Record<string, unknown>;
      description?: Record<string, unknown>;
    };
  }): {
    role: "user" | "assistant" | "system";
    content: string;
  };
}

interface IOpenRouterMcpFallbackHandler {
  openProfileMcpCatalogBestEffort(props: {
    configuredServerIds: string[];
    rbacSubjectAuthenticationJwt: string;
    socialModuleProfileId: string;
  }): Promise<{
    session: unknown;
    unavailableServerIds: string[];
  }>;
}

function createMessageId(index: number) {
  return `message-${String(index).padStart(3, "0")}`;
}

function createKnowledgeSearchResult(
  props: Partial<KnowledgeSearchResult> & { id: string },
): KnowledgeSearchResult {
  return {
    text: "Policy fragment",
    chunkIndex: 0,
    sourceId: "source-1",
    sourceTitle: "Policy",
    distance: 0.1,
    similarity: 0.9,
    retrievalRole: "seed",
    metadata: {},
    ...props,
  };
}

describe("Given: OpenRouter thread context and reply validation", () => {
  /**
   * BDD Scenario
   * Given: only GPT 6.1 Sol is enabled for answering requests.
   * When: automatic-routing candidates are loaded.
   * Then: text, coding, and visual analysis use that model; image generation has no candidate.
   */
  it("When: autorouting candidates are loaded Then: only GPT 6.1 Sol is allowed", () => {
    const handler = Object.create(
      Handler.prototype,
    ) as IOpenRouterModelRouterConfigHandler;
    const classes = ["CHAT", "CODER", "VISION", "IMAGE"] as const;
    const idsByClass = Object.fromEntries(
      classes.map((modelClass) => [
        modelClass,
        handler
          .getEnabledCandidatesByClass(modelClass)
          .map((candidate) => candidate.id),
      ]),
    );
    const allIds = Object.values(idsByClass).flat();

    expect(idsByClass.CHAT).toEqual(["openai/gpt-6.1-sol"]);
    expect(idsByClass.CODER).toEqual(["openai/gpt-6.1-sol"]);
    expect(idsByClass.VISION).toEqual(["openai/gpt-6.1-sol"]);
    expect(idsByClass.IMAGE).toEqual([]);
    expect([...new Set(allIds)]).toEqual(["openai/gpt-6.1-sol"]);
  });

  /**
   * BDD Scenario
   * Given: a message persists the complete AI reaction request.
   * When: the OpenRouter handler resolves execution parameters.
   * Then: model, reasoning, skills, and Knowledge come from the message.
   */
  it("When: persisted reaction intent exists Then: it is the canonical execution request", () => {
    const handler = Object.create(
      Handler.prototype,
    ) as IOpenRouterPersistedRequestHandler;

    expect(
      handler.resolveAiReactionRequest({
        data: {
          shouldReplySocialModuleProfile: {
            id: "assistant-profile",
          },
          modelId: "caller/model-override",
          reasoning: "none",
          skillIds: ["caller-skill"],
          useKnowledgeSearch: false,
        },
        socialModuleMessage: {
          metadata: {
            rbacAiReactionRequest: {
              version: 1,
              modelId: "openai/gpt-5.2",
              reasoning: "high",
              skillIds: ["skill-1"],
              useKnowledgeSearch: true,
            },
          },
        },
      }),
    ).toEqual({
      version: 1,
      modelId: "openai/gpt-5.2",
      reasoning: "high",
      skillIds: ["skill-1"],
      useKnowledgeSearch: true,
    });
  });

  /**
   * BDD Scenario
   * Given: Agent selected one of multiple AI profiles connected to the chat.
   * When: the OpenRouter handler resolves the request.
   * Then: persisted execution settings apply without restricting that profile.
   */
  it("When: Agent selects a reply profile Then: message settings do not override it", () => {
    const handler = Object.create(
      Handler.prototype,
    ) as IOpenRouterPersistedRequestHandler;

    expect(
      handler.resolveAiReactionRequest({
        data: {
          shouldReplySocialModuleProfile: {
            id: "different-assistant",
          },
        },
        socialModuleMessage: {
          metadata: {
            rbacAiReactionRequest: {
              version: 1,
              modelId: "auto",
              reasoning: "auto",
              skillIds: [],
              useKnowledgeSearch: false,
            },
          },
        },
      }),
    ).toEqual({
      version: 1,
      modelId: "auto",
      reasoning: "high",
      skillIds: [],
      useKnowledgeSearch: false,
    });
  });

  /**
   * BDD Scenario
   * Given: a Telegram or legacy message has no reaction envelope.
   * When: Agent supplies its backend-selected profile.
   * Then: only safe automatic defaults are synthesized.
   */
  it("When: persisted intent is absent Then: backend-selected legacy defaults are used", () => {
    const handler = Object.create(
      Handler.prototype,
    ) as IOpenRouterPersistedRequestHandler;

    expect(
      handler.resolveAiReactionRequest({
        data: {
          shouldReplySocialModuleProfile: {
            id: "assistant-profile",
          },
        },
        socialModuleMessage: {},
      }),
    ).toEqual({
      version: 1,
      modelId: "auto",
      reasoning: "high",
      skillIds: [],
      useKnowledgeSearch: false,
    });
  });

  it.each(["low", "none", "xhigh"])(
    "enforces high reasoning when persisted intent requests %s",
    (reasoning) => {
      const handler = Object.create(
        Handler.prototype,
      ) as IOpenRouterPersistedRequestHandler;
      expect(
        handler.resolveAiReactionRequest({
          data: {},
          socialModuleMessage: {
            metadata: {
              rbacAiReactionRequest: {
                version: 1,
                modelId: "openai/gpt-6.1-sol",
                reasoning,
                skillIds: ["skill-1"],
                useKnowledgeSearch: true,
              },
            },
          },
        }),
      ).toEqual({
        version: 1,
        modelId: "openai/gpt-6.1-sol",
        reasoning: "high",
        skillIds: ["skill-1"],
        useKnowledgeSearch: true,
      });
    },
  );
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a caller supplies a human reply profile.
   * When: OpenRouter validates the reply identity.
   * Then: the request is rejected before generation or tool execution.
   */
  it("When: reply profile is not AI Then: identity validation fails closed", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterIdentityGuardHandler;

    expect(() => {
      handler.assertReplyProfile({
        id: "reply-profile",
        variant: "default",
      });
    }).toThrow(
      'OpenRouter reactions require reply profile variant="artificial-intelligence"',
    );
  });

  /**
   * BDD Scenario
   * Given: the requester profile is not linked to the requested chat or message.
   * When: OpenRouter validates route ownership.
   * Then: both foreign-resource combinations are rejected.
   */
  it("When: requester resources are foreign Then: route ownership validation rejects them", async () => {
    const handler = new Handler({
      socialModule: {
        profilesToChats: {
          find: jest.fn(async () => []),
        },
        profilesToMessages: {
          find: jest.fn(async () => []),
        },
      },
      subjectsToRoles: {
        find: jest.fn(async () => []),
      },
    } as any) as unknown as IOpenRouterIdentityGuardHandler;

    await expect(
      handler.assertProfileCanAccessChat({
        subjectId: "requester-subject",
        socialModuleProfileId: "requester-profile",
        socialModuleChatId: "foreign-chat",
      }),
    ).rejects.toThrow("chat does not belong to profile");
    await expect(
      handler.assertProfileCanAccessMessage({
        socialModuleProfileId: "requester-profile",
        socialModuleMessageId: "foreign-message",
      }),
    ).rejects.toThrow("message does not belong to profile");
  });

  /**
   * BDD Scenario
   * Given: the trigger message or reply profile belongs to another chat.
   * When: OpenRouter validates chat integrity.
   * Then: neither foreign relationship can reach generation.
   */
  it("When: chat relationships are foreign Then: chat integrity validation rejects them", async () => {
    const handler = new Handler({
      socialModule: {
        chatsToMessages: {
          find: jest.fn(async () => []),
        },
        profilesToChats: {
          find: jest.fn(async () => []),
        },
      },
    } as any) as unknown as IOpenRouterIdentityGuardHandler;

    await expect(
      handler.assertMessageBelongsToChat({
        socialModuleChatId: "chat",
        socialModuleMessageId: "foreign-message",
      }),
    ).rejects.toThrow("message does not belong to chat");
    await expect(
      handler.assertReplyProfileConnectedToChat({
        socialModuleProfileId: "foreign-reply-profile",
        socialModuleChatId: "chat",
      }),
    ).rejects.toThrow("Reply social-module profile is not connected to chat");
  });

  /**
   * BDD Scenario
   * Given: an AI profile is linked to zero or multiple RBAC subjects.
   * When: the social.profile rbac.subject is resolved.
   * Then: credential issuance fails closed unless exactly one subject exists.
   */
  it("When: rbac.subject cardinality is not one Then: principal resolution fails closed", async () => {
    const relationsFind = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { subjectId: "social.profile-a" },
        { subjectId: "social.profile-b" },
      ]);
    const handler = new Handler({
      subjectsToSocialModuleProfiles: {
        find: relationsFind,
      },
      findById: jest.fn(),
    } as any) as unknown as IOpenRouterIdentityGuardHandler;

    await expect(
      handler.resolveRbacSubjectForSocialProfile("reply-profile"),
    ).rejects.toThrow("exactly one linked rbac.subject");
    await expect(
      handler.resolveRbacSubjectForSocialProfile("reply-profile"),
    ).rejects.toThrow("exactly one linked rbac.subject");
  });

  /**
   * BDD Scenario
   * Given: an AI profile has exactly one linked rbac.subject.
   * When: the social.profile rbac.subject is resolved.
   * Then: the server-bound subject is returned without caller override input.
   */
  it("When: one rbac.subject is linked Then: principal resolution uses that relation", async () => {
    const findById = jest.fn(async () => ({ id: "rbac-subject" }));
    const handler = new Handler({
      subjectsToSocialModuleProfiles: {
        find: jest.fn(async () => [{ subjectId: "rbac-subject" }]),
      },
      findById,
    } as any) as unknown as IOpenRouterIdentityGuardHandler;

    await expect(
      handler.resolveRbacSubjectForSocialProfile("reply-profile"),
    ).resolves.toEqual({ id: "rbac-subject" });
    expect(findById).toHaveBeenCalledWith({ id: "rbac-subject" });
  });

  /**
   * BDD Scenario
   * Given: a thread has more than 100 linked messages and one foreign-chat message.
   * When: the handler resolves context message ids for OpenRouter.
   * Then: it paginates through all thread links and excludes messages outside the chat.
   */
  it("When: context ids are resolved Then: all current-thread chat messages are returned", async () => {
    const threadMessageLinks = Array.from({ length: 102 }, (_, index) => {
      return {
        threadId: "thread-1",
        messageId: createMessageId(index + 1),
      };
    });
    const threadsToMessagesFind = jest.fn(async ({ params }) => {
      const offset = params.offset || 0;
      const limit = params.limit || 100;

      return threadMessageLinks.slice(offset, offset + limit);
    });
    const chatsToMessagesFind = jest.fn(async () => {
      return threadMessageLinks
        .filter((relation) => relation.messageId !== createMessageId(50))
        .map((relation) => {
          return {
            chatId: "chat-1",
            messageId: relation.messageId,
          };
        });
    });

    const handler = new Handler({
      socialModule: {
        threadsToMessages: {
          find: threadsToMessagesFind,
        },
        chatsToMessages: {
          find: chatsToMessagesFind,
        },
      },
    } as any) as unknown as IFindThreadMessageIdsInChatHandler;

    const messageIds = await handler.findThreadMessageIdsInChat({
      socialModuleChatId: "chat-1",
      socialModuleThreadId: "thread-1",
    });

    expect(threadsToMessagesFind).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          limit: 100,
          offset: 0,
        }),
      }),
    );
    expect(threadsToMessagesFind).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          limit: 100,
          offset: 100,
        }),
      }),
    );
    expect(messageIds).toContain(createMessageId(101));
    expect(messageIds).not.toContain(createMessageId(50));
    expect(messageIds).toHaveLength(101);
  });

  /**
   * BDD Scenario
   * Given: a selected text-output model returns only whitespace.
   * When: generation validation inspects the candidate result.
   * Then: the result is rejected as empty text before it can become an assistant reply.
   */
  it("When: text generation is empty Then: generation validation rejects it", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;

    expect(
      handler.getGenerationValidationError({
        expectedOutputModality: "text",
        result: {
          text: "  ",
        },
      }),
    ).toBe("expected text output, but model returned empty text");
  });

  /**
   * BDD Scenario
   * Given: the selected final model returns a provider error and one fallback model returns valid text.
   * When: final generation is resolved for a text reply.
   * Then: exactly one fallback attempt is used and the fallback result becomes the assistant reply source.
   */
  it("When: primary generation errors Then: one fallback model can produce the final reply", async () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;
    const openRouter = {
      generate: jest
        .fn()
        .mockResolvedValueOnce({
          error: {
            message: "provider failed",
          },
          billing: null,
        })
        .mockResolvedValueOnce({
          text: "Fallback answer",
          billing: {},
        }),
    };
    const onModelAttempt = jest.fn(async () => undefined);
    const billingLedger: any[] = [];

    const result = await handler.generateFinalOpenRouterReply({
      billingLedger,
      openRouter,
      modelSelection: {
        orderedCandidateIds: ["openai/gpt-5.2", "anthropic/claude-haiku-4.5"],
        selectedModelId: "openai/gpt-5.2",
        selectedBy: "llm",
      },
      expectedOutputModality: "text",
      generationContext: [
        {
          role: "user",
          content: "Hello",
        },
      ],
      onModelAttempt,
    });

    expect(result).toMatchObject({
      selectedModelId: "anthropic/claude-haiku-4.5",
      generationResult: {
        text: "Fallback answer",
      },
      fallbackReasons: ["model=openai/gpt-5.2: generation error"],
    });
    expect(openRouter.generate).toHaveBeenCalledTimes(2);
    expect(openRouter.generate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: "openai/gpt-5.2",
        max_tokens: 8192,
        stripNonTextOnRetry: false,
      }),
    );
    expect(openRouter.generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: "anthropic/claude-haiku-4.5",
        max_tokens: 8192,
        stripNonTextOnRetry: false,
      }),
    );
    expect(onModelAttempt).toHaveBeenCalledTimes(2);
    expect(billingLedger).toHaveLength(2);
    expect(billingLedger[0]).toMatchObject({
      status: "error",
      fallbackReason: "model=openai/gpt-5.2: generation error",
    });
  });

  /**
   * BDD Scenario
   * Given: the selected final model and its single fallback both return empty text.
   * When: final generation is resolved for a text reply.
   * Then: technical reasons stay internal and the terminal error is actionable for the user.
   */
  it("When: primary and fallback text are invalid Then: terminal failure is human-readable", async () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;
    const openRouter = {
      generate: jest
        .fn()
        .mockResolvedValueOnce({
          text: " ",
          billing: {},
        })
        .mockResolvedValueOnce({
          text: "",
          billing: {},
        }),
    };

    const result = await handler.generateFinalOpenRouterReply({
      billingLedger: [],
      openRouter,
      modelSelection: {
        orderedCandidateIds: ["openai/gpt-5.2", "anthropic/claude-haiku-4.5"],
        selectedModelId: "openai/gpt-5.2",
        selectedBy: "llm",
      },
      expectedOutputModality: "text",
      generationContext: [
        {
          role: "user",
          content: "Hello",
        },
      ],
    });

    expect(result.generationResult).toBeUndefined();
    expect(result.fallbackReasons).toEqual([
      "model=openai/gpt-5.2: expected text output, but model returned empty text",
      "model=anthropic/claude-haiku-4.5: expected text output, but model returned empty text",
    ]);
    expect(
      handler.buildNoValidModelResponseMessage(result.fallbackReasons),
    ).toBe(
      "A valid response could not be received from the model. Please try again or select another model.",
    );
    expect(
      handler.buildNoValidModelResponseMessage(result.fallbackReasons, "ru"),
    ).toBe(
      "Не удалось получить корректный ответ от модели. Попробуйте повторить запрос или выбрать другую модель.",
    );
    expect(openRouter.generate).toHaveBeenCalledTimes(2);
  });

  /**
   * BDD Scenario
   * Given: final text reply construction receives empty raw generated text.
   * When: the handler builds the success reply payload.
   * Then: it throws before appending the model footer or creating an assistant message.
   */
  it("When: final text reply is empty Then: reply construction throws before footer append", async () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;

    await expect(
      handler.buildOpenRouterReplyMessageData({
        expectedOutputModality: "text",
        generationResult: {
          text: "",
          billing: {},
        },
        selectModelForRequest: "openai/gpt-5.2",
        billingSettlement: {
          summary: {
            exactTokens: 1,
          },
          settlement: null,
        },
      }),
    ).rejects.toThrow("Generated message is empty");
  });

  /**
   * BDD Scenario
   * Given: a model returns LaTeX that neither Telegram nor the web Markdown renderer supports.
   * When: the handler builds the canonical assistant message.
   * Then: it stores portable text math before appending the model footer.
   */
  it("When: final text reply contains LaTeX Then: portable math is stored", async () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;

    await expect(
      handler.buildOpenRouterReplyMessageData({
        expectedOutputModality: "text",
        generationResult: {
          text: String.raw`\[\text{Окупаемость} = \frac{\text{вложения}}{\text{чистый доход}}\]`,
          billing: {},
        },
        selectModelForRequest: "openai/gpt-5.6",
        billingSettlement: {
          summary: {
            exactTokens: 1,
          },
          settlement: null,
        },
      }),
    ).resolves.toMatchObject({
      description:
        "Окупаемость = (вложения) / (чистый доход)\n\n__openai/gpt-5.6__",
    });
  });

  /**
   * BDD Scenario
   * Given: an image-output model returns a valid image URL and no text.
   * When: the handler builds the success reply payload.
   * Then: it keeps the generated-image fallback description and attaches the image file.
   */
  it("When: image reply has no text Then: image fallback description remains valid", async () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;

    await expect(
      handler.buildOpenRouterReplyMessageData({
        expectedOutputModality: "image",
        generationResult: {
          text: "",
          images: [
            {
              url: "https://example.com/generated.png",
            },
          ],
          billing: {},
        },
        selectModelForRequest: "openai/gpt-5-image",
        billingSettlement: {
          summary: {
            exactTokens: 1,
          },
          settlement: {
            settlement: {
              id: "settlement-1",
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      description: "Изображение сгенерировано\n\n__openai/gpt-5-image__",
      files: ["generated-file"],
    });

    expect(blobifyFiles).toHaveBeenCalledWith({
      files: [
        {
          title: "generated-image",
          type: "image/png",
          extension: "png",
          url: "https://example.com/generated.png",
        },
      ],
    });
  });

  /**
   * BDD Scenario
   * Given: the latest image request uses a pronoun referring to an earlier object.
   * When: the handler builds image generation context.
   * Then: it sends a standalone image prompt with the text history and drops non-image file URLs.
   */
  it("When: image request is contextual Then: image prompt preserves text history only", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;

    const generationContext = handler.buildGenerationContext({
      expectedOutputModality: "image",
      language: "ru",
      context: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Какая высота Эйфелевой башни?",
            },
            {
              type: "file_url",
              file_url: {
                url: "https://example.com/voice.mp3",
              },
            },
          ],
        },
        {
          role: "assistant",
          content: "Высота Эйфелевой башни около 330 метров.",
        },
        {
          role: "user",
          content: "Нарисуй ее фотографию.",
        },
      ],
    });

    expect(generationContext).toHaveLength(2);
    expect(generationContext[1].content).toEqual(
      expect.stringContaining("Какая высота Эйфелевой башни?"),
    );
    expect(generationContext[1].content).toEqual(
      expect.stringContaining("Нарисуй ее фотографию."),
    );
    expect(JSON.stringify(generationContext)).not.toContain("voice.mp3");
    expect(JSON.stringify(generationContext)).toContain(
      "not a portrait of an unrelated person",
    );
  });

  /**
   * BDD Scenario
   * Given: a transcribed Telegram voice message still has an audio file attached.
   * When: OpenRouter context is built from message attachments.
   * Then: the audio file is treated as transcript source, not as model input.
   */
  it("When: attached file is audio Then: it is ignored as OpenRouter input", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterReplyValidationHandler;

    expect(
      handler.isAudioFileStorageFile({
        extension: "mp3",
        file: "/file-storage/static/voice.mp3",
        mimeType: "audio/mpeg",
      }),
    ).toBe(true);
    expect(
      handler.isAudioFileStorageFile({
        extension: "png",
        file: "/file-storage/static/image.png",
        mimeType: "image/png",
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: a message contains two related text files and an image.
   * When: OpenRouter context and automatic-routing text are built.
   * Then: both original text files and the image stay attached while extracted text is used only for routing.
   */
  it("When: several files are attached Then: originals drive generation and text previews drive routing", async () => {
    const readBytes = jest
      .fn()
      .mockResolvedValueOnce(
        Buffer.from("Часть 1: кота на фотографии зовут Барсик."),
      )
      .mockResolvedValueOnce(
        Buffer.from("Часть 2: любимая игрушка Барсика — зелёный мяч."),
      )
      .mockResolvedValueOnce(Buffer.from([0xff, 0xd8, 0xff]));
    const handler = new Handler({
      fileStorageModule: { file: { readBytes } },
    } as any) as unknown as IOpenRouterAttachmentContextHandler;

    const resolved = await handler.resolveOpenRouterMessageContext({
      messageDescription:
        "Ответь, как зовут кота и какая у него любимая игрушка.",
      fileStorageFiles: [
        {
          extension: "txt",
          file: "/file-storage/static/cat-part-1.txt",
          mimeType: "text/plain",
        },
        {
          extension: "txt",
          file: "/file-storage/static/cat-part-2.txt",
          mimeType: "text/plain",
        },
        {
          extension: "jpeg",
          file: "/file-storage/static/cat.jpeg",
          adminTitle: "Барсик.jpeg",
          mimeType: "image/jpeg",
        },
      ],
    });

    expect(resolved.content).toEqual([
      {
        type: "text",
        text: "Ответь, как зовут кота и какая у него любимая игрушка.",
      },
      { type: "text", text: "Attached file: cat-part-1.txt" },
      {
        type: "file_url",
        file_url: {
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/public/file-storage/static/cat-part-1.txt`,
        },
      },
      { type: "text", text: "Attached file: cat-part-2.txt" },
      {
        type: "file_url",
        file_url: {
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/public/file-storage/static/cat-part-2.txt`,
        },
      },
      { type: "text", text: "Attached image: Барсик.jpeg" },
      {
        type: "image_url",
        image_url: {
          url: `${NEXT_PUBLIC_API_SERVICE_URL}/public/file-storage/static/cat.jpeg`,
        },
      },
    ]);
    expect(resolved.routingText).toContain("кота на фотографии зовут Барсик");
    expect(resolved.routingText).toContain(
      "любимая игрушка Барсика — зелёный мяч",
    );
    expect(JSON.stringify(resolved.content)).not.toContain(
      "любимая игрушка Барсика",
    );
    expect(
      handler.detectInputModalitiesFromContext([
        {
          role: "user",
          content: resolved.content as Exclude<
            typeof resolved.content,
            string | null
          >,
        },
      ]),
    ).toEqual(["text", "image", "file"]);
  });

  /**
   * BDD Scenario
   * Given: an assistant proposal shows copies of the user's attachment references.
   * When: message content is prepared for OpenRouter.
   * Then: preview copies are omitted while the original user attachments remain.
   */
  it("does not repeat proposal-gallery files in model context, while preserving original message attachments", async () => {
    const readBytes = jest.fn(async () =>
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    const handler = new Handler({
      fileStorageModule: { file: { readBytes } },
    } as any) as any;
    const props = {
      messageDescription: "Proposed notes",
      fileStorageFiles: [
        { id: "reference", file: "/reference.png", mimeType: "image/png" },
      ],
    };
    expect(
      (
        await handler.resolveOpenRouterMessageContext({
          ...props,
          presentationOnlyFileIds: ["reference"],
        })
      ).content,
    ).toBe("Proposed notes");
    const original = await handler.resolveOpenRouterMessageContext(props);
    expect(original.content).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "image_url" })]),
    );
  });

  it.each([
    { file: "/legacy.svg", extension: "svg", mimeType: "image/svg+xml" },
    { file: "/renamed.png", extension: "png", mimeType: "image/png" },
    { file: "/notes.txt", extension: "txt", mimeType: "text/plain" },
  ])(
    "excludes legacy SVG bytes from every model content part: $file",
    async (file) => {
      const readBytes = jest.fn(async () =>
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      );
      const handler = new Handler({
        fileStorageModule: { file: { readBytes } },
      } as any) as any;
      const result = await handler.resolveOpenRouterMessageContext({
        messageDescription: "Keep notes",
        fileStorageFiles: [file],
      });
      expect(result.content).toBe("Keep notes");
      expect(result.routingText).toContain("Unsupported attachment excluded");
      expect(JSON.stringify(result.content)).not.toContain("image_url");
      expect(JSON.stringify(result.content)).not.toContain("file_url");
      expect(JSON.stringify(result.content)).not.toContain("<svg");
    },
  );

  /**
   * BDD Scenario
   * Given: the chat UI sends a manual Thinking value.
   * When: OpenRouter reasoning params are built.
   * Then: auto is omitted and explicit efforts hide reasoning content by default.
   */
  it("When: Thinking is mapped Then: OpenRouter reasoning payload is explicit", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;

    expect(handler.toOpenRouterReasoning("auto")).toBeUndefined();
    expect(handler.toOpenRouterReasoning("low")).toEqual({
      effort: "low",
      exclude: true,
    });
    expect(handler.toOpenRouterReasoning("high")).toEqual({
      effort: "high",
      exclude: true,
    });
    expect(handler.toOpenRouterReasoning("xhigh")).toEqual({
      effort: "xhigh",
      exclude: true,
    });
    expect(handler.toOpenRouterReasoning("none")).toEqual({
      effort: "none",
      exclude: true,
    });
  });

  /**
   * BDD Scenario
   * Given: the user selected a concrete OpenRouter model in the composer.
   * When: the manual model plan is built.
   * Then: text generation is inferred directly from the selected model without requiring auto-routing classification.
   */
  it("When: manual model is selected Then: it builds direct text generation metadata", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;
    const manualModel = handler.resolveManualOpenRouterModel({
      modelId: "openai/gpt-6.1-sol",
      models: [
        {
          id: "openai/gpt-6.1-sol",
          architecture: {
            input_modalities: ["text"],
            output_modalities: ["text"],
          },
        },
      ],
      requiredInputModalitiesList: ["text"],
    });
    const expectedOutputModality =
      handler.resolveManualExpectedOutputModality(manualModel);

    expect(expectedOutputModality).toBe("text");
    expect(
      handler.buildManualRequestClassification({
        expectedOutputModality,
        requestText: "Купить квартиру - насколько это грамотное решение?",
        requiredInputModalitiesList: ["text"],
      }),
    ).toEqual({
      language: "ru",
      task: "qa",
      input_modalities: ["text"],
      output_modality: "text",
      need_web: false,
      complexity: "medium",
      risk_level: "low",
    });
  });

  it("rejects a formerly allowed model even when the provider still lists it", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;
    expect(() =>
      handler.resolveManualOpenRouterModel({
        modelId: "minimax/minimax-m3",
        models: [
          {
            id: "minimax/minimax-m3",
            architecture: {
              input_modalities: ["text"],
              output_modalities: ["text"],
            },
          },
        ],
        requiredInputModalitiesList: ["text"],
      }),
    ).toThrow("not in the local allowed model catalogue");
  });

  /**
   * BDD Scenario
   * Given: the user selected and invoked skills in a Knowledge chat.
   * When: OpenRouter resolves prompt skills for the replying profile.
   * Then: linked skills are returned and unlinked requested ids are rejected.
   */
  it("When: prompt skills are resolved Then: only linked skills are used", async () => {
    const handler = new Handler({
      socialModule: {
        profilesToSkills: {
          find: jest.fn(async () => [
            {
              skillId: "skill-1",
            },
            {
              skillId: "skill-2",
            },
          ]),
        },
        skill: {
          find: jest.fn(async () => [
            {
              id: "skill-1",
              slug: "brief-writer",
            },
            {
              id: "skill-2",
              slug: "fact-checker",
            },
          ]),
        },
      },
    } as any) as unknown as IOpenRouterKnowledgeControlsHandler;

    await expect(
      handler.findPromptSkillsForProfile({
        socialModuleProfileId: "profile-1",
        skillIds: ["skill-1", "skill-2"],
        skillSlugs: ["brief-writer"],
      }),
    ).resolves.toEqual([
      {
        id: "skill-1",
        slug: "brief-writer",
      },
      {
        id: "skill-2",
        slug: "fact-checker",
      },
    ]);

    await expect(
      handler.findPromptSkillsForProfile({
        socialModuleProfileId: "profile-1",
        skillIds: ["skill-3"],
        skillSlugs: [],
      }),
    ).rejects.toThrow("Selected social skills are not linked");
  });

  /**
   * BDD Scenario
   * Given: a chat message contains slash skills and reserved slash commands.
   * When: OpenRouter parses invoked social skills.
   * Then: only non-reserved slash tokens are treated as skills.
   */
  it("When: slash tokens are parsed Then: reserved commands are excluded", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;

    expect(
      handler.getMentionedSkillSlugs(
        "/knowledge /learn Store this /brief-writer /new",
      ),
    ).toEqual(["brief-writer"]);
    expect(
      handler.toOpenRouterUserQuery({
        rawQuery: "/knowledge What is in the profile knowledge?",
        requestedKnowledgeSearch: true,
        hasMentionedSkill: false,
        requestedSkillIds: [],
      }),
    ).toBe("What is in the profile knowledge?");
  });

  /**
   * BDD Scenario
   * Given: a thread history contains Knowledge learning messages and normal slash skills.
   * When: OpenRouter decides which messages are eligible for generation context.
   * Then: learning commands and confirmations are skipped while slash skills remain usable.
   */
  it("When: learn messages are classified Then: only learning context is skipped", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;

    expect(
      handler.isOpenRouterLearnContextMessage("@knowledge /learn Store this"),
    ).toBe(true);
    expect(handler.isOpenRouterLearnContextMessage("/learn Store this")).toBe(
      true,
    );
    expect(
      handler.isOpenRouterLearnContextMessage("Learned 1 knowledge item."),
    ).toBe(true);
    expect(
      handler.isOpenRouterLearnContextMessage("Learned 2 knowledge items."),
    ).toBe(true);
    expect(
      handler.isOpenRouterLearnContextMessage(
        "/brief-writer Rewrite this message",
      ),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: the user invokes a linked profile skill with slash syntax.
   * When: OpenRouter resolves Knowledge context for generation.
   * Then: the skill is exposed as a user-message prefix and not as a system message.
   */
  it("When: slash skills are resolved Then: they become a message prefix", async () => {
    const handler = new Handler({
      socialModule: {
        profilesToSkills: {
          find: jest.fn(async () => [
            {
              skillId: "skill-1",
            },
          ]),
        },
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () => []),
        },
        skill: {
          find: jest.fn(async () => [
            {
              id: "skill-1",
              title: "Brief Writer",
              slug: "brief-writer",
              description: "Write a concise brief.",
            },
          ]),
        },
      },
    } as any) as unknown as IOpenRouterKnowledgeControlsHandler;

    const context = await handler.resolveOpenRouterKnowledgeContext({
      billingLedger: [],
      data: {},
      openRouter: {
        generate: jest.fn(),
      },
      replyProfile: {
        id: "profile-1",
      },
      socialModuleMessage: {
        id: "message-1",
        description: "/brief-writer What should we answer?",
      },
      sanitizedQuery: "What should we answer?",
      requestedKnowledgeSearch: false,
      requestedSkillIds: [],
      selectedModelId: "openai/gpt-6.1-sol",
      threadContext: [],
    });

    expect(context.promptSkills).toEqual([
      expect.objectContaining({
        id: "skill-1",
        slug: "brief-writer",
      }),
    ]);
    expect(context.skillMessagePrefix).toContain("/brief-writer");
    expect(context.skillMessagePrefix).toContain("Write a concise brief.");
    expect(context.systemMessages).toEqual([]);
  });

  /**
   * BDD Scenario
   * Given: the OpenRouter context contains a trigger user message.
   * When: a selected skill prefix is attached.
   * Then: only the latest user message receives the prefix while file parts are preserved.
   */
  it("When: a skill prefix is attached Then: the latest user message is prefixed", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;

    expect(
      handler.attachSkillMessagePrefixToContext({
        context: [
          {
            role: "assistant",
            content: "Previous answer",
          },
          {
            role: "user",
            content: "Rewrite this",
          },
        ],
        skillMessagePrefix: "Selected social skills for this message:",
      }),
    ).toEqual([
      {
        role: "assistant",
        content: "Previous answer",
      },
      {
        role: "user",
        content: "Selected social skills for this message:\n\nRewrite this",
      },
    ]);

    expect(
      handler.attachSkillMessagePrefixToContext({
        context: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Use this image",
              },
              {
                type: "image_url",
                image_url: {
                  url: "https://example.test/image.png",
                },
              },
            ],
          },
        ],
        skillMessagePrefix: "Skill instructions",
      }),
    ).toEqual([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Skill instructions\n\nUse this image",
          },
          {
            type: "image_url",
            image_url: {
              url: "https://example.test/image.png",
            },
          },
        ],
      },
    ]);
  });

  /**
   * BDD Scenario
   * Given: the replying profile has localized title and description.
   * When: OpenRouter builds generation context.
   * Then: profile persona is included before conversation history without transport-specific response restrictions.
   */
  it("When: generation context is built Then: profile persona is a system message", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;
    const profileSystemMessage = handler.toProfileSystemMessage({
      language: "ru",
      replyProfile: {
        id: "profile-1",
        slug: "chat-gpt-1",
        adminTitle: "Chat GPT 1",
        title: {
          ru: "Редактор",
        },
        description: {
          ru: "Редактирует пользовательский текст без переписывания смысла.",
        },
      },
    });

    const generationContext = handler.buildGenerationContext({
      context: [
        {
          role: "user",
          content: "Поправь текст",
        },
      ],
      expectedOutputModality: "text",
      language: "ru",
      profileSystemMessage,
    });

    expect(generationContext).toEqual([
      {
        role: "system",
        content:
          "Answer in the language requested by the current user; otherwise use the language of their latest message. Use portable Markdown only. Do not add emoji or decorative pictograms to replies, headings, lists, or status text. Do not use LaTeX delimiters or commands. Write formulas with plain text and Unicode mathematical symbols so the same answer is readable in web chat and Telegram.",
      },
      profileSystemMessage,
      {
        role: "user",
        content: "Поправь текст",
      },
    ]);
  });

  it("excludes both old emoji-prefixed and plain generation statuses from model history", () => {
    const handler = new Handler({} as any) as any;
    for (const status of [
      "Генерирую ответ с помощью openai/gpt-6.1-sol. Пожалуйста, подождите.",
      "🏥 Генерирую ответ с помощью openai/gpt-6.1-sol. Пожалуйста, подождите.",
      "👨🏻‍⚕️ Выбираю модель для ответа. Пожалуйста, подождите.",
    ]) {
      expect(handler.isOpenRouterProgressStatusMessage(status)).toBe(true);
    }
    expect(
      handler.isOpenRouterProgressStatusMessage("Ответ на вопрос о проекте"),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: the replying profile has an old TipTap JSON description.
   * When: OpenRouter builds profile system context.
   * Then: the profile persona contains plain text and not raw TipTap JSON.
   */
  it("When: profile description is legacy TipTap JSON Then: profile persona uses plain text", () => {
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;
    const profileSystemMessage = handler.toProfileSystemMessage({
      language: "en",
      replyProfile: {
        id: "profile-1",
        slug: "chat-gpt-1",
        adminTitle: "Chat GPT 1",
        title: {
          en: "Real Estate Expert",
        },
        description: {
          en: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Uses personal deal experience as expertise.",
                  },
                ],
              },
            ],
          }),
        },
      },
    });

    expect(profileSystemMessage.content).toContain(
      "Uses personal deal experience as expertise.",
    );
    expect(profileSystemMessage.content).not.toContain('"type":"doc"');
  });

  /**
   * BDD Scenario
   * Given: a replying profile has scoped Knowledge Sources.
   * When: OpenRouter resolves an ordinary task and an explicit @knowledge task.
   * Then: only the explicit task retrieves profile-scoped Knowledge.
   */
  it("When: linked Knowledge exists Then: only explicit @knowledge searches profile documents", async () => {
    const search = jest.fn(async () => [
      createKnowledgeSearchResult({
        id: "chunk-1",
        text: "Policy fragment",
      }),
    ]);
    const openRouter = {
      generate: jest.fn(),
      decide: jest.fn(async () => ({
        answers: { chunk_0: { type: "noul", noul: 0.95 } },
        billing: null,
      })),
    };
    const handler = new Handler({
      socialModule: {
        profilesToSkills: {
          find: jest.fn(async () => []),
        },
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () => [
            {
              knowledgeModuleSourceId: "document-1",
            },
          ]),
        },
      },
    } as any) as unknown as IOpenRouterKnowledgeControlsHandler;

    (
      handler as unknown as { knowledgeService: { search: typeof search } }
    ).knowledgeService = {
      search,
    };

    await expect(
      handler.resolveOpenRouterKnowledgeContext({
        billingLedger: [],
        data: {},
        openRouter,
        replyProfile: {
          id: "profile-1",
        },
        socialModuleMessage: {
          id: "message-1",
          description: "Question",
        },
        sanitizedQuery: "Question",
        requestedKnowledgeSearch: false,
        requestedSkillIds: [],
        selectedModelId: "openai/gpt-6.1-sol",
        threadContext: [],
      }),
    ).resolves.toMatchObject({
      useKnowledgeSearch: false,
      searchSourceIds: [],
      candidateSources: [],
      sources: [],
      systemMessages: [],
    });
    expect(search).not.toHaveBeenCalled();
    expect(openRouter.generate).not.toHaveBeenCalled();

    const context = await handler.resolveOpenRouterKnowledgeContext({
      billingLedger: [],
      data: {
        useKnowledgeSearch: true,
      },
      openRouter,
      replyProfile: {
        id: "profile-1",
      },
      socialModuleMessage: {
        id: "message-1",
        description: "@knowledge Question",
      },
      sanitizedQuery: "Question",
      requestedKnowledgeSearch: true,
      requestedSkillIds: [],
      reasoning: {
        effort: "low",
        exclude: true,
      },
      selectedModelId: "openai/gpt-6.1-sol",
      threadContext: [
        {
          role: "user",
          content: "Earlier question",
        },
      ],
    });

    expect(search).toHaveBeenCalledWith({
      query: "Question",
      topK: 30,
      neighborWindow: 1,
      sourceIds: ["document-1"],
    });
    expect(openRouter.decide).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "typesafe/jev-1.13",
        state: expect.objectContaining({ query: "Question" }),
      }),
    );
    expect(openRouter.generate).not.toHaveBeenCalled();
    expect(context).toMatchObject({
      useKnowledgeSearch: true,
      searchSourceIds: ["document-1"],
      candidateSources: [
        {
          text: "Policy fragment",
        },
      ],
      sources: [
        {
          text: "Policy fragment",
        },
      ],
      retrieval: {
        initialTopK: 30,
        neighborWindow: 1,
        candidateCount: 1,
        rerankTopK: 12,
        rerankedSourceIds: ["chunk-1"],
        rerankFallbackReason: null,
      },
    });
    expect(context.systemMessages[0].content).toContain("Policy fragment");
  });

  /**
   * BDD Scenario
   * Given: explicit @knowledge retrieval returns irrelevant candidate chunks.
   * When: JEV assigns no candidate a relevant probability.
   * Then: no fallback chunks are injected into the final generation context.
   */
  it("When: Knowledge rerank selects no chunks Then: the RAG context stays empty", async () => {
    const search = jest.fn(async () => [
      createKnowledgeSearchResult({
        id: "chunk-irrelevant",
        text: "Unrelated fragment",
      }),
    ]);
    const openRouter = {
      decide: jest.fn(async () => ({
        answers: { chunk_0: { type: "noul", noul: 0.01 } },
        billing: null,
      })),
    };
    const handler = new Handler({
      socialModule: {
        profilesToSkills: {
          find: jest.fn(async () => []),
        },
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () => [
            {
              knowledgeModuleSourceId: "document-1",
            },
          ]),
        },
      },
    } as any) as unknown as IOpenRouterKnowledgeControlsHandler;

    (
      handler as unknown as { knowledgeService: { search: typeof search } }
    ).knowledgeService = {
      search,
    };

    const context = await handler.resolveOpenRouterKnowledgeContext({
      billingLedger: [],
      data: {
        useKnowledgeSearch: true,
      },
      openRouter,
      replyProfile: {
        id: "profile-1",
      },
      socialModuleMessage: {
        id: "message-1",
        description: "@knowledge Question",
      },
      sanitizedQuery: "Question",
      requestedKnowledgeSearch: true,
      requestedSkillIds: [],
      selectedModelId: "openai/gpt-6.1-sol",
      threadContext: [],
    });

    expect(context.sources).toEqual([]);
    expect(context.retrieval).toMatchObject({
      candidateCount: 1,
      rerankedSourceIds: [],
      rerankFallbackReason: null,
      rerankReason: "JEV passage relevance",
    });
  });

  /**
   * BDD Scenario
   * Given: an social.profile has one linked skill and one linked Knowledge Source.
   * When: its local capability catalog is built and invoked by the model.
   * Then: only the linked skill slug and server-bound document ids can be used.
   */
  it("When: profile capabilities execute Then: skill and Knowledge scope stay server-bound", async () => {
    const search = jest.fn(async () => [
      createKnowledgeSearchResult({
        id: "chunk-1",
        text: "Scoped policy",
      }),
    ]);
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler & {
      knowledgeService: { search: typeof search };
    };
    handler.knowledgeService = { search };
    const tools = handler.buildProfileCapabilityTools({
      availableSkills: [
        {
          id: "skill-1",
          slug: "brief-writer",
          title: "Brief writer",
          description: "Write a concise brief.",
        },
      ],
      knowledgeSourceIds: ["document-1"],
    });
    const skillTool = tools.find(
      (tool) => tool.definition.function.name === "profile_skill_activate",
    );
    const knowledgeTool = tools.find(
      (tool) => tool.definition.function.name === "profile_knowledge_search",
    );

    expect(() =>
      skillTool?.validateArguments?.({ slug: "unlinked-skill" }),
    ).toThrow("not linked");
    await expect(
      skillTool?.execute({ slug: "brief-writer" }),
    ).resolves.toMatchObject({
      slug: "brief-writer",
      instructions: "Write a concise brief.",
    });
    await expect(knowledgeTool?.execute({ query: "policy" })).resolves.toEqual([
      expect.objectContaining({
        id: "chunk-1",
        text: "Scoped policy",
      }),
    ]);
    expect(search).toHaveBeenCalledWith({
      query: "policy",
      sourceIds: ["document-1"],
      topK: 12,
      neighborWindow: 1,
    });
  });

  it("pages large Sources and keeps edits bounded and scoped", async () => {
    const generated = "Данные файла ".repeat(10000);
    const content =
      "## Контекст пользователя\n<!-- knowledge:user -->\nМоя заметка\n<!-- /knowledge:user -->\n" +
      generated;
    const source = {
      id: "source-1",
      title: "Lesson",
      content,
      contentHash: "hash-1",
    };
    const updateSource = jest.fn(async () => ({
      source: { ...source, contentHash: "hash-2" },
    }));
    const handler = new Handler({} as any) as any;
    handler.knowledgeService = {
      listSources: jest.fn(async () => [source]),
      updateSource,
    };
    const tools = handler.buildProfileCapabilityTools({
      availableSkills: [],
      knowledgeSourceIds: [source.id],
    });
    const read = tools.find(
      (tool: any) => tool.definition.function.name === "profile_knowledge_read",
    );
    const edit = tools.find(
      (tool: any) => tool.definition.function.name === "profile_knowledge_edit",
    );
    const first = await read.execute({ sourceId: source.id });
    expect(first.content).toHaveLength(12000);
    expect(first.nextOffset).toBe(12000);
    expect(first.userContext).toBe("Моя заметка");
    const next = await read.execute({
      sourceId: source.id,
      offset: first.nextOffset,
      limit: 1000,
    });
    expect(next.content).toBe(content.slice(12000, 13000));
    await expect(read.execute({ sourceId: "outside-scope" })).rejects.toThrow(
      "not available",
    );
    await expect(
      edit.execute({ sourceId: "outside-scope", userContext: "Change" }),
    ).rejects.toThrow("not available");
    const result = await edit.execute({
      sourceId: source.id,
      userContext: "Моя заметка и дополнение",
      expectedContentHash: "hash-1",
    });
    expect(updateSource).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: source.id,
        expectedContentHash: "hash-1",
        content: expect.stringContaining(generated),
      }),
    );
    expect(result).toMatchObject({
      sourceId: source.id,
      contentHash: "hash-2",
    });
    expect(JSON.stringify(result).length).toBeLessThan(1000);
  });

  it("reads Russian text and long user notes in complete byte-bounded pages", async () => {
    const notes = 'Пояснение 😀\n"цитата"\\\t'.repeat(1000);
    const content = `## Контекст пользователя\n<!-- knowledge:user -->\n${notes}\n<!-- /knowledge:user -->\n${"Данные файла 🧾\n".repeat(3000)}`;
    const source = {
      id: "source-1",
      title: "Урок",
      content,
      contentHash: "hash-1",
    };
    const handler = new Handler({} as any) as any;
    handler.knowledgeService = { listSources: jest.fn(async () => [source]) };
    const read = handler
      .buildProfileCapabilityTools({
        availableSkills: [],
        knowledgeSourceIds: [source.id],
      })
      .find(
        (tool: any) =>
          tool.definition.function.name === "profile_knowledge_read",
      );

    for (const [section, expected] of [
      ["content", content],
      ["userContext", notes],
    ]) {
      let offset = 0;
      let reconstructed = "";
      do {
        const page = await read.execute({
          sourceId: source.id,
          section,
          offset,
        });
        expect(
          Buffer.byteLength(JSON.stringify(page), "utf8"),
        ).toBeLessThanOrEqual(24 * 1024);
        expect(page.userContextTruncated).toBe(true);
        expect(page.content.length).toBeGreaterThan(0);
        expect(expected.slice(offset).startsWith(page.content)).toBe(true);
        expect(page.content).toBe(
          Array.from(expected.slice(offset))
            .slice(0, Array.from(page.content).length)
            .join(""),
        );
        reconstructed += page.content;
        if (page.nextOffset === null) break;
        expect(page.nextOffset).toBeGreaterThan(offset);
        offset = page.nextOffset;
      } while (offset < expected.length);
      expect(reconstructed).toBe(expected);
    }
  });

  it("bounds all search excerpts and identifies where full Source reading is needed", async () => {
    const search = jest.fn(async () =>
      Array.from({ length: 12 }, (_, index) =>
        createKnowledgeSearchResult({
          id: `chunk-${index}`,
          sourceId: "source-1",
          sourceTitle: "Урок 😀".repeat(2000),
          text: 'Большой фрагмент 😀\n"числа"\\'.repeat(2000),
        }),
      ),
    );
    const handler = new Handler({} as any) as any;
    handler.knowledgeService = { search };
    const tool = handler
      .buildProfileCapabilityTools({
        availableSkills: [],
        knowledgeSourceIds: ["source-1"],
      })
      .find(
        (tool: any) =>
          tool.definition.function.name === "profile_knowledge_search",
      );
    const results = await tool.execute({ query: "Большой фрагмент" });
    expect(results).toHaveLength(12);
    expect(
      Buffer.byteLength(JSON.stringify(results), "utf8"),
    ).toBeLessThanOrEqual(24 * 1024);
    expect(
      results.every(
        (result: any) =>
          result.textTruncated &&
          result.text.length > 0 &&
          result.sourceId === "source-1",
      ),
    ).toBe(true);
  });

  /**
   * BDD Scenario
   * Given: the allowed SinglePageStartup MCP session exposes one live tool.
   * When: OpenRouter capabilities are assembled and the exposed tool executes.
   * Then: the namespaced model call is routed back to the exact server and live tool name.
   */
  it("When: live MCP capabilities execute Then: dispatch remains catalog-bound", async () => {
    const callTool = jest.fn(async () => ({
      isError: false,
      text: "Record found",
    }));
    const handler = new Handler(
      {} as any,
    ) as unknown as IOpenRouterKnowledgeControlsHandler;
    const tools = handler.buildMcpCapabilityTools({
      catalog: {
        supported: [],
        stale: [],
        connected: [
          {
            id: "singlepagestartup",
            title: "SinglePageStartup MCP",
            description: "Project tools",
            tools: [
              {
                name: "find_record",
                description: "Find a record",
                inputSchema: {
                  type: "object",
                  properties: { id: { type: "string" } },
                  required: ["id"],
                  additionalProperties: false,
                },
              },
            ],
          },
        ],
      },
      callTool,
      close: jest.fn(),
    });

    expect(tools.map((tool) => tool.definition.function.name)).toEqual([
      "mcp__singlepagestartup__find_record",
    ]);
    expect(tools[0]?.display).toEqual({
      label: "find_record",
      serverId: "singlepagestartup",
    });
    await expect(tools[0]?.execute({ id: "record-1" })).resolves.toEqual({
      isError: false,
      text: "Record found",
    });
    expect(callTool).toHaveBeenCalledWith({
      serverId: "singlepagestartup",
      name: "find_record",
      arguments: { id: "record-1" },
    });
  });

  /**
   * BDD Scenario
   * Given: a profile allows an MCP server that is temporarily unavailable.
   * When: OpenRouter prepares optional MCP capabilities for a text response.
   * Then: generation can continue without MCP tools and the unavailable server remains observable.
   */
  it("When: profile MCP is unavailable Then: OpenRouter generation degrades without tools", async () => {
    const socialModuleProfileMcpCatalogOpen = jest
      .fn()
      .mockRejectedValue(new Error("MCP service unavailable"));
    const handler = new Handler({
      socialModuleProfileMcpCatalogOpen,
    } as any) as unknown as IOpenRouterMcpFallbackHandler;
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await expect(
        handler.openProfileMcpCatalogBestEffort({
          configuredServerIds: ["singlepagestartup"],
          rbacSubjectAuthenticationJwt: "jwt",
          socialModuleProfileId: "profile-1",
        }),
      ).resolves.toEqual({
        session: null,
        unavailableServerIds: ["singlepagestartup"],
      });
      expect(socialModuleProfileMcpCatalogOpen).toHaveBeenCalledWith({
        configuredServerIds: ["singlepagestartup"],
        rbacSubjectAuthenticationJwt: "jwt",
      });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("continuing without MCP tools"),
        expect.objectContaining({
          socialModuleProfileId: "profile-1",
          serverIds: ["singlepagestartup"],
          error: "MCP service unavailable",
        }),
      );
    } finally {
      warn.mockRestore();
    }
  });

  /**
   * BDD Scenario
   * Given: OpenRouter returns an invalid Decisions response during Knowledge rerank.
   * When: Knowledge context is resolved.
   * Then: deterministic retrieval order is used and fallback metadata is recorded.
   */
  it("When: Knowledge rerank returns an invalid Decisions response Then: retrieval order fallback is used", async () => {
    const search = jest.fn(async () => [
      createKnowledgeSearchResult({
        id: "chunk-1",
        text: "First fragment",
      }),
      createKnowledgeSearchResult({
        id: "chunk-2",
        text: "Second fragment",
        chunkIndex: 1,
      }),
    ]);
    const openRouter = {
      decide: jest.fn(async () => ({
        error: { message: "Invalid Decisions response" },
        billing: null,
      })),
    };
    const handler = new Handler({
      socialModule: {
        profilesToSkills: {
          find: jest.fn(async () => []),
        },
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () => [
            {
              knowledgeModuleSourceId: "document-1",
            },
          ]),
        },
      },
    } as any) as unknown as IOpenRouterKnowledgeControlsHandler;

    (
      handler as unknown as { knowledgeService: { search: typeof search } }
    ).knowledgeService = {
      search,
    };

    const context = await handler.resolveOpenRouterKnowledgeContext({
      billingLedger: [],
      data: {
        useKnowledgeSearch: true,
      },
      openRouter,
      replyProfile: {
        id: "profile-1",
      },
      socialModuleMessage: {
        id: "message-1",
        description: "@knowledge Question",
      },
      sanitizedQuery: "Question",
      requestedKnowledgeSearch: true,
      requestedSkillIds: [],
      selectedModelId: "openai/gpt-6.1-sol",
      threadContext: [],
    });

    expect(context.sources).toEqual([
      expect.objectContaining({ id: "chunk-1" }),
      expect.objectContaining({ id: "chunk-2" }),
    ]);
    expect(context.retrieval).toMatchObject({
      candidateCount: 2,
      rerankedSourceIds: ["chunk-1", "chunk-2"],
      rerankFallbackReason: "JEV rerank failed; using retrieval order.",
    });
  });
  it("creates the first profile Source from a natural save request and attaches only the current message files", async () => {
    const relationCreate = jest.fn(async () => ({}));
    const originCreate = jest.fn(async () => ({}));
    const messageFiles = jest.fn(async () => [
      { fileStorageModuleFileId: "file-1" },
    ]);
    const handler = new Handler({
      socialModule: {
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () => []),
          create: relationCreate,
        },
        messagesToKnowledgeModuleSources: { findOrCreate: originCreate },
        messagesToFileStorageModuleFiles: { find: messageFiles },
      },
    } as any) as any;
    const learnContent = jest.fn(async (props) => {
      await props.onSourceSaved("new-source");
      return {
        source: {
          id: "new-source",
          contentHash: "hash",
          indexedContentHash: "hash",
        },
      };
    });
    handler.knowledgeService = { learnContent };
    const tools = handler.buildProfileCapabilityTools({
      availableSkills: [],
      knowledgeSourceIds: [],
      knowledgeAction: "create",
      replyProfileId: "profile-1",
      socialModuleMessage: { id: "message-1" },
    });
    const create = tools.find(
      (tool: any) =>
        tool.definition.function.name === "profile_knowledge_create",
    );
    expect(create).toBeDefined();
    expect(create.timeoutMs).toBe(240_000);
    const result = await create.execute({
      title: "Lesson",
      userContext: "My note",
    });
    expect(result.sourceId).toBe("new-source");
    expect(learnContent).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "My note",
        fileIds: ["file-1"],
        slug: "knowledge-profile-1-message-1",
      }),
    );
    expect(relationCreate).toHaveBeenCalledWith({
      data: { profileId: "profile-1", knowledgeModuleSourceId: "new-source" },
    });
    expect(originCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          messageId: "message-1",
          knowledgeModuleSourceId: "new-source",
          kind: "origin",
        }),
      }),
    );
  });

  it("selects the sole allowed candidate without another Jev or generation call", async () => {
    const handler = Object.create(Handler.prototype) as any;
    const openRouter = { generate: jest.fn(), decide: jest.fn() };
    const billingLedger: any[] = [];
    const candidates = handler.getEnabledCandidatesByClass("VISION");
    expect(
      handler.resolveModelCandidates({
        modelClass: "VISION",
        requiredInputModalitiesList: ["text", "image", "file"],
        expectedOutputModality: "text",
      }),
    ).toEqual(candidates);
    expect(
      handler.resolveModelCandidates({
        modelClass: "VISION",
        requiredInputModalitiesList: ["text"],
        expectedOutputModality: "image",
      }),
    ).toEqual([]);
    expect(
      await handler.selectModelCandidatesForRequest({
        openRouter,
        billingLedger,
        requestText: "Analyze the attached references",
        selectedModelClass: "VISION",
        modelCandidates: candidates,
      }),
    ).toEqual({
      selectedModelId: "openai/gpt-6.1-sol",
      orderedCandidateIds: ["openai/gpt-6.1-sol"],
      selectedBy: "single",
    });
    expect(openRouter.decide).not.toHaveBeenCalled();
    expect(openRouter.generate).not.toHaveBeenCalled();
    expect(billingLedger).toEqual([]);
  });

  it("uses Jev to choose only a local allowed candidate, with an allowed priority fallback", async () => {
    const handler = Object.create(Handler.prototype) as any;
    const decide = jest.fn(async () => ({
      answers: { model: { type: "choice", choice: "cheap" } },
      billing: null,
    }));
    const openRouter = { generate: jest.fn(), decide };
    const props = {
      openRouter,
      billingLedger: [],
      requestText: "Explain this",
      selectedModelClass: "CHAT",
      modelCandidates: [
        { id: "strong", priority: 100, strengths: ["reasoning"] },
        { id: "cheap", priority: 90, strengths: ["cost_efficiency"] },
      ],
    };
    expect(await handler.selectModelCandidatesForRequest(props)).toEqual({
      selectedModelId: "cheap",
      orderedCandidateIds: ["cheap", "strong"],
      selectedBy: "jev",
    });
    decide.mockResolvedValueOnce({
      answers: { model: { type: "choice", choice: "outside" } },
      billing: null,
    });
    expect(await handler.selectModelCandidatesForRequest(props)).toEqual({
      selectedModelId: "strong",
      orderedCandidateIds: ["strong", "cheap"],
      selectedBy: "priority",
    });
    expect(openRouter.generate).not.toHaveBeenCalled();
    expect(decide.mock.calls[0][0].model).toBe("typesafe/jev-1.13");
  });
});

it.each(["shared", "private"])(
  "keeps Knowledge available without activating %s document professions in ordinary threads",
  async (kind) => {
    const skills = AI_CHAT_DOCUMENTS.map((document, index) => ({
      id: `profession-${index}`,
      slug:
        kind === "private"
          ? `${document.skillSlug}-assistant`
          : document.skillSlug,
      title: document.title,
      description: "Current manually edited role instructions",
    }));
    const handler = new Handler({
      socialModule: {
        profilesToSkills: {
          find: jest.fn(async () =>
            skills.map((skill) => ({ skillId: skill.id })),
          ),
        },
        skill: { find: jest.fn(async () => skills) },
        profilesToKnowledgeModuleSources: {
          find: jest.fn(async () =>
            ["brief", "strategy", "brand", "design", "products"].map((id) => ({
              knowledgeModuleSourceId: id,
            })),
          ),
        },
      },
    } as any) as any;
    handler.knowledgeService = { search: jest.fn(async () => []) };
    const props = {
      billingLedger: [],
      openRouter: {} as any,
      replyProfile: { id: "assistant" },
      socialModuleMessage: { description: "Explain my project" },
      sanitizedQuery: "Explain my project",
      requestedKnowledgeSearch: true,
      requestedSkillIds: [],
      selectedModelId: null,
      threadContext: [],
      isAIChat: true,
    };
    const ordinary = await handler.resolveOpenRouterKnowledgeContext(props);
    expect(ordinary.availableSkills).toEqual([]);
    expect(ordinary.promptSkills).toEqual([]);
    expect(ordinary.skillMessagePrefix).toBe("");
    expect(ordinary.knowledgeSourceIds).toEqual([
      "brief",
      "strategy",
      "brand",
      "design",
      "products",
    ]);
    const explicit = await handler.resolveOpenRouterKnowledgeContext({
      ...props,
      socialModuleMessage: {
        description: `/${skills[1].slug}\nExplain my project`,
      },
    });
    expect(explicit.availableSkills).toEqual([skills[1]]);
    expect(explicit.promptSkills).toEqual([skills[1]]);
    expect(explicit.requestedSkillIds).toEqual([skills[1].id]);
    expect(
      explicit.skillMessagePrefix.match(
        /Current manually edited role instructions/g,
      ),
    ).toHaveLength(1);
    const selected = await handler.resolveOpenRouterKnowledgeContext({
      ...props,
      requestedSkillIds: [skills[2].id],
    });
    expect(selected.promptSkills).toEqual([skills[2]]);
    await expect(
      handler.resolveOpenRouterKnowledgeContext({
        ...props,
        requestedSkillIds: ["unlinked-profession"],
      }),
    ).rejects.toThrow("not linked to profile");
    const document = await handler.resolveOpenRouterKnowledgeContext({
      ...props,
      documentSkill: skills[0],
    });
    expect(document.promptSkills).toEqual([skills[0]]);
    expect(
      document.skillMessagePrefix.match(
        /Current manually edited role instructions/g,
      ),
    ).toHaveLength(1);
  },
);

it("document tools offer proposals and reads while direct Knowledge writers are absent", () => {
  const handler = new Handler({ socialModule: {} } as any) as any;
  const tools = handler.buildProfileCapabilityTools({
    availableSkills: [],
    knowledgeSourceIds: ["own-source", "other-document-source"],
    knowledgeAction: "update",
    replyProfileId: "assistant",
    socialModuleMessage: { id: "request" },
    disableKnowledgeWrites: true,
    documentContext: {
      targetSourceId: "own-source",
      document: {
        key: "brief",
        profileId: "assistant",
        sourceIds: ["own-source"],
      },
      thread: { id: "thread" },
      proposal: null,
    },
  });
  expect(tools.map((tool: any) => tool.definition.function.name)).toEqual([
    "profile_knowledge_propose",
    "profile_knowledge_search",
    "profile_knowledge_read",
  ]);
});

it("resolves the agent subject separately from the assistant ownership relation", async () => {
  const findById = jest.fn(async ({ id }) => ({ id, variant: "agent" }));
  const handler = new Handler({
    subjectsToSocialModuleProfiles: {
      find: jest.fn(async () => [
        { subjectId: "owner", variant: "assistant" },
        { subjectId: "agent", variant: "default" },
      ]),
    },
    findById,
  } as any) as any;
  expect(await handler.resolveRbacSubjectForSocialProfile("assistant")).toEqual(
    { id: "agent", variant: "agent" },
  );
  expect(findById).toHaveBeenCalledWith({ id: "agent" });
});

describe("Scoped Knowledge attachment tools", () => {
  afterEach(() => jest.restoreAllMocks());
  const scope = {
    id: "subject",
    socialModuleProfileId: "requester",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "assistant",
  };
  function capabilities(action?: "detach", documentSourceIds = ["brief"]) {
    const handler = new Handler({ socialModule: {} } as any) as any;
    handler.knowledgeService = {
      listSources: jest.fn(async ({ sourceIds }: any) => [
        { id: sourceIds[0], title: "Brief", contentHash: "hash" },
      ]),
    };
    return handler.buildProfileCapabilityTools({
      availableSkills: [],
      knowledgeSourceIds: ["brief", "strategy"],
      knowledgeAction: "update",
      disableKnowledgeWrites: true,
      knowledgeFileScope: scope,
      knowledgeFileAction: action,
      socialModuleMessage: {
        id: "request",
        description: "Remove the selected file",
      },
      documentContext: {
        document: {
          key: "brief",
          profileId: "assistant",
          sourceIds: documentSourceIds,
        },
        targetSourceId: "brief",
      },
    });
  }
  it("offers reads but no attachment mutation without an explicit current removal classification", () => {
    const names = capabilities().map(
      (tool: any) => tool.definition.function.name,
    );
    expect(names).toContain("profile_knowledge_files");
    expect(names).not.toContain("profile_knowledge_file_detach");
    expect(names).not.toContain("profile_knowledge_edit");
  });
  it("keeps an empty document read-only even when other profile Sources exist, without exposing an empty enum", () => {
    const tools = capabilities("detach", []);
    expect(
      tools.map((tool: any) => tool.definition.function.name),
    ).not.toContain("profile_knowledge_file_detach");
    for (const tool of tools)
      for (const parameter of Object.values(
        tool.definition.function.parameters.properties || {},
      ) as any[])
        if (parameter.enum) expect(parameter.enum.length).toBeGreaterThan(0);
  });
  it("lists exact file IDs and unlinks the selected file through the scoped SDK without editing document text", async () => {
    const find = jest
      .spyOn(
        subjectApi,
        "socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesFind",
      )
      .mockResolvedValue([
        {
          relation: { id: "link" },
          file: {
            id: "svg-file",
            adminTitle: "Frame 163.svg",
            mimeType: "image/svg+xml",
            extension: "svg",
            file: "/frame.svg",
          },
        },
      ] as any);
    const update = jest
      .spyOn(
        subjectApi,
        "socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate",
      )
      .mockResolvedValue({
        files: [],
        source: { contentHash: "new-hash", indexedContentHash: "new-hash" },
      } as any);
    const tools = capabilities("detach");
    expect(
      tools.map((tool: any) => tool.definition.function.name),
    ).not.toContain("profile_knowledge_propose");
    const list = tools.find(
      (tool: any) =>
        tool.definition.function.name === "profile_knowledge_files",
    );
    const detach = tools.find(
      (tool: any) =>
        tool.definition.function.name === "profile_knowledge_file_detach",
    );
    await expect(list.execute({ sourceId: "brief" })).resolves.toMatchObject({
      contentHash: "hash",
      total: 1,
      files: [{ id: "svg-file", name: "Frame 163.svg" }],
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ ...scope, knowledgeModuleSourceId: "brief" }),
    );
    await expect(
      detach.execute({
        sourceId: "brief",
        fileId: "svg-file",
        expectedContentHash: "hash",
      }),
    ).resolves.toMatchObject({
      status: "detached",
      remainingFiles: 0,
      indexed: true,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        ...scope,
        knowledgeModuleSourceId: "brief",
        data: { removeFileId: "svg-file", expectedContentHash: "hash" },
      }),
    );
    expect(
      tools.map((tool: any) => tool.definition.function.name),
    ).not.toContain("profile_knowledge_edit");
  });
  it("rejects foreign or other-document Sources and stale versions, and reports analysis failure after a successful unlink", async () => {
    const update = jest
      .spyOn(
        subjectApi,
        "socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate",
      )
      .mockResolvedValue({
        files: [],
        source: { contentHash: "new-hash", indexedContentHash: null },
        processingError: "Embedding unavailable",
        analysisPending: true,
      } as any);
    const detach = capabilities("detach").find(
      (tool: any) =>
        tool.definition.function.name === "profile_knowledge_file_detach",
    );
    await expect(
      detach.execute({
        sourceId: "foreign",
        fileId: "file",
        expectedContentHash: "hash",
      }),
    ).rejects.toThrow("scope");
    await expect(
      detach.execute({
        sourceId: "strategy",
        fileId: "file",
        expectedContentHash: "hash",
      }),
    ).rejects.toThrow("current document");
    await expect(
      detach.execute({
        sourceId: "brief",
        fileId: "file",
        expectedContentHash: "stale",
      }),
    ).rejects.toThrow("contentHash");
    expect(update).not.toHaveBeenCalled();
    await expect(
      detach.execute({
        sourceId: "brief",
        fileId: "file",
        expectedContentHash: "hash",
      }),
    ).resolves.toMatchObject({
      status: "detached",
      indexed: false,
      processingError: "Embedding unavailable",
    });
  });
});
