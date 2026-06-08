/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: profiles-to-skills admin-v2 relation table wiring.
 *
 * Given: the profiles-to-skills table receives related model form callbacks.
 * When: it renders relation rows.
 * Then: each row receives the callbacks and labels needed to open linked models.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/table/Component",
  () => ({
    Component: (props: any) => (
      <div data-testid="shared-table">{props.children}</div>
    ),
  }),
);

jest.mock("../table-row", () => ({
  Component: (props: any) => (
    <div
      data-left-label={props.leftModelAdminFormLabel}
      data-right-label={props.rightModelAdminFormLabel}
      data-testid="profiles-to-skills-row"
    />
  ),
}));

describe("GIVEN: profiles-to-skills admin-v2 relation table wiring", () => {
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
   * BDD Scenario: passes linked model controls to rows.
   *
   * Given: the relation table has left and right model form callbacks.
   * When: it maps loaded relation entities to table rows.
   * Then: row props preserve both model action labels.
   */
  test("passes linked model action props to relation rows", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          variant="admin-v2-table"
          data={[{ id: "relation-1" } as any]}
          leftModelAdminForm={() => <div />}
          rightModelAdminForm={() => <div />}
          leftModelAdminFormLabel="Profile"
          rightModelAdminFormLabel="Skill"
        />,
      );
    });

    const row = container.querySelector(
      '[data-testid="profiles-to-skills-row"]',
    );

    expect(row?.getAttribute("data-left-label")).toBe("Profile");
    expect(row?.getAttribute("data-right-label")).toBe("Skill");
  });
});
