/**
 * @jest-environment jsdom
 *
 * BDD Suite: Chat targeted cache patching.
 *
 * Given: chat message mutations succeed or fail against the mocked SDK.
 * When: create/update/delete success and error paths run.
 * Then: the thread messages cache is patched in place (append/patch/remove)
 *       instead of full invalidation; server-created AI data arrives through
 *       WebSocket invalidation rather than a frontend reaction refetch.
 */

jest.mock("./components/MessageTimeline", () => {
  const renderSpy = jest.fn();

  return {
    __timelineRenderSpy: renderSpy,
    MessageTimeline: (props: unknown) => {
      renderSpy(props);
      return null;
    },
  };
});

import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import {
  mockMessageCreateMutate,
  mockMessageDeleteMutate,
  mockMessageUpdateMutate,
  mockSharedApiQueryClient,
  renderComponent,
  resetChatComponentMocks,
} from "./test-utils";
import { getTimelineSignature } from "./utils";

const { __timelineRenderSpy: timelineRenderSpy } = jest.requireMock(
  "./components/MessageTimeline",
) as { __timelineRenderSpy: jest.Mock };

const threadMessagesUrl =
  "/api/rbac/subjects/subject-1/social-module/profiles/profile-1/chats/chat-1/threads/thread-1/messages";

interface TimelineMockProps {
  onMessageDelete: (message: { id: string }) => void;
  onMessageEdit: (message: { id: string; description?: string }) => void;
}

function getTimelineProps(): TimelineMockProps {
  return timelineRenderSpy.mock.calls.at(-1)?.[0] as TimelineMockProps;
}

interface CachedMessage {
  id: string;
  description?: string;
}

/**
 * Seeds the REAL shared QueryClient with the thread-message list query so the
 * cache helpers (append/patch/remove) run their updater bodies against actual
 * cached data (issue #195) — not the previous tautological mock that always
 * returned an empty cache.
 */
function seedThreadMessages(messages: CachedMessage[]) {
  mockSharedApiQueryClient.setQueryData([threadMessagesUrl], messages);
  mockSharedApiQueryClient.setQueryData.mockClear();
}

function getCachedThreadMessages(): CachedMessage[] | undefined {
  return mockSharedApiQueryClient.getQueryData([threadMessagesUrl]) as
    | CachedMessage[]
    | undefined;
}

async function sendMessage(text: string) {
  const textarea = screen.getByPlaceholderText("Write a message...");
  fireEvent.change(textarea, { target: { value: text } });
  fireEvent.click(screen.getByLabelText("Send message"));
}

