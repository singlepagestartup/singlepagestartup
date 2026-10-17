/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/website-builder/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: {
    findById: ({ id }: any) => ({
      data: { id, variant: "landing-ai-chat" },
      isLoading: false,
    }),
  },
}));
jest.mock("@sps/website-builder/models/widget/sdk/server", () => ({ api: {} }));
jest.mock("@sps/social/models/chat/frontend/component", () => {
  throw new Error("Landing must not load a Social Chat");
});
import { Component as Widget } from "@sps/website-builder/models/widget/frontend/component";
it("runs the complete local walkthrough without a Social record or network and isolates visitors", () => {
  const previous = globalThis.fetch;
  const network = jest.fn(() => {
    throw new Error("Walkthrough network is forbidden");
  });
  globalThis.fetch = network as any;
  try {
    const { container } = render(
      <>
        <Widget
          isServer={false}
          variant="landing-ai-chat"
          data={{ id: "landing-a" } as any}
        />
        <Widget
          isServer={false}
          variant="landing-ai-chat"
          data={{ id: "landing-b" } as any}
        />
      </>,
    );
    const demos = container.querySelectorAll(
      '[data-variant="landing-ai-chat-demo"]',
    );
    expect(demos).toHaveLength(2);
    const first = within(demos[0] as HTMLElement);
    const second = within(demos[1] as HTMLElement);
    fireEvent.click(first.getByRole("button", { name: "Check materials" }));
    expect(second.queryByLabelText("Who is the workshop for?")).toBeNull();
    fireEvent.change(first.getByLabelText("Who is the workshop for?"), {
      target: { value: "First-time founders" },
    });
    fireEvent.click(first.getByRole("button", { name: "Send answer" }));
    const editor = first.getByRole("textbox", {
      name: "Edit document: Products",
    }) as HTMLTextAreaElement;
    expect(editor.value).toContain("First-time founders");
    fireEvent.change(editor, { target: { value: "My edited draft" } });
    expect(editor.value).toBe("My edited draft");
    fireEvent.click(
      first.getByRole("button", { name: "Open project workspace" }),
    );
    fireEvent.change(first.getByLabelText("Topic name"), {
      target: { value: "Local topic" },
    });
    fireEvent.click(first.getByRole("button", { name: "Create topic" }));
    expect(first.getByRole("heading", { name: "Local topic" })).toBeTruthy();
    fireEvent.change(first.getByLabelText("Message in this topic"), {
      target: { value: "Local message" },
    });
    fireEvent.click(first.getByRole("button", { name: "Send message" }));
    expect(first.getByText("Local message")).toBeTruthy();
    fireEvent.click(first.getByRole("button", { name: "Restart walkthrough" }));
    expect(first.getByRole("button", { name: "Check materials" })).toBeTruthy();
    expect(first.queryByText("Local message")).toBeNull();
    expect(network).not.toHaveBeenCalled();
    expect(
      screen
        .getAllByRole("link", { name: /Start with my files/i })[0]
        .getAttribute("href"),
    ).toBe("/en/ai-chat/projects");
  } finally {
    globalThis.fetch = previous;
  }
});
