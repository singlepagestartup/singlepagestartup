/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./ClientComponent";

const mockOrders = [
  {
    id: "saved-chair",
    cartDetails: {
      storeIds: ["workshop"],
      lines: [
        { id: "chair", productId: "chair", offerId: "chair-offer" },
        {
          id: "shipping",
          productId: "delivery",
          offerId: "courier",
          parentLineId: "chair",
        },
      ],
      availableCurrencyIds: ["rub"],
      billingModuleCurrencyId: "rub",
    },
  },
  {
    id: "other-product",
    cartDetails: {
      storeIds: ["workshop"],
      lines: [{ id: "desk", productId: "desk", offerId: "desk-offer" }],
    },
  },
];

jest.mock("@tanstack/react-query", () => ({
  useIsFetching: () => 0,
  useIsMutating: () => 0,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({ cn: () => "" }));
jest.mock("@sps/rbac/models/subject/sdk/model", () => ({ route: "/subjects" }));
jest.mock(
  "../../../../ecommerce-module/order/list/checkout-default/Row",
  () => ({
    Component: ({ ecommerceModuleOrder, onOrderSelectionStateChange }: any) => (
      <li>
        <button
          onClick={() =>
            onOrderSelectionStateChange(ecommerceModuleOrder.id, "chair", true)
          }
        >
          Edit saved delivery
        </button>
        <button
          onClick={() =>
            onOrderSelectionStateChange(ecommerceModuleOrder.id, "chair", false)
          }
        >
          Finish save
        </button>
      </li>
    ),
  }),
);
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    switch (props.variant) {
      case "ecommerce-module-order-list-default":
        return props.children({ data: mockOrders });
      case "ecommerce-module-order-checkout-default":
        return (
          <button disabled={props.disabled}>
            Pay {props.ecommerceModuleOrder.id}
          </button>
        );
      case "ecommerce-module-order-create-default":
        return (
          <div
            data-testid="excluded"
            data-value={JSON.stringify(props.excludedOfferIds)}
          >
            {props.checkoutSlot?.(null, {
              refreshQuote: jest.fn(),
              hideWhenIdle: false,
            })}
          </div>
        );
      case "me-ecommerce-module-product-checkout-default":
        return (
          <button disabled={props.purchaseConfiguration === null}>
            Buy this configuration
          </button>
        );
      default:
        throw Error(props.variant);
    }
  },
}));

function renderProduct(id: string, withOneStepCheckout = true) {
  return render(
    <Component
      isServer={false}
      variant="me-ecommerce-module-product-cart-default"
      language="ru"
      data={{ id: "guest" } as any}
      ecommerceModuleProduct={{ id } as any}
      withOneStepCheckout={withOneStepCheckout}
    />,
  );
}

it("edits the saved primary and blocks only its payment until its choices are saved", () => {
  renderProduct("chair");
  expect(screen.getByRole("heading", { name: "В корзине" })).toBeTruthy();
  const pay = screen.getByRole("button", {
    name: "Pay saved-chair",
  }) as HTMLButtonElement;
  expect(pay.disabled).toBe(false);
  fireEvent.click(screen.getByText("Edit saved delivery"));
  expect(pay.disabled).toBe(true);
  fireEvent.click(screen.getByText("Finish save"));
  expect(pay.disabled).toBe(false);
  expect(screen.getByTestId("excluded").dataset.value).toBe('["chair-offer"]');
  expect(screen.queryByText("Pay other-product")).toBeNull();
  expect(
    (screen.getByText("Buy this configuration") as HTMLButtonElement).disabled,
  ).toBe(true);
});

it("does not treat a child service as a saved primary on the service page", () => {
  renderProduct("delivery", false);
  expect(screen.queryByRole("heading", { name: "В корзине" })).toBeNull();
  expect(screen.getByTestId("excluded").dataset.value).toBe("[]");
  expect(screen.queryByText("Buy this configuration")).toBeNull();
});
