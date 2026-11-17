/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const mockCreate = jest.fn();
let mockOffers: any[];
let mockLoading = false;
let mockIssues: any[] = [];
let mockAmount = "5000";
let mockServices: any[] = [];
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderCreate: () => ({
      mutateAsync: mockCreate,
      isPending: false,
    }),
  },
}));
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: {
    find: () => ({ data: mockOffers, isPending: mockLoading }),
    quote: ({ data }: any) => ({
      data: data.offerId
        ? {
            ...data,
            amount: mockAmount,
            currencyIds: ["rub"],
            availableQuantity: 5,
            serviceOptions: mockServices,
            issues: mockIssues,
            charges: [],
          }
        : undefined,
      isFetching: false,
    }),
  },
}));
jest.mock("@sps/ecommerce/models/store/sdk/client", () => ({
  api: {
    find: () => ({
      data: [
        { id: "store-a", title: { ru: "Магазин А" } },
        { id: "store-b", title: { ru: "Магазин Б" } },
      ],
    }),
  },
}));
jest.mock("@sps/billing/models/currency/sdk/client", () => ({
  api: { find: () => ({ data: [{ id: "rub", slug: "rub", symbol: "₽" }] }) },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-utils"),
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
jest.mock("@sps/ui-adapter", () => ({
  Select: ({
    id,
    value,
    disabled,
    placeholder,
    options,
    onValueChange,
  }: any) => (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, variant, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: any) => <input {...props} />,
}));
import { Component } from "./ClientComponent";
const props: any = {
  data: { id: "subject" },
  language: "ru",
  variant: "ecommerce-module-order-create-default",
  ecommerceModuleProduct: { id: "product" },
};
beforeEach(() => {
  mockCreate.mockReset().mockResolvedValue({});
  mockOffers = [
    {
      id: "offer-a",
      variant: "default",
      productId: "product",
      storeId: "store-a",
      sku: "A",
    },
  ];
  mockLoading = false;
  mockIssues = [];
  mockAmount = "5000";
  mockServices = [];
});
it("submits the exact unique retail offer with a supported currency", async () => {
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith({
      id: "subject",
      data: {
        productId: "product",
        offerId: "offer-a",
        storeId: "store-a",
        quantity: 1,
        billingModuleCurrencyId: "rub",
      },
    }),
  );
  expect((await screen.findByRole("status")).textContent).toContain(
    "Товар в корзине",
  );
});
it("requires a store choice when two offers sell the same Product", async () => {
  mockOffers.push({
    id: "offer-b",
    variant: "default",
    productId: "product",
    storeId: "store-b",
    sku: "B",
  });
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  expect(button.hasAttribute("disabled")).toBe(true);
  fireEvent.change(screen.getAllByRole("combobox")[0], {
    target: { value: "offer-b" },
  });
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  fireEvent.click(button);
  await waitFor(() =>
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          offerId: "offer-b",
          storeId: "store-b",
        }),
      }),
    ),
  );
});
it("blocks stock and configuration errors locally", () => {
  mockIssues = [
    { code: "insufficient_stock", offerId: "offer-a", message: "Available 0" },
  ];
  render(<Component {...props} />);
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(mockCreate).not.toHaveBeenCalled();
});
it("lets the buyer finish delivery selection in the cart", async () => {
  mockIssues = [
    {
      code: "delivery_required",
      offerId: "offer-a",
      message: "Choose delivery",
    },
  ];
  render(<Component {...props} />);
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("does not reuse a previous Product's loaded offer", () => {
  const view = render(<Component {...props} />);
  view.rerender(
    <Component {...props} ecommerceModuleProduct={{ id: "different" }} />,
  );
  expect(
    screen
      .getByRole("button", { name: "Добавить в корзину" })
      .hasAttribute("disabled"),
  ).toBe(true);
});
it("shows an API failure without marking the offer added", async () => {
  mockCreate.mockRejectedValue(new Error("Offer terms changed"));
  render(<Component {...props} />);
  const button = screen.getByRole("button", { name: "Добавить в корзину" });
  await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
  fireEvent.click(button);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Offer terms changed",
  );
  expect(screen.queryByRole("status")).toBeNull();
});

it("excludes provider offers from the buyer's store selector", async () => {
  mockOffers.push({
    id: "provider-offer",
    variant: "provider",
    productId: "product",
    storeId: "store-b",
    sku: "PROVIDER",
  });
  render(<Component {...props} />);
  expect(screen.queryByRole("option", { name: "Магазин Б" })).toBeNull();
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("offers a service separately only when its retail offer is standalone", async () => {
  mockOffers = [
    {
      id: "linked-service",
      variant: "default",
      productId: "product",
      storeId: "store-a",
      sku: "LINKED",
      settings: { standalone: false },
    },
    {
      id: "standalone-service",
      variant: "default",
      productId: "product",
      storeId: "store-b",
      sku: "STANDALONE",
      settings: { standalone: true },
    },
  ];
  render(
    <Component
      {...props}
      ecommerceModuleProduct={{ id: "product", kind: "service" }}
    />,
  );
  expect(screen.queryByRole("option", { name: "Магазин А" })).toBeNull();
  expect(screen.getByRole("option", { name: "Магазин Б" })).toBeTruthy();
  await waitFor(() =>
    expect(
      screen
        .getByRole("button", { name: "Добавить в корзину" })
        .hasAttribute("disabled"),
    ).toBe(false),
  );
});
it("renders the quoted amount after a quantity change without calculating money in the browser", () => {
  const view = render(<Component {...props} />);
  mockAmount = "1234.56";
  fireEvent.change(screen.getByLabelText("Количество"), {
    target: { value: "2" },
  });
  expect(screen.getByText(/1\s234,56/)).toBeTruthy();
  expect(screen.queryByText(/10000/)).toBeNull();
});

it("uses localized store names without exposing a unique offer's technical SKU", () => {
  render(<Component {...props} />);
  expect(screen.getByLabelText("Магазин")).toBeTruthy();
  expect(screen.getByLabelText("Валюта")).toBeTruthy();
  expect(screen.getByRole("option", { name: "Магазин А" })).toBeTruthy();
  expect(screen.queryByRole("option", { name: /· A/ })).toBeNull();
});

it("distinguishes multiple offers from the same store", () => {
  mockOffers.push({ ...mockOffers[0], id: "other-offer", sku: "B" });
  render(<Component {...props} />);
  expect(screen.getByRole("option", { name: "Магазин А · A" })).toBeTruthy();
  expect(screen.getByRole("option", { name: "Магазин А · B" })).toBeTruthy();
});

it.each([
  ["5000.00", /5\s000 ₽/],
  ["0.00000001", /0,00000001 ₽/],
])(
  "renders the quoted amount %s without redundant zeros or rounding",
  (amount, expected) => {
    mockAmount = amount;
    render(<Component {...props} />);
    expect(screen.getByText(expected)).toBeTruthy();
  },
);

it("names the selected offer's localized optional services as choices in the cart", () => {
  mockServices = [
    {
      offerId: "service",
      title: "Consultation",
      titles: { ru: "Консультация", en: "Consultation" },
    },
  ];
  render(<Component {...props} />);
  expect(
    screen.getByText("В корзине можно выбрать: Консультация."),
  ).toBeTruthy();
  expect(screen.queryByText(/Consultation/)).toBeNull();
  expect(screen.queryByRole("checkbox")).toBeNull();
});

it("removes a previous offer's service hint when choosing another store", () => {
  mockServices = [{ offerId: "service", title: "Consultation" }];
  mockOffers.push({ ...mockOffers[0], id: "other-offer", storeId: "store-b" });
  render(<Component {...props} />);
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "offer-a" },
  });
  expect(screen.getByText(/Consultation/)).toBeTruthy();
  mockServices = [];
  fireEvent.change(screen.getByLabelText("Магазин"), {
    target: { value: "other-offer" },
  });
  expect(screen.queryByText(/Consultation/)).toBeNull();
});
