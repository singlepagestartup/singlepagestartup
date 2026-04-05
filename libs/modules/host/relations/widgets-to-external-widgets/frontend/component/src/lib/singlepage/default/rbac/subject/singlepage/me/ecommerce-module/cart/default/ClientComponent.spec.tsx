/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: host me cart widget behavior.
 *
 * Given: RBAC me/cart dependencies are mocked with controllable auth and quantity state.
 * When: cart widget renders for unauthorized and authorized users.
 * Then: unauthorized users do not see cart UI, while authorized users see sheet and quantity badge behavior.
 */

import { render, screen } from "@testing-library/react";

let authSubject: any = { id: "subject-1" };
let quantityValue: number | null = 0;

jest.mock("lucide-react", () => ({
  ShoppingCart: () => <svg data-testid="cart-icon" />,
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetTrigger: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    if (props.variant === "authentication-me-default") {
      return props.children ? props.children({ data: authSubject }) : null;
    }

    if (props.variant === "ecommerce-module-order-list-quantity-default") {
      return props.children ? props.children({ data: quantityValue }) : null;
    }

    if (props.variant === "ecommerce-module-order-list-checkout-default") {
      return <div data-testid="checkout-panel" />;
    }

    return <div data-testid={props.variant} />;
  },
}));

import { Component } from "./ClientComponent";

describe("Given: me ecommerce cart widget", () => {
  beforeEach(() => {
    authSubject = { id: "subject-1" };
    quantityValue = 0;
  });

  it("When: auth subject is missing Then: cart widget is hidden", () => {
    authSubject = null;

    const { container } = render(
      <Component
        isServer={false}
        variant="me-ecommerce-module-cart-default"
        language="en"
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("When: auth subject exists and quantity is positive Then: cart icon, badge, and checkout panel are rendered", () => {
    quantityValue = 3;

    render(
      <Component
        isServer={false}
        variant="me-ecommerce-module-cart-default"
        language="en"
      />,
    );

    expect(screen.queryByTestId("cart-icon")).not.toBeNull();
    expect(screen.queryByText("3")).not.toBeNull();
    expect(screen.queryByTestId("checkout-panel")).not.toBeNull();
  });

  it("When: auth subject exists and quantity is zero Then: quantity badge is hidden", () => {
    quantityValue = 0;

    render(
      <Component
        isServer={false}
        variant="me-ecommerce-module-cart-default"
        language="en"
      />,
    );

    expect(screen.queryByTestId("cart-icon")).not.toBeNull();
    expect(screen.queryByText("0")).toBeNull();
  });
});
