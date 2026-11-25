/** @jest-environment jsdom */

import {
  fireEvent,
  render,
  renderHook,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import { ThreadContext } from "./ThreadContext";
import { ThreadFilesContent, useThreadHasFiles } from "./ThreadFiles";

const mockThreadMessages = jest.fn();
const mockDownload = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWorkAttachment: (...args: unknown[]) => mockDownload(...args),
  },
}));

jest.mock("../hooks/use-thread-messages", () => ({
  useThreadAttachmentIndex: (
    scope: unknown,
    enabled: boolean,
    select?: unknown,
  ) =>
    mockThreadMessages(scope, false, {
      enabled,
      select,
      attachmentIndex: true,
    }),
  useThreadMessages: (...args: unknown[]) => mockThreadMessages(...args),
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

it("shows an attached file once using its preview card", () => {
  mockThreadMessages.mockReturnValue({
    data: [
      { id: "first-message", attachments: [{ id: "Design input" }] },
      { id: "second-message", attachments: [{ id: "Design input" }] },
    ],
  });

  render(<ThreadContext {...scope} isCustomerWork={false} />);

  expect(screen.getAllByText("Design input")).toHaveLength(1);
  expect(screen.getByText("Design input").getAttribute("data-layout")).toBe(
    "rail",
  );
});

it("shows exactly three distinct files across protected and public messages without More", () => {
  mockThreadMessages.mockReturnValue({
    data: [
      {
        id: "private",
        variant: "customer-work",
        privateAttachments: [{ id: "one", name: "First.txt" }],
      },
      { id: "public", attachments: [{ id: "Second" }, { id: "Third" }] },
      { id: "repeat", attachments: [{ id: "Second" }] },
    ],
  });
  render(<ThreadContext {...scope} isCustomerWork={false} />);
  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent),
  ).toEqual([expect.stringContaining("First.txt"), "Second", "Third"]);
  expect(screen.queryByRole("button", { name: "More" })).toBeNull();
});

it("opens a four-file gallery, previews an older private upload, and restores focus through both dialogs", async () => {
  const records = [
    { id: "public", attachments: [{ id: "One" }, { id: "Two" }] },
    {
      id: "protected",
      variant: "customer-work",
      attachments: [{ id: "Unrelated public record" }],
      privateAttachments: [
        { id: "three", name: "Three.bin" },
        { id: "four", name: "Four.txt" },
      ],
    },
  ];
  mockThreadMessages.mockReturnValue({ data: records });
  mockDownload.mockResolvedValue(
    new Blob(["Four contents"], { type: "application/octet-stream" }),
  );
  render(<ThreadContext {...scope} isCustomerWork={false} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.queryByText("Four.txt")).toBeNull();
  const more = screen.getByRole("button", { name: "More" });
  fireEvent.click(more);
  const gallery = screen.getByRole("dialog", { name: "All files" });
  expect(within(gallery).getAllByRole("listitem")).toHaveLength(4);
  expect(within(gallery).getByRole("list").className).toMatch(
    /grid-cols-2.*lg:grid-cols-6/,
  );
  expect(within(gallery).getByText("One").getAttribute("data-layout")).toBe(
    "gallery",
  );
  expect(within(gallery).queryByText("Unrelated public record")).toBeNull();
  const tile = within(gallery).getByRole("button", {
    name: "Preview Four.txt",
  });
  tile.focus();
  fireEvent.click(tile);
  const preview = screen.getByRole("dialog", { name: "Four.txt" });
  expect(await within(preview).findByText("Four contents")).toBeTruthy();
  expect(mockDownload).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "buyer",
      threadId: "thread",
      messageId: "protected",
      attachmentId: "four",
    }),
  );
  fireEvent.keyDown(preview, { key: "Escape" });
  await waitFor(() => expect(document.activeElement).toBe(tile));
  expect(screen.getByRole("dialog", { name: "All files" })).toBe(gallery);
  fireEvent.keyDown(gallery, { key: "Escape" });
  await waitFor(() => expect(document.activeElement).toBe(more));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("uses the CRM attachment operation for a gallery file in the original task message", async () => {
  const download = jest
    .fn()
    .mockResolvedValue(
      new Blob(["Staff text"], { type: "application/octet-stream" }),
    );
  const messages = [
    {
      id: "task-message",
      variant: "customer-work",
      privateAttachments: ["a", "b", "c", "d"].map((id) => ({
        id,
        name: id + ".txt",
      })),
    },
  ];
  render(
    <ThreadFilesContent
      {...scope}
      language="ru"
      isCustomerWork
      messages={messages as IChatMessage[]}
      onAttachmentDownload={download}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ещё" }));
  fireEvent.click(
    within(screen.getByRole("dialog", { name: "Все файлы" })).getByRole(
      "button",
      { name: "Открыть d.txt" },
    ),
  );
  expect(await screen.findByText("Staff text")).toBeTruthy();
  expect(download).toHaveBeenCalledWith(
    "task-message",
    "d",
    expect.any(AbortSignal),
    expect.any(Number),
  );
});

it("omits the Files heading when the selected discussion has no attachments", () => {
  mockThreadMessages.mockReturnValue({ data: [{ id: "message" }] });
  render(<ThreadContext {...scope} isCustomerWork={false} />);
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
  let error: { status: number } | null = null;
  mockThreadMessages.mockImplementation((_scope, _interval, options) => ({
    data: options.select(messages),
    error,
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
  error = { status: 403 };
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
  const work = {
    chatId: scope.socialModuleChatId,
    threadId: scope.socialModuleThreadId,
  } as ICustomerWorkView;
  const { container } = render(
    <ThreadContext {...scope} isCustomerWork work={work} />,
  );

  expect(screen.getByText("Customer work controls")).toBeTruthy();
  expect(screen.queryByText("Public file record")).toBeNull();
  expect(container.querySelector("a, iframe, object, embed, img")).toBeNull();
  expect(
    screen.getByRole("button", { name: "Preview Private brief.pdf" }),
  ).toBeTruthy();
});

it("finds files beyond the first 100 messages and loads the older public File only from its original message", async () => {
  const firstPage = Array.from({ length: 100 }, (_, i) => ({ id: String(i) }));
  const directory = [
    {
      id: "employee-message",
      variant: "customer-work",
      privateAttachments: [
        { id: "p1", name: "One.txt" },
        { id: "p2", name: "Two.txt" },
        { id: "p3", name: "Three.txt" },
      ],
    },
    {
      id: "older-message",
      publicAttachmentRefs: [
        { id: "Original public image", name: "Original.png" },
      ],
    },
  ];
  mockThreadMessages.mockImplementation((_scope, _interval, options = {}) => {
    if (options.enabled === false) return {};
    let data: unknown[] = firstPage;
    if (options.attachmentIndex) data = directory;
    if (options.attachmentMessageId) {
      data = [
        {
          id: "older-message",
          attachments: [{ id: "Original public image", file: "/original.png" }],
        },
      ];
    }
    return { data: options.select ? options.select(data) : data };
  });
  const { result } = renderHook(() => useThreadHasFiles(scope, false));
  expect(result.current).toBe(true);
  render(<ThreadContext {...scope} isCustomerWork={false} />);
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(
    mockThreadMessages.mock.calls.some((call) => call[2]?.attachmentMessageId),
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "More" }));
  const gallery = within(screen.getByRole("dialog", { name: "All files" }));
  expect(await gallery.findByText("Original public image")).toBeTruthy();
  expect(mockThreadMessages).toHaveBeenCalledWith(
    expect.objectContaining({
      subjectId: "buyer",
      socialModuleChatId: "chat",
      socialModuleThreadId: "thread",
    }),
    false,
    expect.objectContaining({
      attachmentMessageId: "older-message",
      enabled: true,
    }),
  );
});
