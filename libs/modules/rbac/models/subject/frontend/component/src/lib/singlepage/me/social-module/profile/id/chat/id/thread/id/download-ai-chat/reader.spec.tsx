/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import type { IComponentProps } from "./interface";

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@paralleldrive/cuid2", () => ({ createId: () => "request" }));

const subject = { id: "owner", slug: "owner" };
const mockSourceRead = jest.fn();
const mockDirectThreadRead = jest.fn(() => ({
  data: undefined,
  isLoading: false,
  error: new Error(
    "Permission error: direct Social Thread reads are forbidden",
  ),
}));
const mockThreadProvider = jest.fn(({ children }: any) => children);
const mockUpdateCookies = jest.fn();

jest.mock("react-cookie", () => ({
  useCookies: () => [
    { "rbac.subject.jwt": "owner-jwt" },
    undefined,
    undefined,
    mockUpdateCookies,
  ],
}));
jest.mock("react-jwt", () => ({
  useJwt: () => ({ decodedToken: { subject } }),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {
    findById: () => ({ data: subject, isLoading: false }),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind: (
      props: unknown,
    ) => mockSourceRead(props),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({ api: {} }));
jest.mock("@sps/social/models/thread/sdk/client", () => ({
  Provider: (props: any) => mockThreadProvider(props),
  api: { findById: () => mockDirectThreadRead() },
}));
jest.mock("@sps/social/models/thread/sdk/server", () => ({ api: {} }));
jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: jest.requireActual(
    "../../../../../../../../../../../../../../../../../social/models/thread/frontend/component/src/lib/singlepage/download-ai-chat",
  ).Component,
}));
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));

import { Component } from "./index";

const props = {
  isServer: false,
  language: "en",
  variant: "me-social-module-profile-id-chat-id-thread-id-download-ai-chat",
  data: subject,
  project: {
    requesterProfileId: "requester",
    profile: { id: "assistant" },
    chat: { id: "chat" },
  },
  thread: {
    id: "thread",
    title: "Brief.md",
    metadata: {
      aiChatDocument: {
        key: "brief",
        profileId: "assistant",
        sourceIds: ["source"],
      },
    },
  },
} as unknown as IComponentProps;

function sourceResult(content: string) {
  return {
    data: [{ id: "source", title: "Context", content }],
    isPending: false,
    refetch: jest.fn(),
  };
}

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSourceRead.mockReturnValue(sourceResult("Before"));
});

it("exports current scoped Sources using the already authorized Thread without a direct Social read", async () => {
  const createObjectURL = jest.fn(
    (_object: Blob | MediaSource) => "blob:export",
  );
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURL;
  URL.revokeObjectURL = jest.fn();
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});

  try {
    const view = render(<Component {...props} />);
    expect(mockDirectThreadRead).not.toHaveBeenCalled();
    expect(mockThreadProvider).not.toHaveBeenCalled();
    expect(mockSourceRead).toHaveBeenCalledWith({
      options: undefined,
      id: "owner",
      socialModuleProfileId: "requester",
      socialModuleChatId: "chat",
      targetSocialModuleProfileId: "assistant",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Download current Thread as Markdown",
      }),
    );
    expect(await readBlob(createObjectURL.mock.calls[0][0] as Blob)).toBe(
      "# Brief.md\n\n## Context\n\nBefore",
    );
    expect(click.mock.instances[0].download).toBe("Brief.md");

    mockSourceRead.mockReturnValue(sourceResult("After"));
    view.rerender(<Component {...props} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "Download current Thread as Markdown",
      }),
    );
    expect(await readBlob(createObjectURL.mock.calls[1][0] as Blob)).toBe(
      "# Brief.md\n\n## Context\n\nAfter",
    );
    expect(mockDirectThreadRead).not.toHaveBeenCalled();
    expect(mockThreadProvider).not.toHaveBeenCalled();
  } finally {
    click.mockRestore();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

it("keeps download disabled when the scoped Source read is denied, without a direct fallback", () => {
  mockSourceRead.mockReturnValue({
    isPending: false,
    error: new Error("Permission error: scoped Sources are unavailable"),
    refetch: jest.fn(),
  });
  render(<Component {...props} />);
  expect(mockDirectThreadRead).not.toHaveBeenCalled();
  expect(
    (
      screen.getByRole("button", {
        name: "Download current Thread as Markdown",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
});
