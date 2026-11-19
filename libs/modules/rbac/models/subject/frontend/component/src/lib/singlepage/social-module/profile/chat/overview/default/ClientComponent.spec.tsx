/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { Component as ChatList } from "../../list/default/ClientComponent";
import { Component } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRouter = { replace: mockReplace, push: mockPush };
const mockCreate = jest.fn();
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
  mockChat,
  { ...mockChat, id: "other-chat", title: "Support" },
];
const defaultThread = {
  id: "default",
  title: "General",
  createdAt: "2026-01-01",
  variant: "default",
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
  ChatWorkspace: jest.requireActual(
    "../../../../../../../../../../../../../../shared/ui/adapter/src/lib/chat-workspace",
  ).ChatWorkspace,
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
      socialModuleChatFindByIdThreadUpdate: empty,
      socialModuleChatFindByIdThreadDelete: empty,
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

function renderChat(socialModuleThreadId?: string) {
  return render(
    <Component
      isServer={false}
      variant="social-module-profile-chat-overview-default"
      data={mockSubject}
      language="en"
      socialModuleProfile={mockProfile}
      socialModuleChatId={mockChat.id}
      socialModuleChat={mockChat}
      socialModuleThreadId={socialModuleThreadId}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockThreads = [defaultThread];
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
  const search = sidebar.getByRole("searchbox", { name: "Search chats" });
  fireEvent.change(search, { target: { value: "missing" } });
  expect(sidebar.getByRole("status").textContent).toBe("No matching chats");
  fireEvent.change(search, { target: { value: "" } });
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
  expect(
    threads.getByRole("link", { name: "General" }).getAttribute("href"),
  ).toBe("/en/social/chats/chat/threads/default");
  expect(
    threads.getByRole("link", { name: "Brief.md" }).getAttribute("href"),
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
    screen.getByRole("link", { name: "Brief.md" }).getAttribute("aria-current"),
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
