/** @jest-environment jsdom */
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("@sps/file-storage/models/file/sdk/client", () => ({
  api: { previewText: jest.fn(), download: jest.fn() },
}));
import { fireEvent, render, screen, within } from "@testing-library/react";
const mockFiles = [
  {
    id: "file-1",
    file: "/first.png",
    adminTitle: "First.png",
    mimeType: "image/png",
  },
  {
    id: "file-2",
    file: "/second.svg",
    adminTitle: "Second.svg",
    mimeType: "image/svg+xml",
  },
  {
    id: "file-3",
    file: "/third.pdf",
    adminTitle: "Third.pdf",
    mimeType: "application/pdf",
  },
];
jest.mock(
  "@sps/social/relations/profiles-to-messages/frontend/component",
  () => ({
    Component: jest.fn((props: any) =>
      props.children({
        data: [
          {
            profileId:
              props.apiProps.params.filters.and[0].value === "user-message"
                ? "requester"
                : "author-assistant",
          },
        ],
      }),
    ),
  }),
);
jest.mock(
  "@sps/social/relations/messages-to-file-storage-module-files/frontend/component",
  () => ({
    Component: jest.fn((props: any) =>
      props.children({
        data:
          props.apiProps.params.filters.and[0].value === "user-message"
            ? [
                {
                  id: "link-3",
                  fileStorageModuleFileId: "file-3",
                  orderIndex: 2,
                },
                {
                  id: "link-1",
                  fileStorageModuleFileId: "file-1",
                  orderIndex: 0,
                },
                {
                  id: "link-2",
                  fileStorageModuleFileId: "file-2",
                  orderIndex: 1,
                },
              ]
            : [],
      }),
    ),
  }),
);
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "find"
      ? props.children({
          data: mockFiles.filter(
            (file) => file.id === props.apiProps.params.filters.and[0].value,
          ),
        })
      : jest
          .requireActual(
            "@sps/file-storage/models/file/frontend/component/src/lib/singlepage/attachment-ai-chat/Component",
          )
          .Component(props),
}));
import { Component } from "./Component";
it("opens the actual assistant author from both the avatar and name; user messages remain noninteractive", () => {
  const open = jest.fn();
  render(
    <Component
      {...({
        data: [
          {
            id: "user-message",
            description: "Question",
            createdAt: "2026-10-12T00:00:00Z",
          },
          {
            id: "assistant-message",
            description: "Answer",
            createdAt: "2026-10-12T00:00:01Z",
          },
        ],
        requesterProfileId: "requester",
        assistantProfileId: "fallback-assistant",
        onProfileOpen: open,
      } as any)}
    />,
  );
  expect(
    screen.getAllByRole("button", { name: "Open assistant profile" }),
  ).toHaveLength(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Open assistant profile" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "About this assistant" }));
  expect(open.mock.calls).toEqual([["author-assistant"], ["author-assistant"]]);
});
it("opens the project assistant for an empty document introduction", () => {
  const open = jest.fn();
  render(
    <Component
      {...({
        data: [],
        assistantProfileId: "project",
        onProfileOpen: open,
      } as any)}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "About this assistant" }));
  expect(open).toHaveBeenCalledWith("project");
});

it("preserves attachment order, opens supported originals and blocks legacy SVG", () => {
  render(
    <Component
      {...({
        data: [
          {
            id: "user-message",
            description: "References",
            createdAt: "2026-10-13T00:00:00Z",
          },
        ],
        requesterProfileId: "requester",
      } as any)}
    />,
  );
  const gallery = screen.getByRole("list", { name: "Message attachments" });
  expect(
    within(gallery)
      .getAllByRole("button", { name: /^Preview / })
      .map((link) => link.getAttribute("aria-label")),
  ).toEqual(["Preview First.png", "Preview Third.pdf"]);
  expect(within(gallery).getAllByRole("presentation")).toHaveLength(1);
  expect(within(gallery).getByText("Second.svg")).toBeTruthy();
  expect(within(gallery).getByText("Unsupported attachment")).toBeTruthy();
  expect(
    Array.from(gallery.querySelectorAll('[data-model="file"]')).map((node) =>
      node.getAttribute("data-id"),
    ),
  ).toEqual(["file-1", "file-2", "file-3"]);
  expect(gallery.querySelector('img[src$=".svg"],a[href$=".svg"]')).toBeNull();
});

