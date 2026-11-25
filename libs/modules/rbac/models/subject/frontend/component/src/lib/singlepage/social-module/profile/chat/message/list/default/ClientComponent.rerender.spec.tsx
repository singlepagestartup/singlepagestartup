/**
 * @jest-environment jsdom
 *
 * BDD Suite: Chat composer rerender isolation.
 *
 * Given: the chat client component renders a message timeline and a composer.
 * When: the user types into the composer textarea.
 * Then: the message timeline does not rerender - reactive description state is
 *       scoped to the composer boundary (issue #195).
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

jest.mock("./components/ProfileSidebarSheet", () => {
  const renderSpy = jest.fn();

  return {
    __sheetRenderSpy: renderSpy,
    ProfileSidebarSheet: (props: { children?: unknown }) => {
      renderSpy(props);
      return null;
    },
  };
});

import { useSyncExternalStore } from "react";
import { act, fireEvent, screen } from "@testing-library/react";
import {
  mockChatComponentState,
  mockMessageCreateMutate,
  renderComponent,
  resetChatComponentMocks,
} from "./test-utils";

const { api } = jest.requireMock("@sps/rbac/models/subject/sdk/client");
const { __timelineRenderSpy: timelineRenderSpy } = jest.requireMock(
  "./components/MessageTimeline",
) as { __timelineRenderSpy: jest.Mock };
const { __sheetRenderSpy: sheetRenderSpy } = jest.requireMock(
  "./components/ProfileSidebarSheet",
) as { __sheetRenderSpy: jest.Mock };

/**
 * Flushes pending async work (query mock resolutions, effects) so that
 * renders caused by mounting do not leak into keystroke assertions.
 */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("Given: chat composer rerender isolation", () => {
  beforeEach(() => {
    resetChatComponentMocks();
    timelineRenderSpy.mockClear();
  });

  it("keeps the focused draft and caret when peer typing starts and stops", async () => {
    let notify = () => {};
    const subscribe = (listener: () => void) => {
      notify = listener;
      return () => {};
    };
    const query =
      api.socialModuleProfileFindByIdChatFindByIdActionFind as jest.Mock;
    const original = query.getMockImplementation();
    query.mockImplementation(() => ({
      data: useSyncExternalStore(
        subscribe,
        () => mockChatComponentState.socialModuleActions,
      ),
    }));
    try {
      renderComponent("default");
      await settle();
      const textbox = screen.getByRole("textbox", {
        name: "Message",
      }) as HTMLTextAreaElement;
      textbox.focus();
      fireEvent.change(textbox, { target: { value: "My unfinished draft" } });
      textbox.setSelectionRange(4, 7);
      const actor = (id: string) => ({
        id,
        variant: "typing",
        actorProfileIds: [id],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 8000),
      });
      for (const ids of [["profile-1", "peer"], []]) {
        act(() => {
          mockChatComponentState.socialModuleActions = ids.map(actor);
          notify();
        });
        const displayed = timelineRenderSpy.mock.lastCall?.[0].items;
        expect(
          displayed.map((item: { data: { id: string } }) => item.data.id),
        ).toEqual(ids.filter((id) => id !== "profile-1"));
        expect(screen.getByRole("textbox", { name: "Message" })).toBe(textbox);
        expect(document.activeElement).toBe(textbox);
        expect([
          textbox.value,
          textbox.selectionStart,
          textbox.selectionEnd,
        ]).toEqual(["My unfinished draft", 4, 7]);
      }
      fireEvent.blur(textbox);
      await settle();
      const pulses = (
        api.socialModuleChatFindByIdThreadTyping as jest.Mock
      ).mock.calls.map(([props]) => props.data);
      expect(pulses).toEqual([
        { sessionId: expect.any(String), active: true },
        { sessionId: pulses[0].sessionId, active: false },
      ]);
    } finally {
      if (original) query.mockImplementation(original);
    }
  });

  it("stops sending typing after an idle pause and expires a disconnected peer", async () => {
    jest.useFakeTimers();
    try {
      const peer = {
        type: "action" as const,
        data: {
          id: "peer",
          variant: "typing",
          actorProfileIds: ["peer"],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 8000),
        },
      };
      const { unmount } = renderComponent("default", {
        socialModuleMessagesAndActionsQuery: [peer],
      });
      const textbox = screen.getByRole("textbox", { name: "Message" });
      fireEvent.change(textbox, { target: { value: "t" } });
      await act(async () => {
        await jest.advanceTimersByTimeAsync(100);
      });
      fireEvent.change(textbox, { target: { value: "typing" } });
      const pulses = api.socialModuleChatFindByIdThreadTyping as jest.Mock;
      expect(pulses).toHaveBeenCalledTimes(1);
      expect(timelineRenderSpy.mock.lastCall?.[0].items).toHaveLength(1);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2500);
      });
      expect(pulses.mock.calls.map(([request]) => request.data.active)).toEqual(
        [true, false],
      );
      await act(async () => {
        await jest.advanceTimersByTimeAsync(5500);
      });
      expect(timelineRenderSpy.mock.lastCall?.[0].items).toEqual([]);
      expect((textbox as HTMLTextAreaElement).value).toBe("typing");
      unmount();
    } finally {
      jest.useRealTimers();
    }
  });

  /**
   * BDD Scenario
   * Given: the chat is rendered with an empty composer.
   * When: the user types multiple keystrokes into the composer textarea.
   * Then: the MessageTimeline component is not re-invoked by keystrokes.
   */
  it("When: typing in the composer Then: the timeline does not rerender", async () => {
    renderComponent("knowledge");
    await settle();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    const baselineRenderCount = timelineRenderSpy.mock.calls.length;

    fireEvent.change(textarea, { target: { value: "h" } });
    fireEvent.change(textarea, { target: { value: "he" } });
    fireEvent.change(textarea, { target: { value: "hello" } });

    expect(timelineRenderSpy.mock.calls.length).toBe(baselineRenderCount);
  });

  /**
   * BDD Scenario
   * Given: the chat is rendered.
   * When: the user opens mention/command pickers by typing trigger characters.
   * Then: picker state stays inside the composer and the timeline still does
   *       not rerender.
   */
  it("When: opening pickers via @ and / Then: the timeline does not rerender", async () => {
    renderComponent("knowledge");
    await settle();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    const baselineRenderCount = timelineRenderSpy.mock.calls.length;

    fireEvent.change(textarea, { target: { value: "/" } });
    expect(screen.getByText("Learn")).toBeTruthy();

    fireEvent.change(textarea, { target: { value: "@kn" } });
    expect(screen.getByText("Knowledge")).toBeTruthy();

    expect(timelineRenderSpy.mock.calls.length).toBe(baselineRenderCount);
  });

  /**
   * BDD Scenario
   * Given: a chat with messages is rendered.
   * When: the user deletes one message.
   * Then: only that message id is marked as deleting - the timeline receives a
   *       scoped deletingMessageId instead of a global boolean.
   */
  it("When: deleting one message Then: only that message id is marked as deleting", async () => {
    renderComponent("knowledge", {
      socialModuleMessagesAndActionsQuery: [
        {
          type: "message",
          data: {
            id: "message-1",
            description: "First",
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
          },
        },
        {
          type: "message",
          data: {
            id: "message-2",
            description: "Second",
            createdAt: new Date("2026-01-01T10:01:00.000Z"),
          },
        },
      ],
    });
    await settle();

    const baselineProps = timelineRenderSpy.mock.calls.at(-1)?.[0] as {
      deletingMessageId: string | null;
      onMessageDelete: (message: { id: string }) => void;
    };
    expect(baselineProps.deletingMessageId).toBeNull();

    await act(async () => {
      baselineProps.onMessageDelete({ id: "message-1" });
    });

    const nextProps = timelineRenderSpy.mock.calls.at(-1)?.[0] as {
      deletingMessageId: string | null;
    };
    expect(nextProps.deletingMessageId).toBe("message-1");
  });

  /**
   * BDD Scenario
   * Given: the chat shell, composer, and timeline boundaries are mounted.
   * When: the user sends a regular message and creation succeeds.
   * Then: the chat shell does not rerender — composer mutation state and the
   *       cache append are contained inside their own boundaries
   *       (issue #195 acceptance criterion).
   */
  it("When: sending a message Then: the chat shell does not rerender", async () => {
    mockMessageCreateMutate.mockImplementation((_payload, options) => {
      options?.onSuccess?.({
        id: "message-created-1",
        description: "Hello",
      });
    });

    renderComponent("default");
    await settle();

    const textarea = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(textarea, { target: { value: "Hello" } });
    await settle();

    const shellBaselineRenderCount = sheetRenderSpy.mock.calls.length;

    fireEvent.click(screen.getByLabelText("Send message"));
    await settle();

    expect(mockMessageCreateMutate).toHaveBeenCalled();
    expect(sheetRenderSpy.mock.calls.length).toBe(shellBaselineRenderCount);
  });
});
