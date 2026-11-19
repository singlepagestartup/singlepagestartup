/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";

it("fills the available width when a thread has no context", () => {
  render(
    <Component
      {...({
        data: { id: "topic", title: "Pickup and booking checks" },
        messages: <p>Conversation</p>,
        composer: <p>Message form</p>,
      } as any)}
    />,
  );
  expect(screen.queryByRole("button", { name: "Context" })).toBeNull();
  expect(screen.getByText("Conversation")).toBeTruthy();
  expect(screen.getByText("Message form")).toBeTruthy();
});

it("renders responsive context when a thread provides a sidebar", () => {
  render(
    <Component
      {...({
        data: { id: "topic", title: "Pickup and booking checks" },
        messages: null,
        composer: null,
        context: <p>Order preview</p>,
      } as any)}
    />,
  );
  expect(screen.getByRole("button", { name: "Context" })).toBeTruthy();
  expect(screen.getByRole("complementary", { name: "Context" })).toBeTruthy();
  expect(screen.getByText("Order preview")).toBeTruthy();
});
