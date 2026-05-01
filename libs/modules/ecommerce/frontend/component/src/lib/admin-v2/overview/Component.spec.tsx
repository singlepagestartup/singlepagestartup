/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce admin-v2 overview rendering.
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

jest.mock("./category", () => createOverviewEntryMock("ecommerce", "category"));
jest.mock("./order", () => createOverviewEntryMock("ecommerce", "order"));
jest.mock("./product", () => createOverviewEntryMock("ecommerce", "product"));
jest.mock("./store", () => createOverviewEntryMock("ecommerce", "store"));
jest.mock("./widget", () => createOverviewEntryMock("ecommerce", "widget"));
jest.mock("./attribute/admin-v2-form", () =>
  createModelComponentMock("attribute-form"),
);
jest.mock("./attribute-key/admin-v2-form", () =>
  createModelComponentMock("attribute-key-form"),
);

jest.mock("@sps/ecommerce/models/attribute/frontend/component", () =>
  createModelComponentMock("attribute"),
);
jest.mock("@sps/ecommerce/models/attribute-key/frontend/component", () =>
  createModelComponentMock("attribute-key"),
);

describe("GIVEN: ecommerce admin-v2 overview is mounted", () => {
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
   * Given: the current route is the ecommerce module root.
   * When: the overview component renders.
   * Then: model cards are visible and model tables stay hidden.
   */
  test("renders overview cards at the ecommerce module root", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/ecommerce" />);
    });

    expect(queryByTestId(container, "card:product")).not.toBeNull();
    expect(queryByTestId(container, "card:attribute")).not.toBeNull();
    expect(queryByTestId(container, "card:attribute-key")).not.toBeNull();
    expect(queryByTestId(container, "card:category")).not.toBeNull();
    expect(queryByTestId(container, "card:order")).not.toBeNull();
    expect(queryByTestId(container, "card:store")).not.toBeNull();
    expect(queryByTestId(container, "card:widget")).not.toBeNull();
    expect(queryByTestId(container, "table:product")).toBeNull();
    expect(queryByTestId(container, "table:attribute")).toBeNull();
  });

  /**
   * BDD Scenario: renders a non-overlapping model route.
   *
   * Given: the current route targets a standard ecommerce model.
   * When: the overview component renders.
   * Then: the matching model table is shown without overview cards.
   */
  test("renders a product table without overview cards for the product route", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/ecommerce/product" />,
      );
    });

    expect(queryByTestId(container, "table:product")).not.toBeNull();
    expect(queryByTestId(container, "table:attribute")).toBeNull();
    expect(queryByTestIdPrefix(container, "card:")).toBeNull();
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
        <Component isServer={false} url="/admin/ecommerce/attribute-key" />,
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
   * When: the ecommerce overview renders.
   * Then: no overview content is produced.
   */
  test("returns null for routes outside ecommerce", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/social/post" />);
    });

    expect(container.firstChild).toBeNull();
  });
});
