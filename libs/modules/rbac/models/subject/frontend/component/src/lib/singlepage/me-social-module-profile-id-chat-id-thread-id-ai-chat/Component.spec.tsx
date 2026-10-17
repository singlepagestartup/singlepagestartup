import { Children, isValidElement, type ReactElement } from "react";
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("client-only", () => ({}), { virtual: true });
const subject = { id: "owner", slug: "owner" };
const threads = [{ id: "thread", title: "Discussion" }];
const findSubject = jest.fn().mockResolvedValue(subject);
const findThreads = jest.fn().mockResolvedValue(threads);
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    findById: (...args: unknown[]) => findSubject(...args),
    socialModuleChatFindByIdThreadFind: (...args: unknown[]) =>
      findThreads(...args),
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: {},
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/social/models/thread/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
import { Component } from "./index";
import { Component as SharedServer } from "@sps/shared-frontend-components/singlepage/subject-default/server";

function findReader(node: unknown): ReactElement<any> | undefined {
  if (!isValidElement(node)) return;
  if (node.type === SharedServer) return node as ReactElement<any>;
  for (const child of Children.toArray(
    (node as ReactElement<any>).props.children,
  )) {
    const reader = findReader(child);
    if (reader) return reader;
  }
}

it("loads Subject once and passes scoped Thread results through the public reader without leaking SDK bindings", async () => {
  const element = Component({
    isServer: true,
    variant: "me-social-module-profile-id-chat-id-thread-id-ai-chat",
    data: subject,
    project: {
      profile: { id: "assistant" },
      chat: { id: "chat" },
      thread: { id: "thread" },
    },
  } as any);
  const parentTree = (element.type as any)(element.props);
  const sharedReader = findReader(parentTree)!;
  const localReader = (await SharedServer(
    sharedReader.props,
  )) as ReactElement<any>;
  const view = (await (localReader.type as any)(
    localReader.props,
  )) as ReactElement<any>;
  const clientView = (view.type as any)(view.props) as ReactElement<any>;
  expect(findSubject).toHaveBeenCalledTimes(1);
  expect(findThreads).toHaveBeenCalledWith(
    expect.objectContaining({ id: "owner", socialModuleChatId: "chat" }),
  );
  expect(clientView.props.data).toEqual(subject);
  expect(clientView.props.threads).toEqual(threads);
  expect(clientView.props.threadsLoading).toBe(false);
  for (const key of [
    "api",
    "clientApi",
    "serverApi",
    "Provider",
    "Component",
    "Skeleton",
  ])
    expect(clientView.props).not.toHaveProperty(key);
});
