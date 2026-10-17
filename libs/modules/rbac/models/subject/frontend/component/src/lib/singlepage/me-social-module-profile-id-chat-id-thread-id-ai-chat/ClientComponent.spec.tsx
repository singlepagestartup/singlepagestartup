import { renderToStaticMarkup } from "react-dom/server";

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

const mockRefetch = jest.fn();
let mockThreads: any;
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: { socialModuleChatFindByIdThreadFind: () => mockThreads },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  clientHost: "",
  getAIChatDocument: () => undefined,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  saturateHeaders: () => ({}),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: () => <div>Private actions</div>,
}));
jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: () => <div>Private messages</div>,
}));

import Component from "./client";
const props = {
  data: { id: "owner" },
  project: {
    profile: { id: "profile" },
    chat: { id: "chat" },
    thread: { id: "thread" },
  },
  loading: <div role="status">Chat skeleton</div>,
} as any;
beforeEach(() => {
  mockRefetch.mockClear();
  mockThreads = { data: [], isPending: false, refetch: mockRefetch };
});
it("renders the supplied loading slot before messages or actions", () => {
  mockThreads.isPending = true;
  const html = renderToStaticMarkup(<Component {...props} />);
  expect(html).toContain("Chat skeleton");
  expect(html).not.toContain("Private messages");
  expect(html).not.toContain("Private actions");
});
it.each([true, false])(
  "supplies the retry action and distinguishes missing threads from load errors (%s)",
  (unavailable) => {
    if (!unavailable) mockThreads.error = new Error("Unavailable");
    const renderLoadError = jest.fn(({ unavailable }) => (
      <div role="alert">{unavailable ? "No access" : "Load failed"}</div>
    ));
    const html = renderToStaticMarkup(
      <Component {...props} renderLoadError={renderLoadError} />,
    );
    expect(html).toContain(unavailable ? "No access" : "Load failed");
    expect(html).not.toContain("Private messages");
    expect(renderLoadError).toHaveBeenCalledWith({
      unavailable,
      retry: expect.any(Function),
    });
    renderLoadError.mock.calls[0][0].retry();
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  },
);
