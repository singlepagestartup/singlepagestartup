/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social profile chat sidebar actions.
 *
 * Given: the chat profile sidebar receives profile management callbacks.
 * When: the owning model wrapper renders the client sidebar variant.
 * Then: profile and MCP edit controls are forwarded alongside skills and knowledge controls.
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

jest.mock(
  "@sps/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar",
  () => ({
    Component: () => <div data-testid="profile-avatar" />,
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
   * BDD Scenario: renders and edits the profile MCP section.
   *
   * Given: an AI profile allows the local SinglePageStartup MCP server.
   * When: the sidebar renders and the operator opens MCP editing.
   * Then: the server is listed by its stable identifier and the callback receives the profile.
   */
  test("renders the SinglePageStartup MCP server and forwards its edit action", () => {
    const onMcpServersEdit = jest.fn();

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
              allowedMcpServerIds: ["singlepagestartup"],
            } as any
          }
          onMcpServersEdit={onMcpServersEdit}
        />,
      );
    });

    expect(container.textContent).toContain("MCP");
    expect(container.textContent).toContain("SinglePageStartup MCP");
    expect(container.textContent).toContain("singlepagestartup");

    const editButton = container.querySelector(
      'button[aria-label="Edit MCP servers for chat-gpt-1"]',
    );

    expect(editButton).not.toBeNull();

    act(() => {
      editButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onMcpServersEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "profile-1",
        allowedMcpServerIds: ["singlepagestartup"],
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

  /**
   * BDD Scenario: distinguishes a Knowledge request failure from an empty list.
   *
   * Given: the Knowledge query failed before returning profile documents.
   * When: the chat profile sidebar renders the Knowledge section.
   * Then: the user sees an actionable access error instead of a misleading zero count.
   */
  test("renders a Knowledge access error instead of an empty document count", () => {
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
          knowledgeDocuments={[]}
          hasKnowledgeDocumentsError
        />,
      );
    });

    expect(container.textContent).toContain(
      "Knowledge could not be loaded. Check access permissions and try again.",
    );
    expect(container.textContent).not.toContain("No knowledge documents.");
  });
});
