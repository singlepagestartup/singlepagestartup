/** @jest-environment jsdom */

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithoutRef } from "react";
import { Component as ChatList } from "../../list/default/ClientComponent";
import { Component } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };
const mockCreate = jest.fn();
const mockCreateEmployeeThread = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateChat = jest.fn();
const mockUpdateCover = jest.fn();
const mockReadCover = jest.fn();
const mockSearchProfiles = jest.fn();
const mockAddProfile = jest.fn();
const mockRemoveProfile = jest.fn();
const mockDelete = jest.fn();
let mockDeletePending = false;
let mockThreadsAccessError: { status: number } | undefined;
const mockRefetch = jest.fn();
const mockFindThreads = jest.fn();
const mockThreadView = jest.fn();
const mockSubject = { id: "subject" } as IComponentPropsExtended["data"];
const mockProfile = {
  id: "profile",
} as IComponentPropsExtended["socialModuleProfile"];
const mockChat = {
  id: "chat",
  title: { en: "Team chat", ru: "Команда" },
  variant: "ai-chat",
  canManageChat: true,
  createdAt: "2026-01-01",
} as unknown as IComponentPropsExtended["socialModuleChat"];
const mockChats = [
  { ...mockChat, lastMessageAt: "2026-01-03T14:21:00.000Z", unreadCount: 3 },
  { ...mockChat, id: "other-chat", title: "Support" },
];
const defaultThread = {
  id: "default",
  title: "General",
  createdAt: "2026-01-01",
  variant: "default",
  lastMessageAt: "2026-01-04T12:10:00.000Z",
  lastMessagePreview: "The cover is ready",
  lastMessageAuthorId: "employee-profile",
  unreadCount: 2,
};
const documentThread = {
  ...defaultThread,
  id: "old-document",
  title: "Brief.md",
  metadata: {
    aiChatDocument: { key: "brief", profileId: "assistant", sourceIds: [] },
  },
};
let mockThreads: (typeof defaultThread | typeof documentThread)[];

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    onNavigate,
    prefetch: _prefetch,
    ...props
  }: ComponentPropsWithoutRef<"a"> & {
    onNavigate?: (event: { preventDefault: () => void }) => void;
    prefetch?: boolean;
  }) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault();
        onNavigate?.(event);
      }}
    />
  ),
}));

jest.mock("@sps/ui-adapter", () => ({
  ...jest.requireActual(
    "../../../../../../../../../../../../../../shared/ui/adapter/src/lib/chat-workspace",
  ),
  Icon: () => null,
  FormField: ({
    name,
    form,
  }: {
    name: string;
    form: { register: (field: string) => object };
  }) => <input aria-label={name} {...form.register(name)} />,
}));

jest.mock("@sps/social/models/profile/frontend/component", () => ({
  getLocalizedPlainText: (
    text: Record<string, string> | null,
    language: string,
  ) => text?.[language],
  Component: () => null,
}));

jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: jest.requireActual(
    "@sps/social/models/thread/frontend/component/src/lib/singlepage/list-item-sidebar-ai-chat/ClientComponent",
  ).Component,
}));

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: {
    variant: string;
    socialModuleThread?: { title: string };
  }) => {
    if (props.variant === "social-module-profile-chat-list-default") {
      const List = jest.requireActual(
        "../../list/default/ClientComponent",
      ).Component;
      return <List {...props} socialModuleChats={mockChats} />;
    }
    if (props.variant === "social-module-profile-chat-default") {
      const Chat = jest.requireActual("../../default/Component").Component;
      return <Chat {...props} />;
    }
    mockThreadView(props);
    return (
      <>
        <p data-testid="conversation">{props.socialModuleThread?.title}</p>
        <input aria-label="Message draft" />
        <input aria-label="Attachments" type="file" />
      </>
    );
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/subjects",
  STORE_EMPLOYEE_CHAT_VARIANT: "store-employee",
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => {
  const empty = () => ({});
  return {
    api: {
      socialModuleChatFindByIdUpdate: () => ({
        mutate: mockUpdateChat,
        mutateAsync: mockUpdateCover,
      }),
      socialModuleProfileChatCoverContent: (...args: unknown[]) =>
        mockReadCover(...args),
      socialModuleChatFindByIdThreadCreate: () => ({ mutate: mockCreate }),
      socialModuleChatFindByIdThreadUpdate: () => ({ mutate: mockUpdate }),
      socialModuleChatFindByIdThreadDelete: () => ({
        mutate: mockDelete,
        isPending: mockDeletePending,
      }),
      socialModuleChatFindByIdProfileCreate: () => ({ mutate: mockAddProfile }),
      socialModuleChatFindByIdProfileDelete: () => ({
        mutate: mockRemoveProfile,
      }),
      socialModuleProfileFindByIdChatFindByIdDelete: empty,
      socialModuleChatFindByIdProfileSearch: (props: {
        reactQueryOptions: { enabled: boolean };
      }) => {
        mockSearchProfiles(props);
        return {
          data: props.reactQueryOptions.enabled
            ? [{ id: "candidate", title: { en: "Lea" }, slug: "lea" }]
            : [],
        };
      },
      socialModuleChatFindByIdAgentSubjectSearch: empty,
      socialModuleChatFindByIdThreadFind: (props: unknown) => {
        mockFindThreads(props);
        return {
          data: mockThreads,
          error: mockThreadsAccessError,
          isError: Boolean(mockThreadsAccessError),
          refetch: mockRefetch,
        };
      },
    },
  };
});

function chatOverview(socialModuleThreadId?: string) {
  return (
    <Component
      isServer={false}
      variant="social-module-profile-chat-overview-default"
      data={mockSubject}
      language="en"
      socialModuleProfile={mockProfile}
      socialModuleChatId={mockChat.id}
      socialModuleChat={mockChat}
      socialModuleThreadId={socialModuleThreadId}
    />
  );
}

function renderChat(socialModuleThreadId?: string) {
  return render(chatOverview(socialModuleThreadId));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockThreads = [defaultThread];
  mockDeletePending = false;
  mockThreadsAccessError = undefined;
});

const employeePath = "/en/ecommerce/stores/shop/employees/employee";
const employee = {
  id: "employee-profile",
  title: { en: "Alice" },
  variant: "artificial-intelligence",
} as IComponentPropsExtended["socialModuleProfile"];
const employeeChat = {
  ...mockChat,
  variant: "store-employee",
  participants: [mockProfile, employee],
};

function employeeOverview(
  threadId: string = defaultThread.id,
  chat = employeeChat,
) {
  return (
    <Component
      isServer={false}
      variant="social-module-profile-chat-overview-default"
      data={mockSubject}
      language="en"
      socialModuleProfile={mockProfile}
      socialModuleChatId={employeeChat.id}
      socialModuleChat={chat}
      socialModuleThreadId={threadId}
      defaultThreadId={defaultThread.id}
      threadListLimit={150}
      getThreadHref={(id) => `${employeePath}?thread=${id}`}
      onCreateThread={mockCreateEmployeeThread}
      socialModuleEmployeeProfileId={employee.id}
    />
  );
}

