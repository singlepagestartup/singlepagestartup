/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: RBAC product overview composition behavior.
 *
 * Given: host overview product card is rendered with mocked wrappers.
 * When: component composes overview variant.
 * Then: RBAC me cart/checkout variants are mounted inside overview flow.
 */

import { render } from "@testing-library/react";

const rbacSpy = jest.fn();
const ecommerceProductSpy = jest.fn();

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
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

jest.mock("@sps/shared-ui-shadcn", () => ({
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
}));

import { Component } from "./Component";

describe("Given: RBAC ecommerce product overview component", () => {
  beforeEach(() => {
    rbacSpy.mockReset();
    ecommerceProductSpy.mockReset();
  });

  it("When: component is rendered Then: overview product variant and RBAC me action wrappers are used", () => {
    render(
      <Component
        isServer={false}
        variant="me-ecommerce-module-product-overview-default"
        data={{ id: "subject-1" } as any}
        ecommerceModuleProduct={{ id: "product-1" } as any}
        ecommerceModuleStore={{ id: "store-1" } as any}
        language="en"
      />,
    );

    expect(rbacSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: "subject-1" }),
        dataSource: "props",
        ecommerceModuleProduct: expect.objectContaining({ id: "product-1" }),
        ecommerceModuleStore: expect.objectContaining({ id: "store-1" }),
      }),
    );

    expect(ecommerceProductSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "overview-default",
      }),
    );

    const delegatedVariants = rbacSpy.mock.calls.map((call) => call[0].variant);

    expect(delegatedVariants).toEqual(
      expect.arrayContaining([
        "ecommerce-module-product-cart-default",
        "ecommerce-module-product-checkout-default",
      ]),
    );
  });
});
