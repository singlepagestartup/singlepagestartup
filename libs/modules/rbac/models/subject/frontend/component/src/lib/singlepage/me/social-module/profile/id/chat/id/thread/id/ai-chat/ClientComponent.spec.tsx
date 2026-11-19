import { renderToStaticMarkup } from "react-dom/server";

const mockThreadHasFiles = jest.fn();
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock(
  "../../../../../../../../../social-module/profile/chat/message/list/default/components/ThreadFiles",
  () => ({
    useThreadHasFiles: (...args: unknown[]) => mockThreadHasFiles(...args),
    ThreadFiles: () => <div>Thread files</div>,
  }),
);
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
  Component: (props: any) => (
    <div data-action-language={props.language}>Private actions</div>
  ),
}));
jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: (props: any) => (
    <div data-thread-language={props.language}>
      {props.composer}Private messages{props.context}
    </div>
  ),
}));

import Component from "./client";
const props = {
  data: { id: "owner" },
  project: {
    profile: { id: "profile" },
    chat: { id: "chat" },
    thread: { id: "thread" },
    requesterProfileId: "requester",
  },
  loading: <div role="status">Chat skeleton</div>,
} as any;
beforeEach(() => {
  mockRefetch.mockClear();
  mockThreadHasFiles.mockReset().mockReturnValue(false);
  mockThreads = { data: [], isPending: false, refetch: mockRefetch };
});
it.each(["ru", "en"])(
  "keeps the selected %s locale in the thread and its actions",
  (language) => {
    mockThreads.data = [{ id: "thread", title: "Project thread" }];
    const html = renderToStaticMarkup(
      <Component {...props} language={language} />,
    );
    expect(html).toContain(`data-thread-language="${language}"`);
    expect(html).toContain(`data-action-language="${language}"`);
  },
);
it("renders the supplied loading slot before messages or actions", () => {
  mockThreads.isPending = true;
  const html = renderToStaticMarkup(<Component {...props} />);
  expect(html).toContain("Chat skeleton");
  expect(html).not.toContain("Private messages");
  expect(html).not.toContain("Private actions");
});
it("shows files for the selected project thread when its scoped query has attachments", () => {
  mockThreads.data = [
    { id: "thread", title: "First thread" },
    { id: "selected", title: "Selected thread" },
  ];
  const selected = <Component {...props} socialModuleThreadId="selected" />;
  expect(renderToStaticMarkup(selected)).not.toContain("Thread files");

  mockThreadHasFiles.mockReturnValue(true);
  expect(renderToStaticMarkup(selected)).toContain("Thread files");
  expect(mockThreadHasFiles).toHaveBeenLastCalledWith(
    {
      subjectId: "owner",
      socialModuleProfileId: "requester",
      socialModuleChatId: "chat",
      socialModuleThreadId: "selected",
    },
    false,
    true,
  );
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
