import { renderToStaticMarkup } from "react-dom/server";
let mockProfiles: any[] = [];
let mockAuthenticated = false;
let mockWork: { chatId: string } | undefined;
const mockPrivateThread = jest.fn();
const mockGuestThreads = jest.fn();
const mockRead = jest.fn();
const mockOverview = jest.fn();
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "authentication-me-default")
      return props.children({ data: { id: "subject" } });
    if (props.variant === "social-module-profile-find") {
      mockRead(props.apiProps);
      return props.children({ data: mockProfiles });
    }
    if (props.variant === "social-module-profile-chat-overview-default") {
      mockOverview(props);
      return <span>Authorized chat</span>;
    }
    throw Error("Unexpected reader: " + props.variant);
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    socialModuleChatFindByIdThreadFind: (input: unknown) =>
      mockGuestThreads(input),
    customerWorkForThread: (input: unknown) => {
      mockPrivateThread(input);
      return { data: mockWork, isPending: false };
    },
  },
}));
jest.mock("../../../../../authentication/me-default/client", () => ({
  __esModule: true,
  default: ({
    children,
  }: {
    children: (session: {
      data: { id: string };
      authenticated: boolean;
    }) => React.ReactNode;
  }) =>
    children({
      data: { id: "verified-guest" },
      authenticated: mockAuthenticated,
    }),
}));
import { Component } from "./Component";
import Client from "./client";
beforeEach(() => {
  jest.clearAllMocks();
  mockWork = undefined;
  mockGuestThreads.mockReturnValue({ data: [], isPending: false });
  mockAuthenticated = false;
  mockProfiles = [
    { id: "ai", variant: "artificial-intelligence" },
    { id: "personal", variant: "default" },
  ];
});

it("opens the exact verified guest thread and declines mismatched chat ids", () => {
  mockWork = { chatId: "own-chat" };
  function thread(chatId: string) {
    return renderToStaticMarkup(
      <Client
        variant="me-social-module-profile-chat-overview-default"
        isServer={false}
        language="en"
        socialModuleChatId={chatId}
        socialModuleThreadId="own-thread"
      />,
    );
  }
  expect(thread("own-chat")).toContain("Authorized chat");
  expect(mockPrivateThread).toHaveBeenCalledWith({
    id: "verified-guest",
    threadId: "own-thread",
  });
  expect(thread("another-chat")).not.toContain("Authorized chat");
  expect(mockOverview).toHaveBeenCalledTimes(1);
});
it("uses the Subject profile reader scoped to this chat and renders one preferred identity", () => {
  const html = renderToStaticMarkup(
    <Component
      data={{ id: "subject" } as any}
      variant="me-social-module-profile-chat-overview-default"
      isServer={false}
      language="en"
      socialModuleChatId="chat"
      socialModuleThreadId="thread"
    />,
  );
  expect(mockRead).toHaveBeenCalledWith({
    params: { socialModuleChatId: "chat" },
  });
  expect(mockOverview).toHaveBeenCalledTimes(1);
  expect(mockOverview.mock.calls[0][0]).toMatchObject({
    socialModuleProfile: { id: "personal" },
    socialModuleChatId: "chat",
    socialModuleThreadId: "thread",
  });
  expect(html).toContain("Authorized chat");
});
it("never starts a detail read when no owned profile can access the chat", () => {
  mockProfiles = [];
  expect(
    renderToStaticMarkup(
      <Component
        data={{ id: "subject" } as any}
        variant="me-social-module-profile-chat-overview-default"
        isServer={false}
        language="en"
        socialModuleChatId="chat"
      />,
    ),
  ).toContain("Chat unavailable");
  expect(mockOverview).not.toHaveBeenCalled();
});

it("opens a signed-in member's Social thread without querying for a private order", () => {
  mockAuthenticated = true;
  const html = renderToStaticMarkup(
    <Client
      variant="me-social-module-profile-chat-overview-default"
      isServer={false}
      language="ru"
      socialModuleChatId="regular-chat"
      socialModuleThreadId="regular-thread"
    />,
  );
  expect(html).toContain("Authorized chat");
  expect(mockPrivateThread).not.toHaveBeenCalled();
});

it("resolves a guest order from its bare chat URL before verifying the customer", () => {
  mockGuestThreads.mockReturnValue({
    data: [{ id: "order-thread", hasCustomerWork: true }],
  });
  mockWork = { chatId: "order-chat" };
  const html = renderToStaticMarkup(
    <Client
      isServer={false}
      variant="me-social-module-profile-chat-overview-default"
      language="en"
      socialModuleChatId="order-chat"
    />,
  );
  expect(mockPrivateThread).toHaveBeenCalledWith({
    id: "verified-guest",
    threadId: "order-thread",
  });
  expect(html).toContain("Authorized chat");
});
