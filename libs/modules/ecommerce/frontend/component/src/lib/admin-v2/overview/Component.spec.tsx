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

jest.mock("../registry", () => ({
  ecommerceAdminV2Models: [
    {
      id: "product",
      title: "Product",
      Model: (props: any) => {
        modelMock(props);
        return <div data-testid={`card:${props.variant}:product`} />;
      },
      Table: (props: any) => {
        tableMock(props);
        if (!props.url.includes("/product")) {
          return null;
        }

        return <div data-testid="table:product" />;
      },
    },
    {
      id: "attribute",
      title: "Attribute",
      Model: (props: any) => {
        modelMock(props);
        return <div data-testid={`card:${props.variant}:attribute`} />;
      },
      Table: (props: any) => {
        tableMock(props);
        if (!props.url.includes("/attribute")) {
          return null;
        }

        return <div data-testid="table:attribute" />;
      },
    },
  ],
}));

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
      container.querySelector("[data-testid='card:admin-v2-card:product']"),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="card:admin-v2-card:attribute"]'),
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
