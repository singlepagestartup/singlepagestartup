/**
 * BDD Suite: admin-v2 agregated-input proxy component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

jest.mock(
  "@sps/shared-frontend-components/singlepage/admin/agregated-input/Component",
  () => ({
    Component: "MockAdminAgregatedInput",
  }),
);

import { Component } from "./Component";

describe("GIVEN: admin-v2 agregated-input proxy component", () => {
  it("WHEN title and children are passed THEN props are forwarded to admin agregated-input parent component", () => {
    const child = <span>Field content</span>;
    const element = Component({
      title: "Details",
      children: child,
    } as any) as any;

    expect(element.props.title).toBe("Details");
    expect(element.props.children).toBe(child);
  });
});
