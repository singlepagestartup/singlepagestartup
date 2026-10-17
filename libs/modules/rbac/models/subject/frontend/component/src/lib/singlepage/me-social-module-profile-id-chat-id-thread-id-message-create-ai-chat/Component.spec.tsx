/** @jest-environment jsdom */
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("pdfjs-dist/webpack.mjs", () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getViewport: ({ scale }: any) => ({
          width: 600 * scale,
          height: 800 * scale,
        }),
        render: () => ({ promise: Promise.resolve(), cancel: jest.fn() }),
      }),
    }),
    destroy: jest.fn(),
  }),
}));
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const send = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdProfileFindByIdKnowledgeSourceFind:
      () => ({
        data: [
          { id: "source", title: "Products" },
          { id: "booking-source", title: "Bookings" },
          { id: "other-document-source", title: "Strategy" },
        ],
      }),
    socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate: () => ({
      mutateAsync: send,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/website-builder/models/feature/frontend/component", () => ({
  Component: () => null,
}));
import Component from "./client";
beforeEach(() => send.mockReset());

it("accumulates file selections, removes files, reorders with arrows and dragging, and sends the staged order with Cmd Enter", async () => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  send.mockResolvedValue({ id: "sent" });
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: { id: "topic", metadata: {} },
        target: "whole",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  const first = new File(["first"], "first.png", { type: "image/png" });
  const second = new File(["second"], "second.webp", { type: "image/webp" });
  const third = new File(["third"], "third.txt", { type: "text/plain" });
  const input = screen.getByLabelText("Attach files to message");
  fireEvent.change(input, { target: { files: [first, second] } });
  fireEvent.change(input, { target: { files: [third] } });
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  fireEvent.click(
    screen.getByRole("button", { name: "Move third.txt earlier" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove first.png" }));
  const transferred = new Map<string, string>();
  const dataTransfer = {
    setData: (type: string, value: string) => transferred.set(type, value),
    getData: (type: string) => transferred.get(type) || "",
    effectAllowed: "",
    dropEffect: "",
  };
  const dragged = screen.getByText("third.txt").closest("li")!;
  const destination = screen.getByText("second.webp").closest("li")!;
  fireEvent.dragStart(dragged, { dataTransfer });
  fireEvent.dragOver(destination, { dataTransfer });
  fireEvent.drop(destination, { dataTransfer });
  const textarea = screen.getByRole("textbox", { name: "Message" });
  fireEvent.change(textarea, { target: { value: "Review the material" } });
  fireEvent.keyDown(textarea, { key: "Enter" });
  expect(send).not.toHaveBeenCalled();
  fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send.mock.calls[0][0].data.files).toEqual([second, third]);
  await waitFor(() => expect(screen.queryByRole("listitem")).toBeNull());
});

it("sends file-only messages with Ctrl Enter and retains attachments when sending fails", async () => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  send.mockRejectedValue(new Error("Upload failed"));
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: { id: "topic", metadata: {} },
        target: "whole",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  const file = new File(["data"], "notes.txt", { type: "text/plain" });
  fireEvent.change(screen.getByLabelText("Attach files to message"), {
    target: { files: [file] },
  });
  fireEvent.keyDown(screen.getByRole("textbox", { name: "Message" }), {
    key: "Enter",
    ctrlKey: true,
  });
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Upload failed"),
  );
  expect(send.mock.calls[0][0].data.files).toEqual([file]);
  expect(send.mock.calls[0][0].data.description).toBe("Attached files.");
  expect(screen.getByRole("button", { name: "Remove notes.txt" })).toBeTruthy();
});
it("keeps project Knowledge search for ordinary conversations without showing document targets or sending a stale Source target", async () => {
  send.mockResolvedValue({ id: "message" });
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: {
          id: "topic",
          metadata: { aiChatDocument: { profileId: "project", sourceIds: [] } },
        },
        target: "source",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  expect(screen.queryByRole("button", { name: "Working on" })).toBeNull();
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "Discuss bookings" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send.mock.calls[0][0].data.metadata).not.toHaveProperty(
    "aiChatDocumentSourceId",
  );
  expect(
    send.mock.calls[0][0].data.metadata.rbacAiReactionRequest
      .useKnowledgeSearch,
  ).toBe(true);
});
it("sends through the requester profile and preserves the selected Knowledge context", async () => {
  send.mockResolvedValue({ id: "message" });
  render(
    <Component
      {...({
        isServer: false,
        variant:
          "me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat",
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: {
          id: "thread",
          title: "Products.md",
          metadata: {
            aiChatDocument: {
              key: "products",
              profileId: "project",
              sourceIds: ["source"],
            },
          },
        },
        target: "source",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "Review these products" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      id: "subject",
      socialModuleProfileId: "requester",
      socialModuleChatId: "chat",
      socialModuleThreadId: "thread",
      data: expect.objectContaining({
        description:
          "Working on knowledge: Products (Source ID: source) in Products.md.\n\nReview these products",
        metadata: expect.objectContaining({ aiChatDocumentSourceId: "source" }),
      }),
    }),
  );
  await waitFor(() =>
    expect(
      (screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement)
        .value,
    ).toBe(""),
  );
});

it("falls back to the whole document when a selected Source is not connected to this Thread", async () => {
  send.mockResolvedValue({ id: "message" });
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: {
          id: "thread",
          title: "Brief.md",
          metadata: {
            aiChatDocument: {
              key: "brief",
              profileId: "project",
              sourceIds: ["source"],
            },
          },
        },
        target: "other-document-source",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  expect(screen.queryByRole("button", { name: "Working on" })).toBeNull();
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: "Review this brief" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(send).toHaveBeenCalled());
  expect(send.mock.calls[0][0].data.description).toBe(
    "Working on the whole document: Brief.md.\n\nReview this brief",
  );
  expect(send.mock.calls[0][0].data.metadata).not.toHaveProperty(
    "aiChatDocumentSourceId",
  );
});

