/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: social admin-v2 overview rendering.
 *
 * Given: overview receives module and model admin routes.
 * When: user opens overview or collision-prone model routes in admin-v2.
 * Then: cards and tables are rendered according to exact model scope.
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

jest.mock("./action", () => createOverviewEntryMock("social", "action"));
jest.mock("./chat", () => createOverviewEntryMock("social", "chat"));
jest.mock("./message", () => createOverviewEntryMock("social", "message"));
jest.mock("./profile", () => createOverviewEntryMock("social", "profile"));
jest.mock("./thread", () => createOverviewEntryMock("social", "thread"));
jest.mock("./widget", () => createOverviewEntryMock("social", "widget"));
jest.mock("./attribute/admin-v2-form", () =>
  createModelComponentMock("attribute-form"),
);
jest.mock("./attribute-key/admin-v2-form", () =>
  createModelComponentMock("attribute-key-form"),
);

jest.mock("@sps/social/models/attribute/frontend/component", () =>
  createModelComponentMock("attribute"),
);
jest.mock("@sps/social/models/attribute-key/frontend/component", () =>
  createModelComponentMock("attribute-key"),
);

describe("GIVEN: social admin-v2 overview is mounted", () => {
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
   * Given: the current route is the social module root.
   * When: the overview component renders.
   * Then: model cards are visible and model tables stay hidden.
   */
  test("renders overview cards at the social module root", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/social" />);
    });

    expect(queryByTestId(container, "card:attribute")).not.toBeNull();
    expect(queryByTestId(container, "card:attribute-key")).not.toBeNull();
    expect(queryByTestId(container, "card:action")).not.toBeNull();
    expect(queryByTestId(container, "table:attribute")).toBeNull();
    expect(queryByTestId(container, "table:attribute-key")).toBeNull();
  });

  /**
   * BDD Scenario: isolates prefix-collision siblings.
   *
   * Given: the current route targets attribute-key.
   * When: the overview component renders its model table wrappers.
   * Then: attribute-key stays active without activating attribute.
   */
  test("renders only the attribute-key table for the attribute-key route", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/social/attribute-key" />,
      );
    });

    expect(queryByTestId(container, "table:attribute-key")).not.toBeNull();
    expect(queryByTestId(container, "table:attribute")).toBeNull();
    expect(queryByTestIdPrefix(container, "card:")).toBeNull();
  });

  /**
   * BDD Scenario: rejects routes from other modules.
   *
   * Given: the current route belongs to another module.
   * When: the social overview renders.
   * Then: no overview content is produced.
   */
  test("returns null for routes outside social", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/ecommerce/product" />,
      );
    });

    expect(container.firstChild).toBeNull();
  });
});
