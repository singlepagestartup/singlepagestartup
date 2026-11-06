import { renderToStaticMarkup } from "react-dom/server";
let mockProfiles: any[] = [];
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
import { Component } from "./Component";
beforeEach(() => {
  jest.clearAllMocks();
  mockProfiles = [
    { id: "ai", variant: "artificial-intelligence" },
    { id: "personal", variant: "default" },
  ];
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
