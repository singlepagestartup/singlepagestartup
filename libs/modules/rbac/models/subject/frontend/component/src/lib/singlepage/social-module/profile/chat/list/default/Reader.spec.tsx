/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Component as ChatList } from ".";
import MeServer from "../../../../../me/social-module/profile/chat/list/default/server";
import type { IComponentProps } from "./interface";

const mockChats = jest.fn();
const mockServerRead = jest.fn();
const mockProfile = jest.fn();
const mockPermission = jest.fn();
let mockCanCreate = false;
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    socialModuleProfileFindByIdChatFind: (...args: unknown[]) =>
      mockServerRead(...args),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
  api: {
    socialModuleProfileFindByIdChatFind: (...args: unknown[]) =>
      mockChats(...args),
  },
}));
jest.mock("../../../../../authentication/me-default/client", () => ({
  __esModule: true,
  default: ({ children }: any) =>
    children({ data: { id: "browser-subject" }, authenticated: true }),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    switch (props.variant) {
      case "social-module-profile-find":
        mockProfile(props.data.id);
        return props.children({
          data: [{ id: "personal", variant: "default" }],
        });
      case "social-module-profile-chat-list-default": {
        const Client = jest.requireActual("./client").default;
        return <Client {...props} />;
      }
      case "authentication-is-authorized-wrapper-default":
        mockPermission(props.apiProps);
        return mockCanCreate ? props.children : null;
      default:
        throw Error("Unexpected reader: " + props.variant);
    }
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCanCreate = false;
  mockChats.mockReturnValue({ data: [] });
});

it("lets the browser resolve the active subject and load its inbox from a server composition", async () => {
  const view = await MeServer({
    isServer: true,
    variant: "me-social-module-profile-chat-list-default",
    language: "en",
    apiProps: {
      options: { headers: { Authorization: "server credential" }, next: {} },
    },
  });
  expect(view.props).not.toHaveProperty("apiProps");
  render(view);
  expect(mockServerRead).not.toHaveBeenCalled();
  expect(mockProfile).toHaveBeenCalledWith("browser-subject");
  expect(mockChats).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "browser-subject",
      socialModuleProfileId: "personal",
    }),
  );
  expect(mockChats.mock.calls[0][0].reactQueryOptions).not.toHaveProperty(
    "initialData",
  );
});

it("checks the active subject's create route before showing the new chat button", () => {
  const props = {
    isServer: true,
    variant: "social-module-profile-chat-list-default",
    language: "en",
    compact: true,
    data: { id: "selected-subject" },
    socialModuleProfile: { id: "profile" },
  } as IComponentProps;
  const view = render(<ChatList {...props} />);
  expect(mockServerRead).not.toHaveBeenCalled();
  expect(mockPermission.mock.calls[0][0].params.permission).toEqual({
    method: "POST",
    route: "/api/rbac/subjects/selected-subject/social-module/chats",
  });
  expect(
    mockPermission.mock.calls[0][0].reactQueryOptions.queryKey[1],
  ).toContain("selected-subject");
  expect(screen.queryByRole("button", { name: "New chat" })).toBeNull();
  expect(screen.getByText("No chats yet")).toBeTruthy();
  mockCanCreate = true;
  view.rerender(<ChatList {...props} />);
  expect(screen.getByRole("button", { name: "New chat" })).toBeTruthy();
});
