/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social profile chat message markdown rendering.
 *
 * Given: an AI response contains Markdown lists and compact list headings.
 * When: the chat message row renders the response.
 * Then: list markers, paragraphs, and compact headings remain readable.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component, normalizeChatMessageMarkdown } from "./ClientComponent";

jest.mock(
  "@sps/social/relations/messages-to-file-storage-module-files/frontend/component",
  () => ({
    Component: () => null,
  }),
);

jest.mock(
  "@sps/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar",
  () => ({
    Component: (props: { data: { adminTitle?: string; slug: string } }) => {
      return (
        <span data-testid="profile-avatar">
          {(props.data.adminTitle || props.data.slug).charAt(0)}
        </span>
      );
    },
  }),
);

jest.mock("next/link", () => {
  return {
    __esModule: true,
    default: (props: {
      children: React.ReactNode;
      className?: string;
      href: string;
    }) => {
      return (
        <a className={props.className} href={props.href}>
          {props.children}
        </a>
      );
    },
  };
});

describe("GIVEN: social profile chat message markdown rendering", () => {
  let container: HTMLDivElement;
  let root: Root;
  let writeText: jest.Mock;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  /**
   * BDD Scenario: compact list heading remains separated from body text.
   *
   * Given: the model emits a list item title followed by a soft line break.
   * When: the chat message normalizes Markdown before rendering.
   * Then: the title becomes a dedicated strong heading inside the list item.
   */
  test("When: compact list heading is normalized Then: body text is not glued to it", () => {
    const normalized = normalizeChatMessageMarkdown(
      "1. Суть продукта\nКладовка у дома — это хранение вещей рядом с жильем.",
    );

    expect(normalized).toContain("1. **Суть продукта**\n\n   Кладовка");
  });

  /**
   * BDD Scenario: Markdown list styling survives Tailwind reset.
   *
   * Given: the model response contains numbered Markdown list items.
   * When: the chat message row renders the response.
   * Then: ordered lists have explicit list styling and compact headings are separated.
   */
  test("When: message row renders Markdown Then: lists and compact headings are readable", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          language="ru"
          data={
            {
              id: "profile-1",
              slug: "chat-gpt-1",
              variant: "artificial-intelligence",
              title: {},
              subtitle: {},
              description: {},
              adminTitle: "Chat GPT 1",
            } as any
          }
          message={
            {
              id: "message-1",
              createdAt: new Date("2026-06-17T07:26:00.000Z"),
              updatedAt: new Date("2026-06-17T07:26:00.000Z"),
              description:
                "1. Суть продукта\nКладовка у дома — это хранение вещей рядом с жильем.",
              interaction: {},
            } as any
          }
        />,
      );
    });

    const orderedList = container.querySelector("ol");
    const strong = container.querySelector("strong");

    expect(orderedList?.className).toContain("list-decimal");
    expect(strong?.textContent).toBe("Суть продукта");
    expect(container.textContent).toContain("Chat GPT 1");
    expect(container.textContent).not.toContain("chat-gpt-1");
    expect(container.textContent).toContain(
      "Кладовка у дома — это хранение вещей рядом с жильем.",
    );
  });

  /**
   * BDD Scenario: long message keeps avatar aligned to the top.
   *
   * Given: a long AI response is rendered in the message timeline.
   * When: the profile avatar is clickable.
   * Then: the avatar trigger is sticky and does not stretch to the row height.
   */
  test("When: message row renders a clickable profile avatar Then: avatar stays top aligned", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          language="ru"
          onProfileOpen={jest.fn()}
          data={
            {
              id: "profile-1",
              slug: "chat-gpt-1",
              variant: "artificial-intelligence",
              title: {},
              subtitle: {},
              description: {},
              adminTitle: "Chat GPT 1",
            } as any
          }
          message={
            {
              id: "message-1",
              createdAt: new Date("2026-06-17T07:26:00.000Z"),
              updatedAt: new Date("2026-06-17T07:26:00.000Z"),
              description: "Long response\n\n".repeat(40),
              interaction: {},
            } as any
          }
        />,
      );
    });

    const avatarButton = container.querySelector(
      "button[aria-label='Open Chat GPT 1 profile']",
    );

    expect(avatarButton?.className).toContain("sticky");
    expect(avatarButton?.className).toContain("top-3");
    expect(avatarButton?.className).toContain("self-start");
    expect(avatarButton?.className).toContain("h-8");
    expect(avatarButton?.className).toContain("w-8");
  });

  /**
   * BDD Scenario: message text can be copied from the timeline.
   *
   * Given: a rendered chat message contains source text.
   * When: the user clicks the copy message action.
   * Then: the original message description is written to the clipboard.
   */
  test("When: copy action is clicked Then: message description is copied", async () => {
    const description =
      "Да, кладовки могут быть бизнесом.\n\nНо важно считать экономику.";

    act(() => {
      root.render(
        <Component
          isServer={false}
          language="ru"
          data={
            {
              id: "profile-1",
              slug: "chat-gpt-1",
              variant: "artificial-intelligence",
              title: {},
              subtitle: {},
              description: {},
              adminTitle: "Chat GPT 1",
            } as any
          }
          message={
            {
              id: "message-1",
              createdAt: new Date("2026-06-17T07:26:00.000Z"),
              updatedAt: new Date("2026-06-17T07:26:00.000Z"),
              description,
              interaction: {},
            } as any
          }
        />,
      );
    });

    const copyButton = container.querySelector(
      "button[aria-label='Copy message']",
    );

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith(description);
    expect(
      container.querySelector("button[aria-label='Message copied']"),
    ).not.toBeNull();
  });
});
