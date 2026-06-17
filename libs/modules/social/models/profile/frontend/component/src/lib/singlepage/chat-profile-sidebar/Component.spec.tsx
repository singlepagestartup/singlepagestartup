/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social profile chat sidebar actions.
 *
 * Given: the chat profile sidebar receives profile management callbacks.
 * When: the owning model wrapper renders the client sidebar variant.
 * Then: profile edit controls are forwarded alongside skills and knowledge controls.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

jest.mock(
  "@sps/knowledge/models/document/frontend/component/src/lib/singlepage/chat-sidebar-item",
  () => ({
    Component: () => <div data-testid="knowledge-sidebar-item" />,
  }),
);

jest.mock(
  "@sps/social/models/skill/frontend/component/src/lib/singlepage/chat-sidebar-item",
  () => ({
    Component: () => <div data-testid="skill-sidebar-item" />,
  }),
);

describe("GIVEN: social profile chat sidebar actions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
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
   * BDD Scenario: forwards profile edit callback.
   *
   * Given: an AI profile sidebar is rendered with an edit callback.
   * When: the user clicks the profile edit button.
   * Then: the wrapper forwards the selected profile to the callback.
   */
  test("forwards profile edit actions to the client sidebar", () => {
    const onProfileEdit = jest.fn();

    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="chat-profile-sidebar"
          language="en"
          data={
            {
              id: "profile-1",
              slug: "chat-gpt-1",
              variant: "artificial-intelligence",
              adminTitle: "Chat GPT 1",
            } as any
          }
          onProfileEdit={onProfileEdit}
        />,
      );
    });

    const editButton = container.querySelector(
      'button[aria-label="Edit profile chat-gpt-1"]',
    );

    expect(editButton).not.toBeNull();

    act(() => {
      editButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onProfileEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "profile-1",
        slug: "chat-gpt-1",
      }),
    );
  });

  /**
   * BDD Scenario: renders legacy TipTap descriptions as text.
   *
   * Given: an existing profile description was stored as a TipTap JSON string.
   * When: the chat profile sidebar renders the profile section.
   * Then: the user sees plain description text without raw editor JSON.
   */
  test("renders legacy TipTap profile descriptions as plain text", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="chat-profile-sidebar"
          language="en"
          data={
            {
              id: "profile-1",
              slug: "chat-gpt-1",
              variant: "artificial-intelligence",
              adminTitle: "Chat GPT 1",
              description: {
                en: JSON.stringify({
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "Uses personal real estate knowledge.",
                        },
                      ],
                    },
                  ],
                }),
              },
            } as any
          }
        />,
      );
    });

    expect(container.textContent).toContain(
      "Uses personal real estate knowledge.",
    );
    expect(container.textContent).not.toContain('"type":"doc"');
  });
});
