/**
 * BDD Suite: OpenRouter thread context and reply validation.
 *
 * Given: a chat has a thread with more messages than one context page.
 * When: OpenRouter context is collected and generated replies are validated.
 * Then: every eligible context message is considered and invalid empty text replies are rejected.
 */

jest.mock("@sps/backend-utils", () => {
  return {
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

import { Handler } from "./react-by-openrouter";
import { blobifyFiles } from "@sps/backend-utils";

interface IFindThreadMessageIdsInChatHandler {
  findThreadMessageIdsInChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }): Promise<string[]>;
}

interface IOpenRouterReplyValidationHandler {
  buildNoValidModelResponseMessage(fallbackReasons: string[]): string;
  generateFinalOpenRouterReply(props: {
    billingLedger: any[];
    openRouter: {
      generate: jest.Mock;
    };
    modelSelection: {
      orderedCandidateIds: string[];
      selectedModelId: string | null;
      selectedBy: "llm" | "priority";
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
}

function createMessageId(index: number) {
  return `message-${String(index).padStart(3, "0")}`;
}

describe("Given: OpenRouter thread context and reply validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        stripNonTextOnRetry: true,
      }),
    );
    expect(openRouter.generate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: "anthropic/claude-haiku-4.5",
        stripNonTextOnRetry: true,
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
   * Then: no assistant reply source is returned and the terminal error message contains both failure reasons.
   */
  it("When: primary and fallback text are invalid Then: terminal failure keeps both reasons", async () => {
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
      "No valid model response received. model=openai/gpt-5.2: expected text output, but model returned empty text | model=anthropic/claude-haiku-4.5: expected text output, but model returned empty text",
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
});
