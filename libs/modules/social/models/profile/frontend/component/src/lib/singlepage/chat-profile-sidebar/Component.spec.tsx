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
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component } from "./Component";

jest.mock("@sps/knowledge/models/source/frontend/component", () => ({
  Component: () => <div data-testid="knowledge-sidebar-item" />,
}));

jest.mock("@sps/social/models/skill/frontend/component", () => ({
  Component: () => <div data-testid="skill-sidebar-item" />,
}));

jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: (props: {
    dataSource?: string;
    file?: { id?: string } | null;
  }) => (
    <div
      data-testid="profile-avatar"
      data-source={props.dataSource}
      data-avatar-id={props.file?.id}
    />
  ),
}));

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

  test("opens the corresponding skill and knowledge editors with the keyboard", async () => {
    const user = userEvent.setup();
    const onSkillCreate = jest.fn();
    const onKnowledgeSourceCreate = jest.fn();
    const profile = {
      id: "profile-1",
      slug: "assistant",
      title: { ru: "Ассистент" },
    } as any;

    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="chat-profile-sidebar"
          language="ru"
          data={profile}
          onSkillCreate={onSkillCreate}
          onKnowledgeSourceCreate={onKnowledgeSourceCreate}
        />,
      );
    });

    const skill = within(container).getByRole("button", {
      name: "Добавить навык для профиля «Ассистент»",
    });
    const knowledge = within(container).getByRole("button", {
      name: "Добавить источник знаний для профиля «Ассистент»",
    });
    for (const action of [skill, knowledge]) {
      expect(action.classList.contains("rounded-xl")).toBe(true);
      expect(action.classList.contains("size-11")).toBe(true);
      expect(action.querySelector('[data-icon-name="plus"]')).not.toBeNull();
    }
    await user.tab();
    expect(document.activeElement).toBe(skill);
    await user.keyboard("{Enter}");
    expect(onSkillCreate).toHaveBeenCalledWith(profile);
    await user.tab();
    expect(document.activeElement).toBe(knowledge);
    await user.keyboard("[Space]");
    expect(onKnowledgeSourceCreate).toHaveBeenCalledWith(profile);
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
          knowledgeSources={[]}
          hasKnowledgeSourcesError
        />,
      );
    });

    expect(container.textContent).toContain("Knowledge could not be loaded.");
    expect(container.textContent).not.toContain("No knowledge sources.");
  });

  test("shows the owner's empty Knowledge section with no agent tools or editing actions", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="chat-profile-sidebar"
          language="ru"
          summaryOnly
          onKnowledgeSourceSelect={jest.fn()}
          data={{ id: "mine", slug: "rogwild", variant: "default" } as any}
        />,
      );
    });
    const card = within(container);
    expect(card.getByRole("heading", { name: "Знания" })).toBeTruthy();
    expect(card.getByText("Нет источников знаний.")).toBeTruthy();
    expect(card.queryByRole("button")).toBeNull();
    expect(card.queryByText("Навыки")).toBeNull();
    expect(card.queryByText("Инструменты MCP")).toBeNull();
  });

  test("shows the scoped profile summary without the tools, skills or knowledge sections", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="chat-profile-sidebar"
          language="en"
          summaryOnly
          displayName="rogwild"
          avatar={{ id: "authorized-avatar" } as any}
          onMcpServersEdit={jest.fn()}
          onProfileEdit={jest.fn()}
          onSkillCreate={jest.fn()}
          skills={[{ id: "private-skill" } as any]}
          knowledgeSources={[{ id: "private-source" } as any]}
          data={
            {
              id: "profile-1",
              slug: "alice",
              title: {},
              adminTitle: "Internal account label",
              description: { en: "Store assistant" },
              allowedMcpServerIds: ["singlepagestartup"],
            } as any
          }
        />,
      );
    });

    expect(container.querySelector("h2")?.textContent).toBe("rogwild");
    expect(container.textContent).not.toContain("Internal account label");
    expect(container.textContent).toContain("Store assistant");
    expect(container.textContent).not.toMatch(/MCP|Skills|Knowledge/);
    const avatar = container.querySelector('[data-testid="profile-avatar"]');
    expect(avatar?.getAttribute("data-source")).toBe("props");
    expect(avatar?.getAttribute("data-avatar-id")).toBe("authorized-avatar");
    expect(container.querySelector("button")).toBeNull();
  });
});
