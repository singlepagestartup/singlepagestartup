/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./ClientComponent";
import type { IOrderWorkView } from "@sps/rbac/models/subject/sdk/model";

let mockWork: IOrderWorkView | undefined;

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
  ...jest.requireActual("@tanstack/react-query"),
  useIsFetching: () => 0,
  useIsMutating: () => 0,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: () => "",
  formatCurrencyAmount: (amount: string) => amount,
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { find: () => ({ data: [{ id: "rub", symbol: "₽" }] }) },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWorkForOrder: () => ({ data: null }),
    orderWork: {
      read: () => ({ data: mockWork }),
      decision: () => ({ isPending: false }),
    },
  },
}));
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
          <div>
            {!props.hideConfiguration ? (
              <span data-testid="creation-form" />
            ) : null}
            {props.checkoutSlot?.(null, {
              refreshQuote: jest.fn(),
              hideWhenIdle: props.hideConfiguration,
            })}
          </div>
        );
      case "me-ecommerce-module-product-checkout-default":
        return props.hideWhenIdle ? null : (
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

beforeEach(() => {
  mockWork = undefined;
});

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
  expect(screen.queryByTestId("creation-form")).toBeNull();
  expect(screen.queryByText("Pay other-product")).toBeNull();
  expect(screen.queryByText("Buy this configuration")).toBeNull();
});

it("does not treat a child service as a saved primary on the service page", () => {
  renderProduct("delivery", false);
  expect(screen.queryByRole("heading", { name: "В корзине" })).toBeNull();
  expect(screen.getByTestId("creation-form")).toBeTruthy();
  expect(screen.queryByText("Buy this configuration")).toBeNull();
});

it("omits result versions invalidated by a quantity correction from the buyer's choices", () => {
  mockWork = {
    orderId: "saved-chair",
    storeId: "workshop",
    taskId: "task",
    state: "awaiting-result",
    versions: [
      {
        id: "version-old",
        number: 1,
        createdAt: "2026-11-17T00:00:00.000Z",
        price: "2000",
        currencyId: "rub",
        preview: { id: "preview-old", path: "/preview-old" },
        invalidatedByCartEdit: true,
      },
      {
        id: "version-new",
        number: 2,
        createdAt: "2026-11-18T00:00:00.000Z",
        price: "1000",
        currencyId: "rub",
        preview: { id: "preview-new", path: "/preview-new" },
      },
    ],
    acceptedVersionId: null,
    paidVersionId: null,
    result: null,
    receipt: null,
    deliveryStatus: "pending",
    trackingNumber: null,
  };
  renderProduct("chair");
  expect(screen.queryByRole("option", { name: "Версия 1" })).toBeNull();
  expect(screen.getByRole("button", { name: "Принять версию 2" })).toBeTruthy();
});
