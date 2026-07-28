/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: allowed MCP servers in the social profile admin form.
 *
 * Given: an operator edits a social profile's MCP server configuration.
 * When: SinglePageStartup MCP is toggled or stale stored data is loaded.
 * Then: supported selections round-trip and stale identifiers stay visible.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { useForm } from "react-hook-form";
import {
  insertSchema,
  type TSupportedMcpServerIdentifier,
} from "@sps/social/models/profile/sdk/model";
import { z } from "zod";
import { AllowedMcpServersField } from "./AllowedMcpServersField";

interface IHarnessProps {
  configuredIdentifiers: TSupportedMcpServerIdentifier[];
  storedIdentifiers?: string[];
  onSubmit: (data: z.infer<typeof insertSchema>) => void;
}

function Harness(props: IHarnessProps) {
  const form = useForm<z.infer<typeof insertSchema>>({
    defaultValues: {
      allowedMcpServerIds: props.configuredIdentifiers,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(props.onSubmit)}>
      <AllowedMcpServersField
        control={form.control}
        storedIdentifiers={props.storedIdentifiers}
      />
      <button type="submit">Save</button>
    </form>
  );
}

describe("GIVEN: the social profile MCP server admin control", () => {
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
   * BDD Scenario: SinglePageStartup MCP can be enabled from an empty default.
   *
   * Given: a profile has no allowed MCP servers.
   * When: the operator enables SinglePageStartup MCP and submits the form.
   * Then: the SinglePageStartup identifier is included in submitted profile data.
   */
  test("When: SinglePageStartup MCP is enabled Then: its identifier round-trips through form submission", async () => {
    const onSubmit = jest.fn();

    act(() => {
      root.render(<Harness configuredIdentifiers={[]} onSubmit={onSubmit} />);
    });

    const singlePageStartupCheckbox = container.querySelector(
      "#allowed-mcp-server-singlepagestartup",
    );

    await act(async () => {
      singlePageStartupCheckbox?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      container
        .querySelector("form")
        ?.dispatchEvent(new Event("submit", { bubbles: true }));
      await Promise.resolve();
    });

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      allowedMcpServerIds: ["singlepagestartup"],
    });
  });

  /**
   * BDD Scenario: stale MCP identifiers remain visible and unavailable.
   *
   * Given: a profile stores an identifier unsupported by this deployment.
   * When: its admin form is rendered and submitted.
   * Then: the identifier is labelled unavailable and excluded from active data.
   */
  test("When: a stale identifier is loaded Then: it stays visible but cannot remain active", async () => {
    const onSubmit = jest.fn();

    act(() => {
      root.render(
        <Harness
          configuredIdentifiers={[]}
          storedIdentifiers={["retired-server"]}
          onSubmit={onSubmit}
        />,
      );
    });

    expect(container.textContent).toContain("retired-server");
    expect(container.textContent).toContain("Unavailable");
    expect(
      container
        .querySelector("[aria-label='retired-server']")
        ?.hasAttribute("disabled"),
    ).toBe(true);

    await act(async () => {
      container
        .querySelector("form")
        ?.dispatchEvent(new Event("submit", { bubbles: true }));
      await Promise.resolve();
    });

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      allowedMcpServerIds: [],
    });
  });
});
