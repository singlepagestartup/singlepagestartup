/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";
const mockBoundary = jest.fn();
jest.mock("./ClientComponent", () => ({
  Component: (props: any) => {
    mockBoundary(props);
    return (
      <>
        {props.logotype}
        {props.content}
        {props.children}
      </>
    );
  },
}));
jest.mock("./assets/content", () => ({
  Component: () => <a href="/saved">Saved navigation</a>,
}));
jest.mock("./assets/logotype", () => ({
  Component: () => <span>Saved logo</span>,
}));
it("passes rendered slots and display data across the client boundary without reader bindings", () => {
  const binding = () => null;
  render(
    <Component
      {...({
        data: { id: "navigation" },
        variant: "navbar-default",
        language: "en",
        isServer: true,
        api: binding,
        Provider: binding,
        Component: binding,
        clientApi: binding,
        serverApi: binding,
        apiProps: { options: { headers: { authorization: "server-only" } } },
        children: <p>Account slot</p>,
      } as any)}
    />,
  );
  expect(screen.getByText("Account slot")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Saved navigation" }).getAttribute("href"),
  ).toBe("/saved");
  const props = mockBoundary.mock.calls.at(-1)?.[0];
  for (const key of [
    "api",
    "Provider",
    "Component",
    "clientApi",
    "serverApi",
    "apiProps",
  ])
    expect(props[key]).toBeUndefined();
});
