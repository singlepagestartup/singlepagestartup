/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: chat profile MCP server editor.
 *
 * Given: an operator manages an AI profile from the chat sidebar.
 * When: the local SinglePageStartup MCP server is enabled and saved.
 * Then: the profile update receives the stable SinglePageStartup server identifier.
 */

import { screen, within } from "@testing-library/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { McpServersDialog } from "./McpServersDialog";

describe("GIVEN: the chat profile MCP server editor", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    });
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
   * BDD Scenario: enable the local MCP server.
   *
   * Given: the profile has no allowed MCP servers.
   * When: the operator enables SinglePageStartup MCP and saves.
   * Then: the editor submits singlepagestartup as the only allowed server.
   */
  test.each([
    {
      language: "en",
      heading: "Edit MCP Servers",
      close: "Close",
      save: "Save",
    },
    {
      language: "ru",
      heading: "Настройки серверов MCP",
      close: "Закрыть",
      save: "Сохранить",
    },
  ])(
    "saves the MCP selection using the $language dialog",
    async ({ language, heading, close, save }) => {
      const onSave = jest.fn();

      await act(async () => {
        root.render(
          <McpServersDialog
            language={language}
            isOpen
            onOpenChange={jest.fn()}
            onSave={onSave}
            profile={
              {
                id: "profile-1",
                slug: "chat-gpt-1",
                variant: "artificial-intelligence",
                adminTitle: "Chat GPT 1",
                allowedMcpServerIds: [],
              } as any
            }
          />,
        );
        await Promise.resolve();
      });

      const dialog = within(screen.getByRole("dialog", { name: heading }));
      const checkbox = dialog.getByRole("checkbox", {
        name: "SinglePageStartup MCP",
      });
      expect(dialog.getByRole("button", { name: close })).toBeTruthy();

      expect(document.body.textContent).toContain("SinglePageStartup MCP");
      expect(checkbox).not.toBeNull();

      await act(async () => {
        checkbox?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
      });

      await act(async () => {
        dialog.getByRole("button", { name: save }).click();
        await Promise.resolve();
      });

      expect(onSave).toHaveBeenCalledWith(["singlepagestartup"]);
    },
  );
});