describe("Given: chat targeted cache patching", () => {
  beforeEach(() => {
    resetChatComponentMocks();
    timelineRenderSpy.mockClear();
    mockSharedApiQueryClient.invalidateQueries.mockClear();
    mockSharedApiQueryClient.setQueryData.mockClear();
    mockSharedApiQueryClient.getQueryCache.mockClear();
  });

  /**
   * BDD Scenario
   * Given: a default chat (no AI flow) whose thread cache already holds one
   *        message.
   * When: message creation succeeds.
   * Then: the created message is appended to the cached array in place -
   *       without a full invalidation.
   */
  it("When: create succeeds Then: the created message is appended to the cache", async () => {
    seedThreadMessages([{ id: "message-1", description: "First" }]);
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-created-1",
        description: "Hello",
      });
    });

    renderComponent("default");
    await sendMessage("Hello");

    await waitFor(() => {
      expect(getCachedThreadMessages()).toEqual([
        { id: "message-1", description: "First" },
        { id: "message-created-1", description: "Hello" },
      ]);
    });
    expect(mockSharedApiQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a Knowledge chat with an AI assistant.
   * When: the one create-message mutation succeeds.
   * Then: the user message is appended and no frontend reaction refetch runs;
   *       WebSocket invalidation owns server-created actions and replies.
   */
  it("When: AI message create succeeds Then: no frontend reaction refetch runs", async () => {
    seedThreadMessages([]);
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-created-1",
        description: "Question",
      });
    });

    renderComponent("knowledge");
    await sendMessage("Question");

    await waitFor(() => {
      expect(getCachedThreadMessages()).toEqual([
        { id: "message-created-1", description: "Question" },
      ]);
    });
    expect(mockSharedApiQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a chat whose thread cache holds two messages.
   * When: deleting one message succeeds.
   * Then: only that message is removed from the cached array (targeted cache
   *       walk) and the other remains - without a full invalidation.
   */
  it("When: delete succeeds Then: only that message is removed from the cache", async () => {
    seedThreadMessages([
      { id: "message-1", description: "First" },
      { id: "message-2", description: "Second" },
    ]);
    mockMessageDeleteMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({ id: "message-1" });
    });

    renderComponent("default", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "First",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    await act(async () => {
      getTimelineProps().onMessageDelete({ id: "message-1" });
    });

    expect(getCachedThreadMessages()).toEqual([
      { id: "message-2", description: "Second" },
    ]);
    expect(mockSharedApiQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a chat whose thread cache holds one message.
   * When: deleting the message fails.
   * Then: the cached array is left untouched and the thread messages query is
   *       refetched to restore server truth.
   */
  it("When: delete fails Then: the cache is untouched and the thread is refetched", async () => {
    seedThreadMessages([{ id: "message-1", description: "First" }]);
    mockMessageDeleteMutate.mockImplementation((_payload, options) => {
      options?.onError?.(new Error("Delete failed"));
    });

    renderComponent("default", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "First",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    await act(async () => {
      getTimelineProps().onMessageDelete({ id: "message-1" });
    });

    expect(getCachedThreadMessages()).toEqual([
      { id: "message-1", description: "First" },
    ]);
    expect(mockSharedApiQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [threadMessagesUrl],
    });
  });

  /**
   * BDD Scenario
   * Given: the thread cache holds two messages and the edit dialog is open for
   *        the first.
   * When: the update succeeds and the SDK returns the updated message array.
   * Then: only that message is patched in place in the cached array (the other
   *       message keeps its content) without a full invalidation.
   */
  it("When: update succeeds Then: only that message is patched in the cache", async () => {
    seedThreadMessages([
      { id: "message-1", description: "Original" },
      { id: "message-2", description: "Second" },
    ]);
    mockMessageUpdateMutate.mockImplementation((payload, options) => {
      options?.onSuccess?.([
        {
          id: payload.socialModuleMessageId,
          description: payload.data.description,
        },
      ]);
    });

    renderComponent("default", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "Original",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
      ],
    });

    // The edit form is seeded from the message passed to onMessageEdit; the new
    // description drives the update payload (the mocked MDEditor is not
    // controllable), so it is supplied here.
    await act(async () => {
      getTimelineProps().onMessageEdit({
        id: "message-1",
        description: "Edited",
      });
    });

    expect(screen.getByText("Edit Message")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(getCachedThreadMessages()).toEqual([
        { id: "message-1", description: "Edited" },
        { id: "message-2", description: "Second" },
      ]);
    });
    expect(mockSharedApiQueryClient.invalidateQueries).not.toHaveBeenCalled();
  });
});

describe("Given: timeline scroll signature", () => {
  /**
   * BDD Scenario
   * Given: a timeline where the last message was edited (updatedAt changed).
   * When: the timeline signature is recomputed.
   * Then: the signature stays the same - editing must not trigger
   *       scroll-to-bottom.
   */
  it("When: only updatedAt changes Then: the signature is unchanged", () => {
    const baseItem = {
      type: "message" as const,
      data: {
        id: "message-1",
        description: "Original",
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
        updatedAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    };
    const editedItem = {
      ...baseItem,
      data: {
        ...baseItem.data,
        description: "Edited",
        updatedAt: new Date("2026-01-01T11:00:00.000Z"),
      },
    };

    const before = getTimelineSignature("thread-1", [baseItem as any]);
    const after = getTimelineSignature("thread-1", [editedItem as any]);

    expect(after).toBe(before);
  });

  /**
   * BDD Scenario
   * Given: a timeline that gains a new message.
   * When: the timeline signature is recomputed.
   * Then: the signature changes - new messages still scroll to bottom.
   */
  it("When: a new message arrives Then: the signature changes", () => {
    const firstItem = {
      type: "message" as const,
      data: {
        id: "message-1",
        description: "First",
        createdAt: new Date("2026-01-01T10:00:00.000Z"),
      },
    };
    const secondItem = {
      type: "message" as const,
      data: {
        id: "message-2",
        description: "Second",
        createdAt: new Date("2026-01-01T10:01:00.000Z"),
      },
    };

    const before = getTimelineSignature("thread-1", [firstItem as any]);
    const after = getTimelineSignature("thread-1", [
      firstItem as any,
      secondItem as any,
    ]);

    expect(after).not.toBe(before);
  });
});
