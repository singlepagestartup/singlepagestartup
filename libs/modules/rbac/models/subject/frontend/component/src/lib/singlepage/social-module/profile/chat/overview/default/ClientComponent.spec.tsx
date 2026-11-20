/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithoutRef } from "react";
import { Component as ChatList } from "../../list/default/ClientComponent";
import { Component } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
let mockDeletePending = false;
const mockRefetch = jest.fn();
const mockSubject = { id: "subject" } as IComponentPropsExtended["data"];
const mockProfile = {
  id: "profile",
} as IComponentPropsExtended["socialModuleProfile"];
const mockChat = {
  id: "chat",
  title: { en: "Team chat", ru: "Команда" },
  variant: "ai-chat",
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
  FormField: () => null,
}));

jest.mock("@sps/social/models/profile/frontend/component", () => ({
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
    return <p data-testid="conversation">{props.socialModuleThread?.title}</p>;
  },
}));

jest.mock("@sps/rbac/models/subject/sdk/model", () => ({
  route: "/subjects",
}));

jest.mock("@sps/rbac/models/subject/sdk/client", () => {
  const empty = () => ({});
  return {
    api: {
      socialModuleChatFindByIdUpdate: empty,
      socialModuleChatFindByIdThreadCreate: () => ({ mutate: mockCreate }),
      socialModuleChatFindByIdThreadUpdate: () => ({ mutate: mockUpdate }),
      socialModuleChatFindByIdThreadDelete: () => ({
        mutate: mockDelete,
        isPending: mockDeletePending,
      }),
      socialModuleChatFindByIdProfileCreate: empty,
      socialModuleChatFindByIdProfileDelete: empty,
      socialModuleProfileFindByIdChatFindByIdDelete: empty,
      socialModuleChatFindByIdProfileSearch: empty,
      socialModuleChatFindByIdAgentSubjectSearch: empty,
      socialModuleChatFindByIdThreadFind: () => ({
        data: mockThreads,
        refetch: mockRefetch,
      }),
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
