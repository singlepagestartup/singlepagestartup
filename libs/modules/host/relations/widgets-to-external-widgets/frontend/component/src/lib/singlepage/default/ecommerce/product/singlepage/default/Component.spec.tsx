/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: host product default composition behavior.
 *
 * Given: host default product card is rendered with mocked wrappers.
 * When: component composes ecommerce product and RBAC variants.
 * Then: cart and checkout actions are delegated to RBAC me variants with product context.
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
    return (
      <div data-testid="ecommerce-product">
        {props.topSlot}
        {props.middleSlot}
        {props.children}
      </div>
    );
  },
}));

jest.mock("../category-row-button-default", () => ({
  Component: () => <div data-testid="category-button" />,
}));

jest.mock("../social-module-profile-button-default", () => ({
  Component: () => <div data-testid="profile-button" />,
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
}));

import { Component } from "./Component";

describe("Given: host ecommerce product default component", () => {
  beforeEach(() => {
    rbacSpy.mockReset();
    ecommerceProductSpy.mockReset();
  });

  it("When: component is rendered Then: cart and checkout variants are delegated to RBAC me wrappers", () => {
    render(
      <Component
        isServer={false}
        variant="default"
        data={{ id: "product-1" } as any}
        language="en"
      />,
    );

    const delegatedVariants = rbacSpy.mock.calls.map((call) => call[0].variant);

    expect(delegatedVariants).toEqual(
      expect.arrayContaining([
        "me-ecommerce-module-product-cart-default",
        "me-ecommerce-module-product-checkout-default",
      ]),
    );

    expect(ecommerceProductSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "default",
        data: expect.objectContaining({ id: "product-1" }),
      }),
    );
  });
});
