/** @jest-environment jsdom */

import { render, renderHook, screen } from "@testing-library/react";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { ThreadContext } from "./ThreadContext";
import { useThreadHasFiles } from "./ThreadFiles";

const mockThreadMessages = jest.fn();
const mockKnowledgeSources = jest.fn();

jest.mock("../hooks/use-thread-messages", () => ({
  useThreadMessages: (...args: unknown[]) => mockThreadMessages(...args),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind: (
      ...args: unknown[]
    ) => mockKnowledgeSources(...args),
  },
}));
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: ({ data, layout }: { data: { id: string }; layout: string }) => (
    <p data-layout={layout}>{data.id}</p>
  ),
}));
jest.mock("./ThreadCustomerWork", () => ({
  ThreadCustomerWork: () => <p>Customer work controls</p>,
}));

const scope = {
  subjectId: "buyer",
  socialModuleProfileId: "profile",
  socialModuleChatId: "chat",
  socialModuleThreadId: "thread",
  language: "en",
  resultSectionRef: null,
  onVersionSelect: jest.fn(),
};

it("shows each scoped file once and only knowledge linked to the selected document", () => {
  mockThreadMessages.mockReturnValue({
    data: [
      { id: "first-message", attachments: [{ id: "Design input" }] },
      { id: "second-message", attachments: [{ id: "Design input" }] },
    ],
  });
  mockKnowledgeSources.mockReturnValue({
    data: [
      { id: "allowed", title: "Design requirements", content: "Palette" },
      { id: "other", title: "Unrelated knowledge", content: "Other project" },
    ],
  });
  const thread = {
    id: scope.socialModuleThreadId,
    metadata: {
      aiChatDocument: {
        key: "design",
        profileId: "document-owner",
        sourceIds: ["allowed"],
      },
    },
  } as ISocialModuleThread;

  render(
    <ThreadContext
      {...scope}
      isCustomerWork={false}
      socialModuleThread={thread}
    />,
  );

  expect(screen.getAllByText("Design input")).toHaveLength(1);
  expect(screen.getByText("Design input").getAttribute("data-layout")).toBe(
    "row",
  );
  expect(screen.getByText("Design requirements")).toBeTruthy();
  expect(screen.queryByText("Unrelated knowledge")).toBeNull();
  expect(mockKnowledgeSources).toHaveBeenCalledWith({
    id: "buyer",
    socialModuleProfileId: "profile",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "document-owner",
  });
});

it("omits the Files heading when the selected discussion has no attachments", () => {
  mockThreadMessages.mockReturnValue({ data: [{ id: "message" }] });
  const thread = { id: scope.socialModuleThreadId } as ISocialModuleThread;

  render(
    <ThreadContext
      {...scope}
      isCustomerWork={false}
      socialModuleThread={thread}
    />,
  );

  expect(screen.queryByRole("heading", { name: "Files" })).toBeNull();
});

it("opens file context only for attachments visible in that discussion", () => {
  const workMessage = {
    variant: "customer-work",
    attachments: [{ id: "file" }],
  };
  const regularMessage = { variant: "default", attachments: [{ id: "file" }] };
  const privateMessage = {
    ...workMessage,
    privateAttachments: [{ id: "private-file", name: "Brief.pdf" }],
  };
  let messages = [workMessage];
  let isError = false;
  mockThreadMessages.mockImplementation((_scope, _interval, options) => ({
    data: options.select(messages),
    isError,
  }));
  const { result, rerender } = renderHook(
    ({ isCustomerWork }) => useThreadHasFiles(scope, isCustomerWork),
    { initialProps: { isCustomerWork: false } },
  );

  expect(result.current).toBe(false);
  messages = [regularMessage];
  rerender({ isCustomerWork: false });
  expect(result.current).toBe(true);
  rerender({ isCustomerWork: true });
  expect(result.current).toBe(false);
  messages = [privateMessage];
  rerender({ isCustomerWork: true });
  expect(result.current).toBe(true);
  isError = true;
  rerender({ isCustomerWork: true });
  expect(result.current).toBe(false);
});

it("keeps work attachments on the signed-in buyer's download path", () => {
  mockThreadMessages.mockReturnValue({
    data: [
      {
        id: "work-message",
        variant: "customer-work",
        attachments: [{ id: "Public file record" }],
        privateAttachments: [{ id: "private-file", name: "Private brief.pdf" }],
      },
    ],
  });
  const thread = { id: scope.socialModuleThreadId } as ISocialModuleThread;

  const { container } = render(
    <ThreadContext {...scope} isCustomerWork socialModuleThread={thread} />,
  );

  expect(screen.getByText("Customer work controls")).toBeTruthy();
  expect(screen.queryByText("Public file record")).toBeNull();
  expect(container.querySelector("a, iframe, object, embed, img")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Download Private brief.pdf" }),
  ).toBeTruthy();
});
