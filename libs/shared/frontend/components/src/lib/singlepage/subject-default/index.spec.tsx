/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
import { Component } from "./index";
const mockSubject = { id: "current", title: "Current Subject" };
const mockUpdateCookies = jest.fn();
jest.mock("react-cookie", () => ({
  useCookies: () => [
    { "rbac.subject.jwt": "session" },
    null,
    null,
    mockUpdateCookies,
  ],
}));
jest.mock("react-jwt", () => ({
  useJwt: () => ({ decodedToken: { subject: mockSubject } }),
}));

const bindings = {
  Provider: jest.fn(() => null),
  clientApi: { findById: jest.fn(), find: jest.fn() },
  serverApi: { findById: jest.fn(), find: jest.fn() },
};

it.each([true, false])(
  "renders current parent query results with no second request/Provider (isServer=%s)",
  (isServer) => {
    const view = jest.fn((props: any) => <div>{props.data.title}</div>);
    const props = {
      ...bindings,
      Component: view,
      isServer,
      variant: "test",
      dataSource: "props" as const,
      data: { id: "source", title: "Before" },
      api: bindings.serverApi,
      Skeleton: <span>Loading</span>,
    };
    const { rerender } = render(createElement(Component as any, props));
    expect(screen.getByText("Before")).toBeTruthy();
    rerender(
      createElement(Component as any, {
        ...props,
        data: { id: "source", title: "After parent refetch" },
      }),
    );
    expect(screen.getByText("After parent refetch")).toBeTruthy();
    const passed = view.mock.calls.at(-1)![0];
    for (const key of [
      "api",
      "clientApi",
      "serverApi",
      "Provider",
      "Component",
      "Skeleton",
    ])
      expect(passed).not.toHaveProperty(key);
    expect(bindings.Provider).not.toHaveBeenCalled();
    expect(bindings.clientApi.findById).not.toHaveBeenCalled();
    expect(bindings.serverApi.findById).not.toHaveBeenCalled();
  },
);

it.each(["current", "other"])(
  "keeps reader bindings out of a client Subject view for %s and settles without another render",
  (id) => {
    const data = { id, title: "Fetched Subject" };
    const view = jest.fn((props: any) => <p>{props.data.title}</p>);
    const clientApi = {
      findById: jest.fn(() => ({ data, isLoading: false, refetch: jest.fn() })),
    };
    const serverApi = {
      findById: jest.fn(() => {
        throw new Error("Server read from client");
      }),
    };
    render(
      createElement(Component as any, {
        isServer: false,
        variant: "test",
        data: { id },
        Component: view,
        Provider: ({ children }: any) => children,
        clientApi,
        serverApi,
        Skeleton: <span>Loading</span>,
      }),
    );
    expect(view).toHaveBeenCalledTimes(1);
    const input = view.mock.calls[0][0];
    expect(input.isServer).toBe(false);
    for (const key of [
      "api",
      "clientApi",
      "serverApi",
      "Provider",
      "Component",
      "Skeleton",
    ])
      expect(input).not.toHaveProperty(key);
    expect(serverApi.findById).not.toHaveBeenCalled();
  },
);
