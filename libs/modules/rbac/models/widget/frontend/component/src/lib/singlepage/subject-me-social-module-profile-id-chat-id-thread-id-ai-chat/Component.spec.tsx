import { Children, isValidElement, type ReactElement } from "react";
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("client-only", () => ({}), { virtual: true });

const mockRecord = { id: "workspace-widget", variant: "workspace" };
const mockFindById = jest.fn().mockResolvedValue(mockRecord);
jest.mock("@sps/rbac/models/widget/sdk/server", () => ({
  api: { findById: (...args: unknown[]) => mockFindById(...args) },
}));
jest.mock("@sps/rbac/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => children,
  api: { findById: jest.fn() },
}));
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
jest.mock("./ClientComponent", () => ({ Component: () => null }));
jest.mock("../subject-me-profile-settings/ClientComponent", () => ({
  Component: () => null,
}));

import { Component as Workspace } from "./index";
import { Component as Settings } from "../subject-me-profile-settings/index";
import { Component as ServerReader } from "@sps/shared-frontend-components/singlepage/default/server";

function findServerReader(node: unknown): ReactElement<any> | undefined {
  if (!isValidElement(node)) return;
  if (node.type === ServerReader) return node as ReactElement<any>;
  const element = node as ReactElement<{ children?: unknown }>;
  for (const child of Children.toArray(element.props.children as any)) {
    const found = findServerReader(child);
    if (found) return found;
  }
}

it.each([Workspace, Settings])(
  "keeps SDK bindings inside the public saved-record reader before the client boundary",
  async (Variant) => {
    mockFindById.mockClear();
    const publicElement = Variant({
      isServer: true,
      variant: "workspace",
      data: { id: mockRecord.id },
      language: "en",
      profileId: "profile",
      chatId: "chat",
      threadId: "thread",
    } as any);
    const readerTree = (publicElement.type as any)(publicElement.props);
    const reader = findServerReader(readerTree)!;
    expect(reader).toBeDefined();
    const loaded = await ServerReader(reader.props);
    expect(mockFindById).toHaveBeenCalledWith({ id: mockRecord.id });
    const clientElement = (loaded.type as any)(loaded.props);
    expect(clientElement.props.data).toBe(mockRecord);
    expect(clientElement.props.isServer).toBe(false);
    for (const name of [
      "api",
      "clientApi",
      "serverApi",
      "Provider",
      "Component",
      "Skeleton",
    ])
      expect(clientElement.props).not.toHaveProperty(name);
    expect(
      Object.values(clientElement.props).some(
        (value) => typeof value === "function",
      ),
    ).toBe(false);
  },
);
