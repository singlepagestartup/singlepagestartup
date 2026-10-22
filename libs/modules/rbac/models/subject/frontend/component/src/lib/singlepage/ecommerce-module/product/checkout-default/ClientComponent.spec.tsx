/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mockCheckout = jest.fn();
const mockCart = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleProductCheckout: () => ({
      mutateAsync: mockCheckout,
      isPending: false,
    }),
    ecommerceModuleOrderCreate: () => ({
      mutateAsync: mockCart,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  Form: ({ children }: any) => <>{children}</>,
  Button: ({ children, variant, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
jest.mock("@sps/ui-adapter", () => ({
  FormField: (props: any) => (
    <label>
      {props.label || props.name}
      {props.type === "select" ? (
        <select
          aria-label={props.label || props.name}
          {...props.form.register(props.name)}
        >
          {props.options.map(([id, label]: string[]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-label={props.label || props.name}
          type={props.type === "number" ? "number" : "text"}
          {...props.form.register(props.name, {
            valueAsNumber: props.type === "number",
          })}
        />
      )}
    </label>
  ),
}));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "price-default" ? (
      <span>REAL-SDK-PRICE</span>
    ) : (
      <select
        aria-label="Currency"
        {...props.form.register(props.formFieldName)}
      >
        <option value="">Choose</option>
        <option value="currency-usd">USD</option>
        <option value="currency-eur">EUR</option>
      </select>
    ),
}));
import { Component } from "./ClientComponent";
import { Component as CreateCart } from "../../order/create-default/ClientComponent";
const props = {
  isServer: false,
  variant: "ecommerce-module-product-checkout-default" as const,
  data: { id: "subject" } as any,
  ecommerceModuleProduct: { id: "product" } as any,
  ecommerceModuleStore: { id: "store" } as any,
  language: "en",
};
beforeEach(() => {
  mockCheckout.mockReset();
  mockCart.mockReset();
  window.location.hash = "";
});
it("submits the actual currency, Store, quantity, email, comment and one of all eight providers then follows the server invoice URL", async () => {
  mockCheckout.mockResolvedValue({
    billingModule: {
      invoices: [
        { paymentUrl: `${window.location.origin}/#invoice-confirmed` },
      ],
    },
  });
  render(<Component {...props} />);
  fireEvent.click(screen.getByText("One step checkout"));
  const provider = screen.getByLabelText("Payment method");
  expect((provider as HTMLSelectElement).options).toHaveLength(8);
  fireEvent.change(provider, {
    target: { value: "payselection-international" },
  });
  fireEvent.change(screen.getByLabelText("Currency"), {
    target: { value: "currency-eur" },
  });
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "3" },
  });
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Comment"), {
    target: { value: "Existing checkout comment" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(mockCheckout).toHaveBeenCalledWith({
      id: "subject",
      productId: "product",
      data: {
        provider: "payselection-international",
        email: "customer@example.com",
        quantity: 3,
        comment: "Existing checkout comment",
        storeId: "store",
        billingModule: { currency: { id: "currency-eur" } },
      },
    }),
  );
  await waitFor(() => expect(window.location.hash).toBe("#invoice-confirmed"));
});
it("keeps validation and displays a backend checkout failure without reporting success", async () => {
  mockCheckout.mockRejectedValue(new Error("Provider unavailable"));
  render(<Component {...props} />);
  fireEvent.click(screen.getByText("One step checkout"));
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() => expect(mockCheckout).not.toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText("Email for a bill"), {
    target: { value: "customer@example.com" },
  });
  fireEvent.submit(screen.getByText("Continue to payment").closest("form")!);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("Provider unavailable"),
  );
  expect(window.location.hash).toBe("");
});
it("uses the existing cart operation and keeps the selected currency, quantity and Store", async () => {
  mockCart.mockResolvedValue({ id: "order" });
  render(
    <CreateCart {...props} variant="ecommerce-module-order-create-default" />,
  );
  fireEvent.change(screen.getByLabelText("Currency"), {
    target: { value: "currency-usd" },
  });
  fireEvent.change(screen.getByLabelText("Quantity"), {
    target: { value: "2" },
  });
  fireEvent.submit(screen.getByText("Add to cart").closest("form")!);
  await waitFor(() =>
    expect(mockCart).toHaveBeenCalledWith({
      id: "subject",
      data: {
        quantity: 2,
        productId: "product",
        storeId: "store",
        billingModule: { currency: { id: "currency-usd" } },
      },
    }),
  );
  expect(screen.getByRole("status").textContent).toBe("Added to your cart.");
});
