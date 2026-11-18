/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: RBAC product default composition behavior.
 *
 * Given: host default product card is rendered with mocked wrappers.
 * When: component composes ecommerce product and RBAC variants.
 * Then: cart and checkout actions are delegated to RBAC me variants with product context.
 */

import { render } from "@testing-library/react";

const rbacSpy = jest.fn();
const ecommerceProductSpy = jest.fn();
const storePriceSpy = jest.fn();
jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: (props: any) => {
    storePriceSpy(props);
    return null;
  },
}));

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
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
        {props.priceSlot}
        {props.middleSlot}
        {props.children}
      </div>
    );
  },
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
}));

import { Component } from "./Component";

describe("Given: RBAC ecommerce product default component", () => {
  beforeEach(() => {
    rbacSpy.mockReset();
    ecommerceProductSpy.mockReset();
  });

  it("When: component is rendered Then: cart and checkout variants are delegated to RBAC me wrappers", () => {
    render(
      <Component
        isServer={false}
        variant="me-ecommerce-module-product-card-default"
        data={{ id: "subject-1" } as any}
        ecommerceModuleProduct={{ id: "product-1" } as any}
        ecommerceModuleStore={{ id: "store-1" } as any}
        language="en"
      />,
    );

    const delegatedVariants = rbacSpy.mock.calls.map((call) => call[0].variant);

    expect(delegatedVariants).toEqual(
      expect.arrayContaining(["me-ecommerce-module-product-cart-default"]),
    );
    expect(delegatedVariants).not.toContain(
      "me-ecommerce-module-product-checkout-default",
    );

    expect(rbacSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: "subject-1" }),
        dataSource: "props",
        ecommerceModuleProduct: expect.objectContaining({ id: "product-1" }),
        ecommerceModuleStore: expect.objectContaining({ id: "store-1" }),
        withOneStepCheckout: true,
      }),
    );

    expect(storePriceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "product-price-default",
        storeId: "store-1",
        product: expect.objectContaining({ id: "product-1" }),
        readOnly: true,
      }),
    );
    expect(ecommerceProductSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "default",
        data: expect.objectContaining({ id: "product-1" }),
      }),
    );
  });
});
