/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { ThreadContext } from "./ThreadContext";

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
  Component: ({ data }: { data: { id: string } }) => <p>{data.id}</p>,
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
  expect(screen.getByText("Design requirements")).toBeTruthy();
  expect(screen.queryByText("Unrelated knowledge")).toBeNull();
  expect(mockKnowledgeSources).toHaveBeenCalledWith({
    id: "buyer",
    socialModuleProfileId: "profile",
    socialModuleChatId: "chat",
    targetSocialModuleProfileId: "document-owner",
  });
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
