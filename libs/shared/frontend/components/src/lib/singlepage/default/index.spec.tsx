/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
import { Component } from "./index";
import { Component as Find } from "../find";

const bindings = {
  Provider: jest.fn(() => null),
  clientApi: { findById: jest.fn(), find: jest.fn() },
  serverApi: { findById: jest.fn(), find: jest.fn() },
};

it("renders the explicitly selected view even when the loaded record has variant hidden", () => {
  const view = jest.fn((props: any) => <div>{props.data.title}</div>);
  render(
    createElement(Component as any, {
      ...bindings,
      Component: view,
      isServer: false,
      variant: "default",
      dataSource: "props",
      data: { id: "one", variant: "hidden", title: "Selected view" },
    }),
  );
  expect(screen.getByText("Selected view")).toBeTruthy();
});

it("passes every supplied record to the collection renderer regardless of variant", () => {
  const data = [
    { id: "one", variant: "hidden" },
    { id: "two", variant: "default" },
  ];
  const children = jest.fn(() => null);
  render(
    createElement(Find as any, {
      ...bindings,
      isServer: false,
      variant: "find",
      dataSource: "props",
      data,
      children,
    }),
  );
  expect(children).toHaveBeenCalledWith({ data });
});

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

it("renders collection changes from its parent without freezing initial results", () => {
  const children = jest.fn(({ data }: any) => (
    <div>{data.map((item: any) => item.title).join(",")}</div>
  ));
  const props = {
    ...bindings,
    variant: "find",
    isServer: false,
    dataSource: "props" as const,
    data: [{ id: "one", title: "Before" }],
    children,
  };
  const { rerender } = render(createElement(Find as any, props));
  expect(screen.getByText("Before")).toBeTruthy();
  rerender(
    createElement(Find as any, {
      ...props,
      data: [{ id: "two", title: "After" }],
    }),
  );
  expect(screen.getByText("After")).toBeTruthy();
  expect(children.mock.calls.at(-1)![0]).toEqual({
    data: [{ id: "two", title: "After" }],
  });
  expect(bindings.clientApi.find).not.toHaveBeenCalled();
});

it("uses the supplied Skeleton node while the client SDK query is pending", () => {
  const read = jest.fn(() => ({
    isLoading: true,
    data: undefined as { id: string; title: string } | undefined,
  }));
  const props = {
    ...bindings,
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    clientApi: { findById: read },
    Component: (props: { data: { id: string; title: string } }) => (
      <div>{props.data.title}</div>
    ),
    isServer: false,
    variant: "test",
    data: { id: "record", title: "Snapshot" },
    Skeleton: <div role="status">Record skeleton</div>,
  };
  const { rerender } = render(createElement(Component as any, props));
  expect(screen.getByRole("status").textContent).toBe("Record skeleton");
  expect(screen.queryByText("Snapshot")).toBeNull();
  read.mockReturnValue({
    isLoading: false,
    data: { id: "record", title: "Loaded" },
  });
  rerender(createElement(Component as any, props));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("Loaded")).toBeTruthy();
});

it("strips all reader bindings after the server SDK read", async () => {
  const { Component: ServerReader } = await import("./server");
  const data = { id: "record", variant: "hidden", title: "Loaded" };
  const element = await ServerReader({
    ...bindings,
    api: { findById: jest.fn().mockResolvedValue(data) },
    Component: () => null,
    Skeleton: () => null,
    isServer: true,
    variant: "test",
    data: { id: "record" },
  } as any);
  expect(element!.props.data).toBe(data);
  for (const key of [
    "api",
    "clientApi",
    "serverApi",
    "Provider",
    "Component",
    "Skeleton",
  ])
    expect(element!.props).not.toHaveProperty(key);
});
