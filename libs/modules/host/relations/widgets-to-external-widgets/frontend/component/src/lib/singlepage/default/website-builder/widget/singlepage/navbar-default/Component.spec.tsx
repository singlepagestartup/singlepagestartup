/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: host navbar cart delegation behavior.
 *
 * Given: navbar component is rendered with mocked RBAC subject wrapper.
 * When: navbar mounts cart area.
 * Then: it delegates cart rendering to me-ecommerce-module-cart-default variant.
 */

import { render } from "@testing-library/react";

const rbacSpy = jest.fn();

jest.mock("../../../../rbac/subject", () => ({
  Component: (props: any) => {
    rbacSpy(props);
    return <div data-testid={props.variant} />;
  },
}));

import { Component } from "./Component";

describe("Given: navbar default component", () => {
  beforeEach(() => {
    rbacSpy.mockReset();
  });

  it("When: navbar is rendered Then: cart is delegated to me-ecommerce-module-cart-default", () => {
    render(
      <Component
        isServer={false}
        variant="navbar-default"
        data={{ id: "widget-1" } as any}
        language="en"
        url="/"
      />,
    );

    expect(rbacSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "me-ecommerce-module-cart-default",
      }),
    );
  });
});
