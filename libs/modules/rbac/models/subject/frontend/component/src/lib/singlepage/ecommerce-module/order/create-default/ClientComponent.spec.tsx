/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mutateAsync = jest.fn();
let currencies: { id: string }[] | undefined;
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderCreate: () => ({ mutateAsync, isPending: false }),
  },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Form: ({ children }: any) => <>{children}</>,
}));
jest.mock("@sps/ui-adapter", () => ({ FormField: () => null }));
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    const React = jest.requireActual<typeof import("react")>("react");
    React.useEffect(() => {
      if (currencies !== undefined) props.onCurrenciesResolved(currencies);
    }, [props.onCurrenciesResolved, currencies]);
    return null;
  },
}));
import { Component } from "./ClientComponent";
const props = {
  variant: "ecommerce-module-order-create-default",
  language: "ru",
  data: { id: "subject" },
  ecommerceModuleProduct: { id: "product" },
} as any;
beforeEach(() => {
  jest.clearAllMocks();
  currencies = undefined;
  mutateAsync.mockResolvedValue({});
});
it("keeps the control disabled while currencies load", () => {
  render(<Component {...props} />);
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it("refuses an unpriced product locally and sends no mutation", async () => {
  currencies = [];
  render(<Component {...props} />);
  const button = await screen.findByRole("button", { name: "Нет цены" });
  expect(button.hasAttribute("disabled")).toBe(true);
  fireEvent.click(button);
  expect(mutateAsync).not.toHaveBeenCalled();
});
it("submits a priced product and shows success", async () => {
  currencies = [{ id: "rub" }];
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      id: "subject",
      data: expect.objectContaining({ productId: "product", quantity: 1 }),
    }),
  );
  expect((await screen.findByRole("status")).textContent).toContain(
    "Товар в корзине.",
  );
});
it("shows an API rejection without marking the product added", async () => {
  currencies = [{ id: "rub" }];
  mutateAsync.mockRejectedValue(new Error("Price changed"));
  render(<Component {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Price changed",
  );
  expect(screen.queryByRole("status")).toBeNull();
});
it("does not reuse the previous product price state while another product loads", () => {
  currencies = [{ id: "rub" }];
  const view = render(<Component {...props} />);
  currencies = undefined;
  view.rerender(
    <Component {...props} ecommerceModuleProduct={{ id: "different" }} />,
  );
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
});

it("submits the selected product after the same form switches products", async () => {
  currencies = [{ id: "rub" }];
  const view = render(<Component {...props} />);
  view.rerender(
    <Component {...props} ecommerceModuleProduct={{ id: "different" }} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Добавить в корзину" }));
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      id: "subject",
      data: expect.objectContaining({ productId: "different" }),
    }),
  );
});
