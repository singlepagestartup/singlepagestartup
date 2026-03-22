/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 panel client component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { act } from "react";
import { Component } from "./ClientComponent";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

jest.mock("@sps/shared-ui-shadcn", () => {
  return jest.requireActual("../test-utils/shadcn-mocks").adminV2ShadcnMocks;
});

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : String(href)} {...props}>
      {children}
    </a>
  ),
}));

describe("GIVEN: admin-v2 panel client component", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  it("WHEN toggle button is clicked THEN sidebar switches between expanded and collapsed states", () => {
    renderInHarness(
      harness,
      <Component settingsHref="/admin/settings">
        <div data-testid="sidebar-content">content</div>
      </Component>,
    );

    const sidebar = harness.container.querySelector("#sidebar");
    expect(sidebar?.className).toContain("w-80");
    expect(harness.container.textContent).toContain("Settings");

    const toggleButton = harness.container.querySelector(
      'button[aria-label="Toggle sidebar"]',
    ) as HTMLButtonElement | null;
    expect(toggleButton).toBeTruthy();

    act(() => {
      toggleButton?.click();
    });

    expect(sidebar?.className).toContain("w-14");
    expect(harness.container.textContent).not.toContain("Settings");
  });

  it("WHEN settingsHref is provided THEN settings action is rendered as link, otherwise callback mode is used", () => {
    const onOpenSettings = jest.fn();

    renderInHarness(
      harness,
      <Component settingsHref="/admin/settings">
        <div>item</div>
      </Component>,
    );

    const settingsLink = harness.container.querySelector(
      'a#settingsButton[href="/admin/settings"]',
    ) as HTMLAnchorElement | null;
    expect(settingsLink).toBeTruthy();

    renderInHarness(
      harness,
      <Component onOpenSettings={onOpenSettings}>
        <div>item</div>
      </Component>,
    );

    const settingsButton = harness.container.querySelector(
      "button#settingsButton",
    ) as HTMLButtonElement | null;
    expect(settingsButton).toBeTruthy();

    act(() => {
      settingsButton?.click();
    });

    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("WHEN showSettingsButton is false THEN settings section is hidden", () => {
    renderInHarness(
      harness,
      <Component showSettingsButton={false} settingsHref="/admin/settings">
        <div>item</div>
      </Component>,
    );

    expect(harness.container.querySelector("#settingsButton")).toBeNull();
    expect(harness.container.textContent).not.toContain("Settings");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
