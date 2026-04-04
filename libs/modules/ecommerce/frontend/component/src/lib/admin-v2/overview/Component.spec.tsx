/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce admin-v2 overview rendering.
 *
 * Given: overview receives module route and registry-driven model entries.
 * When: user opens overview or model route in admin-v2.
 * Then: cards and tables are rendered according to current URL scope.
 */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Component } from "./Component";

const modelMock = jest.fn();
const tableMock = jest.fn();

function createOverviewModelMock(modelId: string) {
  return {
    Component: (props: any) => {
      if (props.variant === "admin-v2-card") {
        modelMock({ modelId, ...props });
        return <div data-testid={`card:${modelId}`} />;
      }

      if (props.variant === "admin-v2-table") {
        tableMock({ modelId, ...props });
        if (!props.url.includes(`/${modelId}`)) {
          return null;
        }

        return <div data-testid={`table:${modelId}`} />;
      }

      return null;
    },
  };
}

jest.mock("./product", () => createOverviewModelMock("product"));
jest.mock("./attribute", () => createOverviewModelMock("attribute"));
jest.mock("./attribute-key", () => createOverviewModelMock("attribute-key"));
jest.mock("./category", () => createOverviewModelMock("category"));
jest.mock("./order", () => createOverviewModelMock("order"));
jest.mock("./store", () => createOverviewModelMock("store"));
jest.mock("./widget", () => createOverviewModelMock("widget"));

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
    modelMock.mockClear();
    tableMock.mockClear();
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("WHEN: url points to /admin/ecommerce THEN: overview cards are rendered", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/ecommerce" />);
    });

    expect(
      container.querySelector('[data-testid="card:product"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:attribute"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:attribute-key"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:category"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:order"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:store"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:widget"]'),
    ).not.toBeNull();
    expect(container.querySelector('[data-testid="table:product"]')).toBeNull();
    expect(
      container.querySelector("[data-testid='table:attribute']"),
    ).toBeNull();
  });

  test("WHEN: url points to model route THEN: model table is rendered without overview cards", () => {
    act(() => {
      root.render(
        <Component isServer={false} url="/admin/ecommerce/product" />,
      );
    });

    expect(
      container.querySelector("[data-testid='table:product']"),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-testid='table:attribute']"),
    ).toBeNull();
    expect(container.querySelector('[data-testid^="card:"]')).toBeNull();
  });

  test("WHEN: url points to another module THEN: component returns null", () => {
    act(() => {
      root.render(<Component isServer={false} url="/admin/social/post" />);
    });

    expect(container.firstChild).toBeNull();
    expect(modelMock).not.toHaveBeenCalled();
    expect(tableMock).not.toHaveBeenCalled();
  });
});
