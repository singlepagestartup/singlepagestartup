/** @jest-environment jsdom */
/**
 * BDD Suite: Document Source loading and draft lifetime.
 * Given: a project document and an asynchronous scoped Source read.
 * When: data loads, retries or changes while a draft is being edited.
 * Then: initial drafts start only after loading and remain until attached.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const create = jest.fn();
const updateSource = jest.fn();
const updateThread = jest.fn();
const uploadFiles = jest.fn();
const refetch = jest.fn();
let sourceRead: any = { data: [] };
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind:
      () => sourceRead,
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceCreate:
      () => ({ mutateAsync: create }),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdUpdate:
      () => ({ mutateAsync: updateSource }),
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFindByIdFilesUpdate:
      () => ({ mutateAsync: uploadFiles }),
    socialModuleChatFindByIdThreadUpdate: () => ({ mutateAsync: updateThread }),
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) =>
    props.variant ===
    "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat"
      ? jest.requireActual("./client").default(props)
      : null,
}));
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/knowledge/models/source/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: { findById: () => ({ data: undefined, isLoading: false }) },
}));
jest.mock("@sps/knowledge/models/source/sdk/server", () => ({ api: {} }));
import { Component } from "@sps/rbac/models/subject/frontend/component";
beforeEach(() => {
  sourceRead = { data: [] };
  refetch.mockReset();
  create.mockReset();
  updateSource.mockReset();
  updateThread.mockReset();
  uploadFiles.mockReset();
});

const loadingProps: any = {
  isServer: false,
  variant:
    "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
  data: { id: "subject" },
  project: {
    requesterProfileId: "requester-profile",
    profile: { id: "connected-profile" },
    chat: { id: "chat" },
  },
  thread: {
    id: "thread",
    title: "Products.md",
    metadata: {
      aiChatDocument: {
        key: "products",
        profileId: "connected-profile",
        sourceIds: ["saved-source"],
      },
    },
  },
  onDiscuss: jest.fn(),
};
it("waits for a successful Source read before creating an empty-document draft", () => {
  sourceRead = { data: undefined, isPending: true };
  const view = render(<Component {...loadingProps} />);
  expect(screen.getByRole("status").textContent).toContain(
    "Loading knowledge sections",
  );
  expect(
    screen.queryByRole("textbox", { name: "Products content" }),
  ).toBeNull();
  sourceRead = { data: [{ id: "saved-source" }] };
  view.rerender(<Component {...loadingProps} />);
  expect(
    screen.queryByRole("textbox", { name: "Products content" }),
  ).toBeNull();
});
it("offers a retry without creating a draft after a failed initial Source read", () => {
  sourceRead = { data: undefined, error: new Error("Read failed"), refetch };
  render(<Component {...loadingProps} />);
  expect(screen.getByRole("alert").textContent).toContain("Read failed");
  expect(
    screen.queryByRole("textbox", { name: "Products content" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});
it("keeps draft text and selected files when a saved Source appears during editing", async () => {
  const view = render(<Component {...loadingProps} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Products content" }), {
    target: { value: "Unsaved draft" },
  });
  fireEvent.change(screen.getByLabelText("Upload files for Products"), {
    target: {
      files: [new File(["facts"], "draft.txt", { type: "text/plain" })],
    },
  });
  await screen.findByText("draft.txt");
  sourceRead = { data: [{ id: "saved-source" }], isFetching: true };
  view.rerender(<Component {...loadingProps} />);
  expect(
    (
      screen.getByRole("textbox", {
        name: "Products content",
      }) as HTMLInputElement
    ).value,
  ).toBe("Unsaved draft");
  expect(screen.getByText("draft.txt")).toBeTruthy();
});
it("retries attachment without duplicating the already saved Knowledge source", async () => {
  create.mockResolvedValue({
    id: "saved-source",
    title: "Products",
    content: "Test document",
  });
  updateThread
    .mockRejectedValueOnce(new Error("Temporary attachment failure"))
    .mockResolvedValue({
      metadata: {
        aiChatDocument: {
          key: "products",
          profileId: "connected-profile",
          sourceIds: ["saved-source"],
        },
      },
    });
  const props: any = {
    isServer: false,
    variant:
      "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
    data: { id: "subject" },
    project: {
      requesterProfileId: "requester-profile",
      profile: { id: "connected-profile" },
      chat: { id: "chat" },
    },
    thread: {
      id: "thread",
      title: "Products.md",
      metadata: {
        aiChatDocument: {
          key: "products",
          profileId: "connected-profile",
          sourceIds: [],
        },
      },
    },
    onDiscuss: jest.fn(),
  };
  render(<Component {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Products content" }), {
    target: { value: "Test document" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await screen.findByText(/Knowledge was saved, but could not be attached/);
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await waitFor(() => expect(updateThread).toHaveBeenCalledTimes(2));
  expect(create).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "subject",
      socialModuleProfileId: "requester-profile",
      targetSocialModuleProfileId: "connected-profile",
    }),
  );
  expect(updateSource).not.toHaveBeenCalled();
  expect(updateThread.mock.calls[1][0]).toEqual(
    expect.objectContaining({
      id: "subject",
      socialModuleChatId: "chat",
      socialModuleThreadId: "thread",
      data: {
        document: {
          key: "products",
          profileId: "connected-profile",
          sourceIds: ["saved-source"],
        },
      },
    }),
  );
});

it("uploads selected files to the saved Source before attaching it and never duplicates uploads on a link retry", async () => {
  create.mockResolvedValue({
    id: "saved-source",
    title: "Products",
    content: "Test document",
  });
  uploadFiles.mockResolvedValue({});
  updateThread
    .mockRejectedValueOnce(new Error("Temporary attachment failure"))
    .mockResolvedValue({
      metadata: {
        aiChatDocument: {
          key: "products",
          profileId: "connected-profile",
          sourceIds: ["saved-source"],
        },
      },
    });
  render(
    <Component
      {...({
        isServer: false,
        variant:
          "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat",
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester-profile",
          profile: { id: "connected-profile" },
          chat: { id: "chat" },
        },
        thread: {
          id: "thread",
          title: "Products.md",
          metadata: {
            aiChatDocument: {
              key: "products",
              profileId: "connected-profile",
              sourceIds: [],
            },
          },
        },
        onDiscuss: jest.fn(),
      } as any)}
    />,
  );
  const file = new File(["Workshop facts"], "workshop.txt", {
    type: "text/plain",
  });
  fireEvent.change(screen.getByLabelText("Upload files for Products"), {
    target: { files: [file] },
  });
  await screen.findByText("workshop.txt");
  fireEvent.change(screen.getByRole("textbox", { name: "Products content" }), {
    target: { value: "Test document" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await screen.findByText(/Knowledge was saved, but could not be attached/);
  expect(uploadFiles).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "subject",
      socialModuleProfileId: "requester-profile",
      targetSocialModuleProfileId: "connected-profile",
      socialModuleChatId: "chat",
      knowledgeModuleSourceId: "saved-source",
      data: { files: [file] },
    }),
  );
  expect(create.mock.invocationCallOrder[0]).toBeLessThan(
    uploadFiles.mock.invocationCallOrder[0],
  );
  expect(uploadFiles.mock.invocationCallOrder[0]).toBeLessThan(
    updateThread.mock.invocationCallOrder[0],
  );
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await waitFor(() => expect(updateThread).toHaveBeenCalledTimes(2));
  expect(create).toHaveBeenCalledTimes(1);
  expect(uploadFiles).toHaveBeenCalledTimes(1);
});

it("retains the first saved section when a second is attached before Thread props refetch", async () => {
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: () => "second-draft",
  });
  create
    .mockResolvedValueOnce({ id: "first", title: "Products", content: "First" })
    .mockResolvedValueOnce({
      id: "second",
      title: "Details",
      content: "Second",
    });
  updateThread.mockImplementation(async ({ data }) => ({
    metadata: { aiChatDocument: data.document },
  }));
  render(<Component {...loadingProps} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Products content" }), {
    target: { value: "First" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Save knowledge" })).toBeNull(),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Add knowledge section" }),
  );
  fireEvent.change(
    screen.getByRole("textbox", { name: "Knowledge section title" }),
    {
      target: { value: "Details" },
    },
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Details content" }), {
    target: { value: "Second" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save knowledge" }));
  await waitFor(() => expect(updateThread).toHaveBeenCalledTimes(2));
  expect(updateThread.mock.calls[1][0].data.document.sourceIds).toEqual([
    "saved-source",
    "first",
    "second",
  ]);
});
