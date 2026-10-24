/** @jest-environment jsdom */
/**
 * BDD Suite: Document Source loading and draft lifetime.
 * Given: a project document and an asynchronous scoped Source read.
 * When: data loads, retries or changes while a draft is being edited.
 * Then: initial drafts start only after loading and remain until attached.
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
const create = jest.fn();
const updateSource = jest.fn();
const updateThread = jest.fn();
const uploadFiles = jest.fn();
const refetch = jest.fn();
let sourceRead: any = { data: [] };
jest.mock("next/navigation", () => ({
  usePathname: () => "/ru/ai-chat/projects",
}));
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
const clipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
afterEach(() => {
  if (clipboardDescriptor)
    Object.defineProperty(navigator, "clipboard", clipboardDescriptor);
  else Reflect.deleteProperty(navigator, "clipboard");
});
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
it("hides the untouched initial form when another session saves the document", () => {
  const view = render(<Component {...loadingProps} />);
  expect(
    screen.getByRole("textbox", { name: "Products content" }),
  ).toBeTruthy();
  sourceRead = { data: [{ id: "saved-source" }] };
  view.rerender(<Component {...loadingProps} />);
  expect(
    screen.queryByRole("textbox", { name: "Products content" }),
  ).toBeNull();
  expect(
    screen.getByRole("button", { name: "Add knowledge section" }),
  ).toBeTruthy();
});
it("keeps an explicitly added empty section when another session saves the document", () => {
  Object.defineProperty(crypto, "randomUUID", {
    configurable: true,
    value: () => "added-section",
  });
  const view = render(<Component {...loadingProps} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Add knowledge section" }),
  );
  expect(
    screen.getAllByRole("button", { name: "Save knowledge" }),
  ).toHaveLength(2);
  sourceRead = { data: [{ id: "saved-source" }] };
  view.rerender(<Component {...loadingProps} />);
  expect(
    screen.getAllByRole("button", { name: "Save knowledge" }),
  ).toHaveLength(1);
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

it("copies instructions for the actual saved Thread file without copying Source bodies or writing data", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  sourceRead = {
    data: [
      {
        id: "saved-source",
        title: "Section title",
        content: "Private saved document text",
      },
      { id: "foreign", title: "Foreign", content: "Another document" },
    ],
  };
  render(
    <Component
      {...loadingProps}
      thread={{ ...loadingProps.thread, title: "Launch plan.md" }}
    />,
  );
  expect(
    screen.getAllByRole("button", { name: "Copy development request" }),
  ).toHaveLength(1);
  expect(
    screen
      .getByRole("link", { name: "Explore Code Framework" })
      .getAttribute("href"),
  ).toBe("/ru/framework");
  fireEvent.click(
    screen.getByRole("button", { name: "Copy development request" }),
  );
  await screen.findByText(/Request copied\. Review and save/);
  expect(writeText).toHaveBeenCalledTimes(1);
  const request = writeText.mock.calls[0][0];
  expect(request).toContain("Launch plan.md");
  expect(request).toContain("export and attach the file separately");
  expect(request).not.toContain("Private saved document text");
  expect(request).not.toContain("Another document");
  expect(create).not.toHaveBeenCalled();
  expect(updateSource).not.toHaveBeenCalled();
  expect(updateThread).not.toHaveBeenCalled();
  expect(uploadFiles).not.toHaveBeenCalled();
});

it.each([
  ["", true],
  [
    "## Контекст пользователя\n<!-- knowledge:user -->\n\n<!-- /knowledge:user -->",
    true,
  ],
  [
    "## Контекст пользователя\n<!-- knowledge:user -->\n\n<!-- /knowledge:user -->\n\n## Сведения из материалов\nSix workshop places.",
    false,
  ],
])(
  "enables the handoff only for effective content in the scoped saved Sources (%s)",
  (content, disabled) => {
    sourceRead = {
      data: [
        { id: "saved-source", title: "Section", content },
        {
          id: "foreign",
          title: "Foreign",
          content: "Foreign content does not enable this document",
        },
      ],
    };
    render(<Component {...loadingProps} />);
    expect(
      (
        screen.getByRole("button", {
          name: "Copy development request",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(disabled);
  },
);

it("does not treat an unconfirmed proposal as saved document content", () => {
  sourceRead = {
    data: [{ id: "saved-source", title: "Section", content: "" }],
  };
  render(
    <Component
      {...loadingProps}
      thread={{
        ...loadingProps.thread,
        metadata: {
          ...loadingProps.thread.metadata,
          rbacAiDocumentProposal: {
            version: 1,
            id: "proposal",
            status: "pending",
            sourceId: "saved-source",
            expectedContentHash: "hash",
            title: "Proposed section",
            userContext: "Unconfirmed facts",
            fileIds: [],
            triggerMessageId: "message",
          },
        },
      }}
    />,
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Copy development request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(screen.getByText(/An unconfirmed proposal is waiting/)).toBeTruthy();
  expect(screen.queryByText("Unconfirmed facts")).toBeNull();
});

it("resets feedback on saved text changes and ignores the previous pending clipboard completion", async () => {
  let finish!: () => void;
  const writeText = jest.fn().mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  sourceRead = {
    data: [
      { id: "saved-source", title: "Section", content: "Saved first version" },
    ],
  };
  const view = render(<Component {...loadingProps} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy development request" }),
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Copying request…",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  sourceRead = {
    data: [
      { id: "saved-source", title: "Section", content: "Saved second version" },
    ],
  };
  view.rerender(<Component {...loadingProps} />);
  expect(
    (
      screen.getByRole("button", {
        name: "Copy development request",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
  await act(async () => {
    finish();
    await Promise.resolve();
  });
  expect(screen.queryByText(/Request copied\. Review and save/)).toBeNull();
  expect(writeText).toHaveBeenCalledTimes(1);
});

it("offers a clipboard retry without changing document data", async () => {
  const writeText = jest
    .fn()
    .mockRejectedValueOnce(new Error("Denied"))
    .mockResolvedValueOnce(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  sourceRead = {
    data: [{ id: "saved-source", title: "Section", content: "Saved text" }],
  };
  render(<Component {...loadingProps} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy development request" }),
  );
  await screen.findByText(/The request could not be copied/);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy development request" }),
  );
  await screen.findByText(/Request copied\. Review and save/);
  expect(writeText).toHaveBeenCalledTimes(2);
  expect(updateSource).not.toHaveBeenCalled();
});

it("clears completed feedback when the exported document identity changes", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  sourceRead = {
    data: [{ id: "saved-source", title: "Section", content: "Saved text" }],
  };
  const view = render(<Component {...loadingProps} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy development request" }),
  );
  await screen.findByText(/Request copied\. Review and save/);
  view.rerender(
    <Component
      {...loadingProps}
      thread={{ ...loadingProps.thread, title: "Another saved file.md" }}
    />,
  );
  expect(screen.queryByText(/Request copied\. Review and save/)).toBeNull();
  expect(screen.getByText(/then export Another saved file.md/)).toBeTruthy();
});
