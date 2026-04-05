/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: host product cart-only composition behavior.
 *
 * Given: host cart-default product card is rendered with mocked wrappers.
 * When: component delegates cart interactions.
 * Then: only RBAC me cart variant is mounted (without checkout variant).
 */

import { render } from "@testing-library/react";

const rbacSpy = jest.fn();

jest.mock("../../../../rbac/subject", () => ({
  Component: (props: any) => {
    rbacSpy(props);
    return <div data-testid={props.variant} />;
  },
}));

jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => <div>{props.children}</div>,
}));

import { Component } from "./Component";

describe("Given: host ecommerce product cart-default component", () => {
  beforeEach(() => {
    rbacSpy.mockReset();
  });

  it("When: component is rendered Then: only me cart variant is delegated", () => {
    render(
      <Component
        isServer={false}
        variant="cart-default"
        data={{ id: "product-1" } as any}
        language="en"
      />,
    );

    const delegatedVariants = rbacSpy.mock.calls.map((call) => call[0].variant);

    expect(delegatedVariants).toEqual([
      "me-ecommerce-module-product-cart-default",
    ]);
  });
});
