/** @jest-environment jsdom */

import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import { ThreadContext } from "./ThreadContext";
import { useThreadHasFiles } from "./ThreadFiles";

const mockThreadMessages = jest.fn();

jest.mock("../hooks/use-thread-messages", () => ({
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
    "card",
  );
});

it("shows six files initially and scrolls the expanded list", () => {
  mockThreadMessages.mockReturnValue({
    data: [
      {
        id: "public",
        attachments: Array.from({ length: 5 }, (_, index) => ({
          id: `File ${index + 1}`,
        })),
      },
      {
        id: "protected",
        variant: "customer-work",
        privateAttachments: [6, 7, 8].map((index) => ({
          id: `private-${index}`,
          name: `File ${index}`,
        })),
      },
    ],
  });
  render(<ThreadContext {...scope} isCustomerWork={false} />);

  expect(screen.getByText("File 1")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Download File 6" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Download File 7" })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Show all files (8)", expanded: false }),
  );
  expect(screen.getByRole("region", { name: "All files" }).classList).toContain(
    "overflow-y-auto",
  );
  expect(screen.getByRole("button", { name: "Download File 8" })).toBeTruthy();

  fireEvent.click(
    screen.getByRole("button", { name: "Show fewer files", expanded: true }),
  );
  expect(screen.queryByRole("button", { name: "Download File 7" })).toBeNull();
  expect(screen.getByRole("button", { name: "Download File 6" })).toBeTruthy();
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
    screen.getByRole("button", { name: "Download Private brief.pdf" }),
  ).toBeTruthy();
});
