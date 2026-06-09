/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social skill admin-v2 table row form wiring.
 *
 * Given: the social skill table row receives an admin form from its admin overview wrapper.
 * When: the row renders its edit form callback.
 * Then: the overview-provided form is used so relation renderers are preserved.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

jest.mock("@sps/social/models/skill/sdk/client", () => ({
  api: {
    delete: () => ({
      mutate: jest.fn(),
    }),
  },
}));

jest.mock("../form", () => ({
  Component: (props: any) => (
    <div data-entity-id={props.data?.id} data-testid="fallback-admin-form" />
  ),
}));

jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/table-row/Component",
  () => ({
    Component: (props: any) => (
      <div data-testid="shared-table-row">
        {props.adminForm?.({
          data: props.data,
          isServer: false,
        })}
      </div>
    ),
  }),
);

describe("GIVEN: social skill admin-v2 table row form wiring", () => {
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
   * BDD Scenario: preserves the overview admin form callback.
   *
   * Given: the table row receives a custom admin form with relation renderers.
   * When: the row passes its edit form to the shared row component.
   * Then: the custom admin form is rendered instead of the model fallback form.
   */
  test("uses the overview-provided admin form for edit sheets", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          module="social"
          name="skill"
          variant="admin-v2-table-row"
          data={
            {
              id: "skill-1",
              adminTitle: "Skill",
              slug: "skill",
              variant: "default",
            } as any
          }
          adminForm={() => <div data-testid="overview-admin-form" />}
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="overview-admin-form"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="fallback-admin-form"]'),
    ).toBeNull();
  });
});