it("revisits staff conversations from the Social thread sidebar and resets the draft and files", () => {
  window.history.replaceState(null, "", `${employeePath}?view=tasks`);
  mockThreads = [documentThread, defaultThread];
  const { rerender } = render(employeeOverview());
  const topics = within(screen.getByRole("navigation", { name: "Threads" }));
  const current = topics.getByRole("link", { name: /^Main conversation/ });
  const previous = topics.getByRole<HTMLAnchorElement>("link", {
    name: /^Brief[.]md/,
  });
  expect(current.getAttribute("aria-current")).toBe("page");
  expect(current.textContent).toContain("Alice: The cover is ready");
  expect(current.textContent).toMatch(/Unread:\s*2/);
  expect(previous.dataset.variant).toBe("list-item-sidebar-ai-chat");
  const nextUrl = new URL(previous.href);
  expect(nextUrl.pathname).toBe(employeePath);
  expect(nextUrl.searchParams.get("thread")).toBe(documentThread.id);
  expect(mockFindThreads).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({ limit: 150 }),
    }),
  );
  expect(topics.queryByRole("button", { name: "Back to chats" })).toBeNull();
  expect(mockThreadView).toHaveBeenLastCalledWith(
    expect.objectContaining({
      socialModuleProfile: mockProfile,
      artificialIntelligenceOpponentProfile: employee,
      socialModuleThreadId: defaultThread.id,
      socialModuleThread: defaultThread,
    }),
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Message draft" }), {
    target: { value: "Unsent message" },
  });
  fireEvent.change(screen.getByLabelText("Attachments"), {
    target: { files: [new File(["draft"], "cover.txt")] },
  });
  window.history.pushState(null, "", nextUrl.href);
  rerender(employeeOverview(documentThread.id));
  expect(previous.getAttribute("aria-current")).toBe("page");
  expect(screen.getByTestId("conversation").textContent).toBe("Brief.md");
  expect(
    screen.getByRole<HTMLInputElement>("textbox", { name: "Message draft" })
      .value,
  ).toBe("");
  expect(
    screen.getByLabelText<HTMLInputElement>("Attachments").files,
  ).toHaveLength(0);

  rerender(employeeOverview("unrelated"));
  expect(screen.queryByTestId("conversation")).toBeNull();
  expect(screen.getByRole("status").textContent).toMatch(/unavailable/i);
  expect(topics.getByRole("link", { name: /^Main conversation/ })).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});

