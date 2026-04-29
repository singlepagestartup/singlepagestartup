/**
 * BDD Suite: OpenRouter thread context selection.
 *
 * Given: a chat has a thread with more messages than one context page.
 * When: OpenRouter context is collected for a reply.
 * Then: every message from the requested thread and chat is eligible for model context.
 */

import { Handler } from "./react-by-openrouter";

interface IFindThreadMessageIdsInChatHandler {
  findThreadMessageIdsInChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }): Promise<string[]>;
}

function createMessageId(index: number) {
  return `message-${String(index).padStart(3, "0")}`;
}

describe("Given: OpenRouter thread context selection", () => {
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
});
