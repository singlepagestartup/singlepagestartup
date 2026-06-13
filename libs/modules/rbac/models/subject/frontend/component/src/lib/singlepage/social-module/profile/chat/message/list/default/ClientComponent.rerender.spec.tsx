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

import { act, fireEvent, screen } from "@testing-library/react";
import {
  mockMessageCreateMutate,
  renderComponent,
  resetChatComponentMocks,
} from "./test-utils";

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

  /**
   * BDD Scenario
   * Given: the chat is rendered with an empty composer.
   * When: the user types multiple keystrokes into the composer textarea.
   * Then: the MessageTimeline component is not re-invoked by keystrokes.
   */
  it("When: typing in the composer Then: the timeline does not rerender", async () => {
    renderComponent("knowledge");
    await settle();

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    const textarea = screen.getByPlaceholderText("Write a message...");
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

    const textarea = screen.getByPlaceholderText("Write a message...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    await settle();

    const shellBaselineRenderCount = sheetRenderSpy.mock.calls.length;

    fireEvent.click(screen.getByLabelText("Send message"));
    await settle();

    expect(mockMessageCreateMutate).toHaveBeenCalled();
    expect(sheetRenderSpy.mock.calls.length).toBe(shellBaselineRenderCount);
  });
});
