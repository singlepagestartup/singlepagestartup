/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
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
  expect(screen.queryByRole("button", { name: /right sidebar/i })).toBeNull();
  expect(screen.getByText("Conversation")).toBeTruthy();
  expect(screen.getByText("Message form")).toBeTruthy();
});

it("shows the thread title without a separate thread label", () => {
  render(
    <Component
      {...({
        data: { id: "topic", title: "Заказ на обложку" },
        language: "ru",
        messages: null,
        composer: null,
      } as any)}
    />,
  );

  const title = screen.getByRole("heading", { name: "Заказ на обложку" });
  expect(title.closest("header")).toBeTruthy();
  expect(screen.queryByText("Обсуждение")).toBeNull();
});

it("lets the desktop composer use the sidebar width when the sidebar is closed", () => {
  const matchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  try {
    const conversation = (message: string, hasFiles: boolean) => (
      <Component
        {...({
          data: { id: "topic", title: "Pickup and booking checks" },
          messages: <p>{message}</p>,
          composer: <textarea aria-label="Message" />,
          context: hasFiles ? <p>Order preview</p> : undefined,
        } as any)}
      />
    );
    const view = render(conversation("Conversation", false));
    const composer = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(composer, { target: { value: "Draft" } });
    view.rerender(conversation("Incoming attachment", true));
    expect(screen.queryByRole("complementary")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Show right sidebar",
        expanded: false,
      }),
    );
    view.rerender(conversation("Next reply", true));
    const sidebar = screen.getByRole("complementary", { name: "Context" });
    expect(screen.queryByRole("heading", { name: "Context" })).toBeNull();
    expect(sidebar.parentElement?.classList).toContain(
      "xl:grid-cols-[minmax(0,1fr)_360px]",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide right sidebar",
        expanded: true,
      }),
    );

    view.rerender(conversation("Another reply", true));
    expect(screen.getByRole("textbox", { name: "Message" })).toBe(composer);
    expect(sidebar.hidden).toBe(true);
    expect(sidebar.parentElement?.classList).not.toContain(
      "xl:grid-cols-[minmax(0,1fr)_360px]",
    );
    expect(
      (screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement)
        .value,
    ).toBe("Draft");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show right sidebar",
        expanded: false,
      }),
    );
    expect(sidebar.hidden).toBe(false);
    expect(screen.getByText("Order preview")).toBeTruthy();
  } finally {
    window.matchMedia = matchMedia;
  }
});

it("keeps messages visible by default on mobile and switches to the sidebar on request", () => {
  const matchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  try {
    render(
      <Component
        {...({
          data: { id: "topic", title: "Pickup and booking checks" },
          messages: <p>Conversation</p>,
          composer: null,
          context: <p>Order preview</p>,
        } as any)}
      />,
    );

    expect(screen.queryByRole("complementary", { name: "Context" })).toBeNull();
    const messages = screen
      .getByText("Conversation")
      .closest("[data-ai-chat-messages]")?.parentElement;
    expect(messages?.classList).toContain("flex");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show right sidebar",
        expanded: false,
      }),
    );

    expect(screen.getByRole("complementary", { name: "Context" })).toBeTruthy();
    expect(messages?.classList).toContain("hidden");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide right sidebar",
        expanded: true,
      }),
    );
    expect(messages?.classList).toContain("flex");
  } finally {
    window.matchMedia = matchMedia;
  }
});
