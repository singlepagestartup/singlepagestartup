/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: RBAC me cart widget behavior.
 *
 * Given: RBAC me/cart dependencies are mocked with controllable auth and quantity state.
 * When: cart widget renders for unauthorized and authorized users.
 * Then: unauthorized users do not see cart UI, while authorized users see sheet and quantity badge behavior.
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

let authSubject: any = { id: "subject-1" };
let quantityValue: number | null = 0;
let selectionPendingChange: ((pending: boolean) => void) | undefined;

jest.mock("lucide-react", () => ({
  ShoppingCart: () => <svg data-testid="cart-icon" />,
  X: () => <svg />,
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
      selectionPendingChange = props.onSelectionPendingChange;
      return (
        <div data-testid="checkout-panel" data-source={props.dataSource} />
      );
    }

    return <div data-testid={props.variant} />;
  },
}));

jest.mock("../../../authentication/me-default/client", () => ({
  __esModule: true,
  default: (props: any) => props.children({ data: authSubject }),
}));

import Component from "./client";

describe("Given: me ecommerce cart widget", () => {
  beforeEach(() => {
    authSubject = { id: "subject-1" };
    quantityValue = 0;
    selectionPendingChange = undefined;
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
    const trigger = screen.getByRole("button", { name: "Open cart" });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Cart" });
    const close = within(dialog).getByRole("button", { name: "Close cart" });
    expect(
      close
        .closest("header")
        ?.contains(within(dialog).getByRole("heading", { name: "Cart" })),
    ).toBe(true);
    expect(within(dialog).getAllByRole("button")).toHaveLength(1);
    expect(screen.getByTestId("checkout-panel").dataset.source).toBe("props");
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
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

  it.each(["close button", "Escape"])(
    "defers %s through pending edits and restores trigger focus once they settle",
    async (dismiss) => {
      render(
        <Component
          isServer={false}
          variant="me-ecommerce-module-cart-default"
          language="en"
        />,
      );
      const trigger = screen.getByRole("button", { name: "Open cart" });
      fireEvent.click(trigger);
      act(() => selectionPendingChange!(true));
      const dialog = screen.getByRole("dialog", { name: "Cart" });
      const close = within(dialog).getByRole("button", { name: "Close cart" });
      close.focus();
      if (dismiss === "Escape") fireEvent.keyDown(close, { key: "Escape" });
      else fireEvent.click(close);
      expect(screen.getByRole("dialog", { name: "Cart" })).toBe(dialog);
      expect(screen.getByRole("status").textContent).toBe("Saving changes…");
      expect(document.activeElement).toBe(close);
      act(() => selectionPendingChange!(false));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
    },
  );

  it("leaves invalid or failed drafts dismissible and ignores late previous-Subject pending signals", () => {
    const view = render(
      <Component
        isServer={false}
        variant="me-ecommerce-module-cart-default"
        language="en"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }));
    act(() => selectionPendingChange!(false));
    fireEvent.click(screen.getByRole("button", { name: "Close cart" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    const oldCallback = selectionPendingChange!;
    authSubject = { id: "subject-2" };
    view.rerender(
      <Component
        isServer={false}
        variant="me-ecommerce-module-cart-default"
        language="en"
      />,
    );
    act(() => oldCallback(true));
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }));
    fireEvent.click(screen.getByRole("button", { name: "Close cart" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
