/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: website-builder admin-v2 overview rendering.
 *
 * Given: overview receives module and model admin routes.
 * When: user opens overview or a collision-prone model route.
 * Then: cards and tables remain scoped to the exact active model.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

function isActiveModelRoute(
  url: string | undefined,
  moduleId: string,
  modelId: string,
) {
  return url === `/admin/${moduleId}/${modelId}`;
}

function queryByTestId(container: HTMLDivElement, testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`);
}

function queryByTestIdPrefix(container: HTMLDivElement, prefix: string) {
  return container.querySelector(`[data-testid^="${prefix}"]`);
}

function createOverviewEntryMock(moduleId: string, modelId: string) {
  return {
    Component: (props: any) => {
      if (props.variant === "admin-v2-card") {
        return <div data-testid={`card:${modelId}`} />;
      }

      if (props.variant === "admin-v2-table") {
        if (!isActiveModelRoute(props.url, moduleId, modelId)) {
          return null;
        }

        return <div data-testid={`table:${modelId}`} />;
      }

      return null;
    },
  };
}

function createModelComponentMock(modelId: string) {
  return {
    Component: (props: any) => {
      if (props.variant === "admin-v2-card") {
        return <div data-testid={`card:${modelId}`} />;
      }

      if (props.variant === "admin-v2-table") {
        return <div data-testid={`table:${modelId}`} />;
      }

      return null;
    },
  };
}

jest.mock("./feature", () =>
  createOverviewEntryMock("website-builder", "feature"),
);
jest.mock("./logotype", () =>
  createOverviewEntryMock("website-builder", "logotype"),
);
jest.mock("./slide", () => createOverviewEntryMock("website-builder", "slide"));
jest.mock("./slider", () =>
  createOverviewEntryMock("website-builder", "slider"),
);
jest.mock("./widget", () =>
  createOverviewEntryMock("website-builder", "widget"),
);
jest.mock("./button/admin-v2-form", () =>
  createModelComponentMock("button-form"),
);
jest.mock("./buttons-array/admin-v2-form", () =>
  createModelComponentMock("buttons-array-form"),
);

jest.mock("@sps/website-builder/models/button/frontend/component", () =>
  createModelComponentMock("button"),
);
jest.mock("@sps/website-builder/models/buttons-array/frontend/component", () =>
  createModelComponentMock("buttons-array"),
);

describe("GIVEN: website-builder admin-v2 overview is mounted", () => {
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
   * BDD Scenario: renders module overview cards at the module root.
   *
   * Given: the current route is the website-builder module root.
   * When: the overview component renders.
   * Then: module cards are visible and no model tables are active.
   */
  test("renders overview cards at the website-builder module root", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/website-builder" />);
    });

    expect(queryByTestId(container, "card:button")).not.toBeNull();
    expect(queryByTestId(container, "card:buttons-array")).not.toBeNull();
    expect(queryByTestId(container, "card:feature")).not.toBeNull();
    expect(queryByTestId(container, "table:button")).toBeNull();
    expect(queryByTestId(container, "table:buttons-array")).toBeNull();
  });

  /**
   * BDD Scenario: keeps sibling prefix routes isolated.
   *
   * Given: the current route targets the buttons-array model.
   * When: the overview component renders its model table wrappers.
   * Then: only the buttons-array table remains active.
   */
  test("renders only the buttons-array table for the buttons-array route", () => {
    act(() => {
      root.render(
        <Component
          isServer={false}
          url="/admin/website-builder/buttons-array"
        />,
      );
    });

    expect(queryByTestId(container, "table:buttons-array")).not.toBeNull();
    expect(queryByTestId(container, "table:button")).toBeNull();
    expect(queryByTestIdPrefix(container, "card:")).toBeNull();
  });

  /**
   * BDD Scenario: rejects routes from other modules.
   *
   * Given: the current route belongs to another module.
   * When: the website-builder overview renders.
   * Then: no overview content is produced.
   */
  test("returns null for routes outside website-builder", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/ecommerce/product" />,
      );
    });

    expect(container.firstChild).toBeNull();
  });
});