it("follows new replies and growing attachments but preserves the position when reading older messages", () => {
  let height = 1000;
  let resized = () => {};
  const originalObserver = global.ResizeObserver;
  global.ResizeObserver = class {
    constructor(callback: () => void) {
      resized = callback;
    }
    observe() {}
    disconnect() {}
  } as any;
  const scrollHeight = jest
    .spyOn(HTMLElement.prototype, "scrollHeight", "get")
    .mockImplementation(() => height);
  const clientHeight = jest
    .spyOn(HTMLElement.prototype, "clientHeight", "get")
    .mockReturnValue(300);
  const initial = [
    {
      id: "assistant-message",
      description: "First answer",
      createdAt: "2026-10-13T00:00:00Z",
    },
  ];
  const view = (data: any[]) => (
    <div data-testid="pane" data-ai-chat-messages>
      <Component {...({ data, requesterProfileId: "requester" } as any)} />
    </div>
  );
  try {
    const { rerender, unmount } = render(view(initial));
    const pane = screen.getByTestId("pane");
    expect(pane.scrollTop).toBe(1000);
    height = 1200;
    resized();
    expect(pane.scrollTop).toBe(1200);
    pane.scrollTop = 100;
    fireEvent.scroll(pane);
    height = 1400;
    resized();
    rerender(view([...initial]));
    expect(pane.scrollTop).toBe(100);
    rerender(
      view([
        ...initial,
        {
          id: "new-reply",
          description: "New answer",
          createdAt: "2026-10-13T00:00:01Z",
        },
      ]),
    );
    expect(pane.scrollTop).toBe(100);
    fireEvent.click(screen.getByRole("button", { name: "New messages" }));
    expect(pane.scrollTop).toBe(1400);
    unmount();
  } finally {
    global.ResizeObserver = originalObserver;
    scrollHeight.mockRestore();
    clientHeight.mockRestore();
  }
});

it("renders scoped authors and all files without reading generic relations", () => {
  const authors = jest.requireMock(
    "@sps/social/relations/profiles-to-messages/frontend/component",
  ).Component;
  const messageFiles = jest.requireMock(
    "@sps/social/relations/messages-to-file-storage-module-files/frontend/component",
  ).Component;
  authors.mockClear();
  messageFiles.mockClear();
  const open = jest.fn();
  render(
    <Component
      {...({
        data: [
          {
            id: "scoped-user-message",
            description: "Two references",
            authorProfileIds: ["requester"],
            attachments: [mockFiles[2], mockFiles[0]],
            createdAt: "2026-10-13T00:00:00Z",
          },
          {
            id: "scoped-assistant-message",
            description: "Answer",
            authorProfileIds: ["author-assistant"],
            attachments: [],
            createdAt: "2026-10-13T00:00:01Z",
          },
        ],
        requesterProfileId: "requester",
        onProfileOpen: open,
      } as any)}
    />,
  );
  expect(authors).not.toHaveBeenCalled();
  expect(messageFiles).not.toHaveBeenCalled();
  expect(
    within(screen.getByRole("list", { name: "Message attachments" }))
      .getAllByRole("button", { name: /^Preview / })
      .map((link) => link.getAttribute("aria-label")),
  ).toEqual(["Preview Third.pdf", "Preview First.png"]);
  fireEvent.click(screen.getByRole("button", { name: "About this assistant" }));
  expect(open).toHaveBeenCalledWith("author-assistant");
});
