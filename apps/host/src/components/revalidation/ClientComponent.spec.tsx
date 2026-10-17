/** @jest-environment jsdom */
import { act, render } from "@testing-library/react";
import { Component } from "./ClientComponent";

let mockOnMessage: (event: MessageEvent) => void;
const mockReceive = jest.fn();
const mockState = {
  receive: mockReceive,
  setConnected: jest.fn(),
  subscribe: () => () => {},
  snapshot: () => [],
  check: jest.fn(),
  clear: jest.fn(),
};
jest.mock("@sps/shared-frontend-client-api", () => ({
  queryConsistency: () => mockState,
  queryClient: { invalidateQueries: jest.fn(), resetQueries: jest.fn() },
  consistencyPrincipal: () => "",
}));
jest.mock("@sps/shared-frontend-client-store", () => ({
  globalActionsStore: { getState: () => ({ addAction: jest.fn() }) },
}));
jest.mock("react-use-websocket", () => ({
  __esModule: true,
  ReadyState: { OPEN: 1 },
  default: (_url: string, options: any) => {
    mockOnMessage = options.onMessage;
    return {
      readyState: 1,
      sendJsonMessage: jest.fn(),
      getWebSocket: () => undefined,
    };
  },
}));

it("processes every replay frame even when React batches several messages before a render", () => {
  const view = render(<Component />);
  const frames = ["resync", "invalidate", "ready"].map((type) => ({
    protocol: 1,
    type,
    epoch: "same",
    cursor: "10",
    refs: ["ref"],
  }));
  act(() => {
    for (const frame of frames)
      mockOnMessage(
        new MessageEvent("message", { data: JSON.stringify(frame) }),
      );
  });
  expect(mockReceive.mock.calls.map(([message]) => message.type)).toEqual([
    "resync",
    "invalidate",
    "ready",
  ]);
  view.unmount();
});

it("distinguishes delayed updates on an open socket and retains that status until a healthy heartbeat", () => {
  const view = render(<Component />);
  const receive = (frame: object) =>
    act(() =>
      mockOnMessage(
        new MessageEvent("message", {
          data: JSON.stringify({
            protocol: 1,
            epoch: "test",
            cursor: "0",
            refs: [],
            ...frame,
          }),
        }),
      ),
    );
  receive({ type: "heartbeat", degraded: true });
  expect(
    view.getByText("Updates are delayed. Checking for changes."),
  ).toBeTruthy();
  receive({ type: "invalidate" });
  expect(
    view.getByText("Updates are delayed. Checking for changes."),
  ).toBeTruthy();
  receive({ type: "heartbeat", degraded: false });
  expect(
    view.queryByText("Updates are delayed. Checking for changes."),
  ).toBeNull();
  expect(view.getByText("Connected")).toBeTruthy();
  view.unmount();
});
