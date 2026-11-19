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

it("lets the desktop composer use the sidebar width when the sidebar is closed", () => {
  const matchMedia = window.matchMedia;
  window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  try {
    render(
      <Component
        {...({
          data: { id: "topic", title: "Pickup and booking checks" },
          messages: <p>Conversation</p>,
          composer: <textarea aria-label="Message" />,
          context: <p>Order preview</p>,
        } as any)}
      />,
    );

    const sidebar = screen.getByRole("complementary", { name: "Context" });
    expect(screen.queryByRole("heading", { name: "Context" })).toBeNull();
    expect(sidebar.parentElement?.classList).toContain(
      "xl:grid-cols-[minmax(0,1fr)_360px]",
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Draft" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide right sidebar",
        expanded: true,
      }),
    );

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

    const sidebar = screen.getByRole("complementary", { name: "Context" });
    const messages = screen
      .getByText("Conversation")
      .closest("[data-ai-chat-messages]")?.parentElement;
    expect(sidebar.classList).toContain("hidden");
    expect(messages?.classList).toContain("flex");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show right sidebar",
        expanded: false,
      }),
    );

    expect(sidebar.classList).toContain("block");
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