it("hides cached staff threads when access to the conversation is revoked", () => {
  mockThreads = [defaultThread, documentThread];
  const { rerender } = render(employeeOverview());
  expect(screen.getByRole("link", { name: /^Brief[.]md/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Chat settings" }));
  fireEvent.click(screen.getByRole("button", { name: /^Threads/ }));
  expect(screen.getByRole("textbox", { name: "Thread title" })).toBeTruthy();
  mockThreadsAccessError = { status: 403 };
  rerender(employeeOverview());
  expect(screen.queryByRole("link", { name: /^Brief[.]md/ })).toBeNull();
  expect(screen.queryByTestId("conversation")).toBeNull();
  expect(screen.queryByRole("button", { name: "Chat settings" })).toBeNull();
  expect(screen.queryByRole("button", { name: "New thread" })).toBeNull();
  expect(screen.queryByRole("textbox", { name: "Thread title" })).toBeNull();
});

it("opens staff thread settings from the Social sidebar and creates a named topic in the employee scope", async () => {
  mockCreateEmployeeThread.mockResolvedValueOnce("new");
  window.history.replaceState(null, "", employeePath);
  render(employeeOverview());
  const topics = within(screen.getByRole("navigation", { name: "Threads" }));
  fireEvent.click(topics.getByRole("button", { name: "Chat settings" }));
  fireEvent.click(screen.getByRole("button", { name: /^Members/ }));
  const members = within(screen.getByRole("dialog"));
  expect(members.queryByRole("button", { name: "Remove member" })).toBeNull();
  expect(members.queryByRole("button", { name: "Add member" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /^Threads/ }));
  const title = screen.getByRole("textbox", { name: "Thread title" });
  const create = screen.getByRole<HTMLButtonElement>("button", {
    name: "Create",
  });
  expect(create.disabled).toBe(true);
  expect(screen.getByRole("button", { name: /^Members/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: /^Rename thread/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: /^Delete/ })).toBeNull();
  fireEvent.change(title, { target: { value: "  New designs  " } });
  fireEvent.click(create);
  expect(mockCreateEmployeeThread).toHaveBeenCalledWith("New designs");
  expect(mockCreate).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith(`${employeePath}?thread=new`, {
      scroll: false,
    }),
  );
});

it("keeps staff chat tools out of customer order conversations", () => {
  const orderChat = {
    ...employeeChat,
    variant: "customer-work",
    canManageChat: false,
  };
  const { rerender } = render(employeeOverview(defaultThread.id, orderChat));
  expect(screen.queryByTestId("conversation")).toBeNull();
  expect(screen.getByRole("status").textContent).toMatch(/unavailable/i);
  rerender(
    <Component
      isServer={false}
      variant="social-module-profile-chat-overview-default"
      data={mockSubject}
      language="en"
      socialModuleProfile={mockProfile}
      socialModuleChatId={orderChat.id}
      socialModuleChat={orderChat}
      socialModuleThreadId={defaultThread.id}
    />,
  );
  expect(screen.getByTestId("conversation").textContent).toBe("General");
  expect(screen.queryByRole("button", { name: "New thread" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Chat settings" }));
  const settings = within(
    screen.getByRole("dialog", { name: "Chat settings" }),
  );
  expect(settings.getByRole("button", { name: /Members/ })).toBeTruthy();
  expect(settings.queryByRole("button", { name: "General" })).toBeNull();
  expect(settings.queryByRole("button", { name: "Remove member" })).toBeNull();
  expect(settings.queryByRole("button", { name: "Leave chat" })).toBeNull();
  fireEvent.change(settings.getByRole("textbox"), {
    target: { value: "Alex" },
  });
  expect(mockSearchProfiles).not.toHaveBeenCalledWith(
    expect.objectContaining({ reactQueryOptions: { enabled: true } }),
  );
  expect(mockCreateEmployeeThread).not.toHaveBeenCalled();
});

it.each(["default", "store-employee", "customer-work"])(
  "keeps settings read-only for members of %s chats despite staff access or a thread callback",
  (variant) => {
    const chat = {
      ...mockChat,
      variant,
      participants: [mockProfile, employee],
      taskChatStaff: true,
      canManageChat: false,
    };
    render(
      <Component
        isServer={false}
        variant="social-module-profile-chat-overview-default"
        data={mockSubject}
        language="en"
        socialModuleProfile={mockProfile}
        socialModuleChatId={chat.id}
        socialModuleChat={chat}
        socialModuleThreadId={defaultThread.id}
        defaultThreadId={defaultThread.id}
        onCreateThread={mockCreateEmployeeThread}
      />,
    );
    expect(screen.getByTestId("conversation")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "New thread" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Chat settings" }));
    const settings = within(screen.getByRole("dialog"));
    expect(settings.getByRole("button", { name: /^Members/ })).toBeTruthy();
    expect(settings.queryByRole("button", { name: "General" })).toBeNull();
    expect(settings.queryByRole("button", { name: /^Threads/ })).toBeNull();
    expect(
      settings.queryByRole("button", { name: "Remove member" }),
    ).toBeNull();
  },
);

it("keeps an intake task in its own thread of a customer's existing chat", () => {
  mockThreads = [documentThread, defaultThread];
  const taskChat = {
    ...mockChat,
    canManageChat: false,
    taskChatStaff: true,
    taskChatThreadId: defaultThread.id,
  };
  render(
    <Component
      isServer={false}
      variant="social-module-profile-chat-overview-default"
      data={mockSubject}
      language="en"
      socialModuleProfile={mockProfile}
      socialModuleChatId={taskChat.id}
      socialModuleChat={taskChat}
      socialModuleThreadId={defaultThread.id}
    />,
  );
  expect(screen.getByTestId("conversation").textContent).toBe("General");
  expect(screen.queryByRole("link", { name: /Brief[.]md/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "New thread" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Chat settings" }));
  const settings = within(screen.getByRole("dialog"));
  expect(settings.getByRole("button", { name: /Members/ })).toBeTruthy();
  expect(settings.queryByRole("button", { name: /Threads/ })).toBeNull();
});

it("renders the searchable chat sidebar before a chat is selected", () => {
  render(
    <ChatList
      isServer={false}
      variant="social-module-profile-chat-list-default"
      data={mockSubject}
      language="en"
      socialModuleProfile={mockProfile}
      socialModuleChats={mockChats}
    />,
  );
  const sidebar = within(screen.getByRole("complementary"));
  expect(sidebar.getByRole("heading", { name: "Chats" })).toBeTruthy();
  const searchButton = sidebar.getByRole("button", { name: "Search chats" });
  expect(sidebar.queryByRole("searchbox")).toBeNull();
  const teamChat = sidebar.getByRole("link", { name: /Team chat/ });
  expect(teamChat.querySelector("time")?.dateTime).toBe(
    "2026-01-03T14:21:00.000Z",
  );
  expect(teamChat.textContent).toContain("Unread: 3");
  fireEvent.click(searchButton);
  const search = sidebar.getByRole("searchbox", { name: "Search chats" });
  fireEvent.change(search, { target: { value: "missing" } });
  expect(sidebar.getByRole("status").textContent).toBe("No matching chats");
  fireEvent.keyDown(search, { key: "Escape" });
  expect(sidebar.queryByRole("searchbox")).toBeNull();
  expect(document.activeElement).toBe(searchButton);
  expect(sidebar.getAllByRole("link")).toHaveLength(2);
});

it("opens the only thread with the searchable chat list still in the sidebar", () => {
  renderChat();
  expect(mockReplace).toHaveBeenCalledWith(
    "/en/social/chats/chat/threads/default",
  );
  expect(screen.getByTestId("conversation").textContent).toBe("General");
  const chats = within(screen.getByRole("navigation", { name: "Chats" }));
  expect(chats.getByRole("button", { name: "Chat settings" })).toBeTruthy();
  expect(chats.getByRole("link", { name: /Team chat/ })).toBeTruthy();
  fireEvent.click(chats.getByRole("button", { name: "Search chats" }));
  fireEvent.change(chats.getByRole("searchbox", { name: "Search chats" }), {
    target: { value: "SUPPORT" },
  });
  expect(chats.getByRole("link", { name: /Support/ })).toBeTruthy();
  expect(chats.queryByRole("link", { name: /Team chat/ })).toBeNull();
});

it("uses the same sidebar for chats and a flat list of ordinary and historical threads", () => {
  mockThreads.push(documentThread);
  renderChat();
  expect(mockReplace).not.toHaveBeenCalled();
  const threads = within(screen.getByRole("navigation", { name: "Threads" }));
  const general = threads.getByRole("link", { name: /^General/ });
  expect(general.querySelector("time")?.dateTime).toBe(
    "2026-01-04T12:10:00.000Z",
  );
  expect(general.textContent).toContain("Unread: 2");
  expect(general.getAttribute("href")).toBe(
    "/en/social/chats/chat/threads/default",
  );
  const threadSearch = threads.getByRole("button", { name: "Search threads" });
  const settings = threads.getByRole("button", { name: "Chat settings" });
  expect(threadSearch.parentElement).toBe(settings.parentElement);
  expect(threads.queryByRole("searchbox")).toBeNull();
  fireEvent.click(threadSearch);
  fireEvent.change(threads.getByRole("searchbox"), {
    target: { value: "brief" },
  });
  expect(threads.queryByRole("link", { name: /^General/ })).toBeNull();
  expect(
    threads.getByRole("link", { name: /^Brief[.]md/ }).getAttribute("href"),
  ).toBe("/en/social/chats/chat/threads/old-document");
  expect(threads.queryByText("Documents")).toBeNull();
  fireEvent.click(threads.getByRole("button", { name: "Back to chats" }));
  const chats = within(screen.getByRole("navigation", { name: "Chats" }));
  expect(screen.queryByRole("navigation", { name: "Threads" })).toBeNull();
  expect(screen.getByTestId("conversation").textContent).toBe("General");
  fireEvent.click(chats.getByRole("link", { name: /Team chat/ }));
  expect(screen.getAllByRole("navigation", { name: "Threads" })).toHaveLength(
    1,
  );
});

it("opens the exact requested thread and preserves the create-thread action", () => {
  mockCreate.mockImplementationOnce((_input, { onSuccess }) => {
    onSuccess({ id: "ideas" });
  });
  mockThreads.push(documentThread);
  renderChat("old-document");
  expect(screen.getByTestId("conversation").textContent).toBe("Brief.md");
  expect(
    screen
      .getByRole("link", { name: /^Brief[.]md/ })
      .getAttribute("aria-current"),
  ).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: "New thread" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Thread title" }), {
    target: { value: "Ideas" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
  expect(mockCreate).toHaveBeenCalledWith(
    { id: "subject", socialModuleChatId: "chat", data: { title: "Ideas" } },
    expect.objectContaining({ onSuccess: expect.any(Function) }),
  );
  const [href, options] = mockPush.mock.lastCall!;
  expect(href).toBe("/en/social/chats/chat/threads/ideas");
  expect(options?.scroll).toBeUndefined();
});

it("opens the named thread's rename editor from the keyboard and saves its title", async () => {
  const user = userEvent.setup();
  mockThreads.push(documentThread);
  renderChat("old-document");
  await user.click(screen.getByRole("button", { name: "New thread" }));
  const rename = screen.getByRole("button", { name: "Rename thread Brief.md" });
  rename.focus();
  await user.keyboard("{Enter}");
  const input = screen.getByDisplayValue("Brief.md");
  await user.clear(input);
  await user.type(input, "Updated brief");
  await user.click(screen.getByRole("button", { name: "Save" }));

  expect(mockUpdate).toHaveBeenCalledWith(
    {
      id: "subject",
      socialModuleChatId: "chat",
      socialModuleThreadId: "old-document",
      data: { title: "Updated brief" },
    },
    expect.objectContaining({ onSuccess: expect.any(Function) }),
  );
});

it("requires confirmation and exposes pending only on the selected thread's delete button", () => {
  mockThreads.push(documentThread);
  const { rerender } = renderChat("old-document");
  fireEvent.click(screen.getByRole("button", { name: "New thread" }));
  const remove = screen.getByRole<HTMLButtonElement>("button", {
    name: "Delete thread Brief.md",
  });
  fireEvent.click(remove);
  expect(mockDelete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Delete thread" }));
  expect(mockDelete).toHaveBeenCalledWith(
    {
      id: "subject",
      socialModuleChatId: "chat",
      socialModuleThreadId: "old-document",
    },
    expect.objectContaining({ onSuccess: expect.any(Function) }),
  );

  mockDeletePending = true;
  rerender(chatOverview("old-document"));
  expect(remove.getAttribute("aria-busy")).toBe("true");
  expect(remove.disabled).toBe(true);
  const removeOther = screen.getByRole<HTMLButtonElement>("button", {
    name: "Delete thread General",
  });
  expect(removeOther.getAttribute("aria-busy")).toBe("false");
  expect(removeOther.disabled).toBe(false);
  fireEvent.click(removeOther);
  expect(remove.getAttribute("aria-busy")).toBe("true");
});

it("saves task settings and a cover separately, renames primary thread, and manages only unprotected members", async () => {
  const buyer = { ...mockProfile, id: "buyer", slug: "buyer" };
  const visitor = { ...mockProfile, id: "visitor", slug: "visitor" };
  const taskChat = {
    ...mockChat,
    variant: "default",
    canManageChat: true,
    mainThreadId: defaultThread.id,
    protectedProfileIds: ["buyer"],
    participants: [mockProfile, buyer, visitor],
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = (coverFileId: string | null) => (
    <QueryClientProvider client={client}>
      <Component
        isServer={false}
        variant="social-module-profile-chat-overview-default"
        data={mockSubject}
        language="en"
        socialModuleProfile={mockProfile}
        socialModuleChatId={taskChat.id}
        socialModuleChat={{ ...taskChat, coverFileId }}
        socialModuleThreadId={defaultThread.id}
        defaultThreadId={defaultThread.id}
        getThreadHref={(id) => "/task?thread=" + id}
      />
    </QueryClientProvider>
  );
  mockThreads.push(documentThread);
  mockUpdateCover.mockResolvedValue({});
  mockReadCover.mockResolvedValue(new Blob(["picture"], { type: "image/png" }));
  const create = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
  const revoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:cover"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
  try {
    const { rerender, unmount } = render(tree(null));
    fireEvent.click(screen.getByRole("button", { name: "Chat settings" }));
    const settings = within(screen.getByRole("dialog"));
    expect(settings.queryByRole("button", { name: "Delete chat" })).toBeNull();
    fireEvent.change(settings.getByLabelText("title.en"), {
      target: { value: "New chat title" },
    });
    const image = new File(["image"], "cover.png", { type: "image/png" });
    fireEvent.change(settings.getByLabelText("Choose chat cover"), {
      target: { files: [image] },
    });
    await waitFor(() =>
      expect(mockUpdateCover).toHaveBeenCalledWith({
        id: "subject",
        socialModuleChatId: "chat",
        socialModuleProfileId: "profile",
        data: { coverFile: image },
      }),
    );
    expect(mockUpdateChat).not.toHaveBeenCalled();
    rerender(tree("file-1"));
    await waitFor(() =>
      expect(
        settings.getByRole("img", { name: "Chat cover" }).getAttribute("src"),
      ).toBe("blob:cover"),
    );
    expect(mockReadCover).toHaveBeenCalledWith({
      id: "subject",
      socialModuleProfileId: "profile",
      socialModuleChatId: "chat",
      options: { signal: expect.any(AbortSignal) },
    });
    fireEvent.click(settings.getByRole("button", { name: "Remove" }));
    expect(mockUpdateCover).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { removeCover: true } }),
    );
    fireEvent.click(settings.getByRole("button", { name: "Save" }));
    expect(mockUpdateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: expect.objectContaining({ en: "New chat title" }),
          description: expect.anything(),
        },
      }),
      expect.anything(),
    );
    fireEvent.click(settings.getByRole("button", { name: /Threads/ }));
    expect(
      settings.getByRole("button", { name: "Rename thread General" }),
    ).toBeTruthy();
    expect(
      settings.queryByRole("button", { name: "Delete thread General" }),
    ).toBeNull();
    expect(
      settings.getByRole("button", { name: "Delete thread Brief.md" }),
    ).toBeTruthy();
    fireEvent.click(settings.getByRole("button", { name: /Members/ }));
    expect(
      settings.queryByRole("link", { name: /Employee profile/ }),
    ).toBeNull();
    const openParticipant = jest.fn();
    const messageView = mockThreadView.mock.lastCall[0];
    messageView.profileOpenRef.current = openParticipant;
    fireEvent.click(
      settings.getByRole("button", { name: "Open buyer profile" }),
    );
    expect(openParticipant).toHaveBeenCalledWith(
      buyer,
      expect.any(HTMLButtonElement),
      undefined,
      "buyer",
    );
    fireEvent.change(settings.getByPlaceholderText("Search users..."), {
      target: { value: "Le" },
    });
    fireEvent.click(
      await settings.findByRole("button", { name: "Add member" }),
    );
    expect(mockAddProfile).toHaveBeenCalledWith(
      {
        id: "subject",
        socialModuleChatId: "chat",
        data: { socialModuleProfileId: "candidate" },
      },
      expect.anything(),
    );
    fireEvent.change(settings.getByPlaceholderText("Search users..."), {
      target: { value: "" },
    });
    expect(
      settings.getAllByRole("button", { name: "Remove member" }),
    ).toHaveLength(1);
    fireEvent.click(settings.getByRole("button", { name: "Remove member" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(mockRemoveProfile).toHaveBeenCalledWith(
      {
        id: "subject",
        socialModuleChatId: "chat",
        socialModuleProfileId: "visitor",
      },
      expect.anything(),
    );
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:cover");
  } finally {
    client.clear();
    if (create) Object.defineProperty(URL, "createObjectURL", create);
    else Reflect.deleteProperty(URL, "createObjectURL");
    if (revoke) Object.defineProperty(URL, "revokeObjectURL", revoke);
    else Reflect.deleteProperty(URL, "revokeObjectURL");
  }
});