it("rejects new SVG attachments without replacing earlier supported files", async () => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  send.mockResolvedValue({ id: "sent" });
  render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: {
          id: "thread",
          title: "Brief.md",
          metadata: {
            aiChatDocument: {
              key: "brief",
              profileId: "project",
              sourceIds: [],
            },
          },
        },
        target: "whole",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  expect(screen.queryByRole("button", { name: "Working on" })).toBeNull();
  const input = screen.getByLabelText(
    "Attach files to message",
  ) as HTMLInputElement;
  expect(input.accept).not.toContain(".svg");
  const first = new File(["data"], "first.png", { type: "image/png" });
  const second = new File(["data"], "second.jpg", { type: "image/jpeg" });
  fireEvent.change(input, { target: { files: [first] } });
  fireEvent.change(input, {
    target: {
      files: [
        new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }),
        second,
      ],
    },
  });
  expect(screen.getByRole("alert").textContent).toContain("logo.svg");
  expect(screen.getAllByRole("listitem")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
  await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send.mock.calls[0][0].data.files).toEqual([first, second]);
});

it("previews staged Markdown and PDF locally without submitting, then keeps removal and the draft intact", async () => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  const { unmount } = render(
    <Component
      {...({
        data: { id: "subject" },
        project: {
          requesterProfileId: "requester",
          profile: { id: "project" },
          chat: { id: "chat" },
        },
        thread: { id: "topic", metadata: {} },
        target: "whole",
        onTargetChange: jest.fn(),
      } as any)}
    />,
  );
  const markdown = new File(
    [
      "# Local notes\n\n**Keep this draft**\n\n[unsafe](javascript:alert(1))\n\n![External](https://example.com/tracker.png)\n\n<script>alert(1)</script>",
    ],
    "Notes.md",
    { type: "text/markdown" },
  );
  const pdf = new File(["%PDF-1.7"], "Guide.pdf", { type: "application/pdf" });
  pdf.arrayBuffer = async () => new ArrayBuffer(8);
  global.ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
  fireEvent.change(screen.getByLabelText("Attach files to message"), {
    target: { files: [markdown, pdf] },
  });
  const message = screen.getByRole("textbox", { name: "Message" });
  fireEvent.change(message, { target: { value: "Unsent message" } });
  fireEvent.click(screen.getByRole("button", { name: "Preview Notes.md" }));
  await waitFor(() =>
    expect(screen.getByRole("heading", { name: "Local notes" })).toBeTruthy(),
  );
  expect(
    document.querySelector(
      'a[href^="javascript:"], script, img[src="https://example.com/tracker.png"]',
    ),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Source", exact: true }));
  expect(screen.getByText(/# Local notes/).tagName).toBe("PRE");
  fireEvent.click(screen.getByRole("button", { name: "Close", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Preview Guide.pdf" }));
  await waitFor(() => expect(screen.getByText("Page 1 of 1")).toBeTruthy());
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  fireEvent.click(screen.getByRole("button", { name: "Remove Guide.pdf" }));
  expect(screen.getByRole("button", { name: "Preview Notes.md" })).toBeTruthy();
  expect((message as HTMLTextAreaElement).value).toBe("Unsent message");
  expect(send).not.toHaveBeenCalled();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});
