/** @jest-environment jsdom */

import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { useMarkThreadRead } from "./use-mark-thread-read";

const mockMutate = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
let emitIntersection: (isVisible: boolean) => void;

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleChatFindByIdThreadMarkRead: () => ({ mutate: mockMutate }),
  },
}));

function Timeline({ latest }: { latest: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  useMarkThreadRead({
    subjectId: "subject",
    socialModuleChatId: "chat",
    socialModuleThreadId: "thread",
    messageId: latest,
    viewportRef,
  });

  return (
    <div ref={viewportRef}>
      <div data-chat-message-id="earlier">Earlier</div>
      <div data-chat-message-id={latest}>Latest</div>
    </div>
  );
}

it("marks a visible latest message once and waits for the tab to become visible", () => {
  const initialObserver = globalThis.IntersectionObserver;
  let visibility: DocumentVisibilityState = "hidden";
  const visibilitySpy = jest
    .spyOn(document, "visibilityState", "get")
    .mockImplementation(() => visibility);
  globalThis.IntersectionObserver = jest.fn().mockImplementation((callback) => {
    emitIntersection = (visible) =>
      callback([
        {
          isIntersecting: visible,
          intersectionRect: { height: visible ? 1 : 0 },
        },
      ]);
    return { observe: mockObserve, disconnect: mockDisconnect };
  });

  try {
    const view = render(<Timeline latest="last" />);
    expect(mockObserve).toHaveBeenCalledWith(view.getByText("Latest"));
    act(() => emitIntersection(false));
    expect(mockMutate).not.toHaveBeenCalled();
    act(() => emitIntersection(true));
    expect(mockMutate).not.toHaveBeenCalled();

    visibility = "visible";
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => emitIntersection(true));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      {
        id: "subject",
        socialModuleChatId: "chat",
        socialModuleThreadId: "thread",
        data: { messageId: "last" },
      },
      expect.any(Object),
    );

    view.rerender(<Timeline latest="newer" />);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledTimes(1);
    act(() => emitIntersection(true));
    expect(mockMutate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { messageId: "newer" } }),
      expect.any(Object),
    );
    view.unmount();
  } finally {
    globalThis.IntersectionObserver = initialObserver;
    visibilitySpy.mockRestore();
  }
});
