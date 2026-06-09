/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: profiles-to-skills admin-v2 relation row linked model actions.
 *
 * Given: a profiles-to-skills relation row receives linked model form callbacks.
 * When: it delegates to the shared admin-v2 table row.
 * Then: the shared row receives left and right model controls for both linked models.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

jest.mock("@sps/social/relations/profiles-to-skills/sdk/client", () => ({
  api: {
    delete: () => ({
      mutate: jest.fn(),
    }),
  },
}));

jest.mock("../form", () => ({
  Component: (props: any) => (
    <div data-entity-id={props.data?.id} data-testid="relation-admin-form" />
  ),
}));

jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component",
  () => ({
    Component: (props: any) => (
      <div
        data-left-label={props.leftModelAdminFormLabel}
        data-right-label={props.rightModelAdminFormLabel}
        data-relation={props.name}
        data-testid="shared-relation-row"
      />
    ),
  }),
);

describe("GIVEN: profiles-to-skills admin-v2 relation row linked model actions", () => {
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
   * BDD Scenario: forwards linked model controls to the shared row.
   *
   * Given: the relation row has Profile and Skill form callbacks.
   * When: it renders the shared admin-v2 row.
   * Then: the shared row receives both linked model labels.
   */
  test("forwards linked model action props to the shared relation row", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          module="social"
          name="profiles-to-skills"
          variant="admin-v2-table-row"
          data={{ id: "relation-1" } as any}
          leftModelAdminForm={() => <div />}
          rightModelAdminForm={() => <div />}
          leftModelAdminFormLabel="Profile"
          rightModelAdminFormLabel="Skill"
        />,
      );
    });

    const row = container.querySelector('[data-testid="shared-relation-row"]');

    expect(row?.getAttribute("data-relation")).toBe("profiles-to-skills");
    expect(row?.getAttribute("data-left-label")).toBe("Profile");
    expect(row?.getAttribute("data-right-label")).toBe("Skill");
  });
});
