/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: host product overview composition behavior.
 *
 * Given: host overview product card is rendered with mocked wrappers.
 * When: component composes overview variant.
 * Then: RBAC me cart/checkout variants are mounted inside overview flow.
 */

import { render } from "@testing-library/react";

const rbacSpy = jest.fn();
const ecommerceProductSpy = jest.fn();

jest.mock("../../../../rbac/subject", () => ({
  Component: (props: any) => {
    rbacSpy(props);
    return <div data-testid={props.variant} />;
  },
}));

jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    ecommerceProductSpy(props);
    return <div>{props.children}</div>;
  },
}));

jest.mock("../category-row-button-default/Component", () => ({
  Component: () => <div />,
}));

jest.mock("../social-module-profile-button-default/Component", () => ({
  Component: () => <div />,
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
}));

import { Component } from "./Component";

describe("Given: host ecommerce product overview component", () => {
  beforeEach(() => {
    rbacSpy.mockReset();
    ecommerceProductSpy.mockReset();
  });

  it("When: component is rendered Then: overview product variant and RBAC me action wrappers are used", () => {
    render(
      <Component
        isServer={false}
        variant="overview-default"
        data={{ id: "product-1" } as any}
        language="en"
      />,
    );

    expect(ecommerceProductSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "overview-default",
      }),
    );

    const delegatedVariants = rbacSpy.mock.calls.map((call) => call[0].variant);

    expect(delegatedVariants).toEqual(
      expect.arrayContaining([
        "me-ecommerce-module-product-cart-default",
        "me-ecommerce-module-product-checkout-default",
      ]),
    );
  });
});
