/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: add-to-cart control for products that cannot be priced.
 *
 * Given: a product card renders the add-to-cart action for a subject.
 * When: the product's price currencies resolve to an empty set.
 * Then: the control is disabled and labelled No price, so no request is sent for a product that cannot be bought.
 */

import { fireEvent, render, screen } from "@testing-library/react";

const mutateMock = jest.fn();
const useFormMock = jest.fn();

const currencies: { value: { id: string; symbol: string }[] | undefined } = {
  value: undefined,
};

const submitPayload = {
  quantity: 1,
  productId: "product-1",
};

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderCreate: () => ({
      mutate: mutateMock,
      isPending: false,
      isSuccess: false,
    }),
  },
}));

jest.mock("react-hook-form", () => ({
  useForm: (...args: unknown[]) => useFormMock(...args),
}));

jest.mock("@hookform/resolvers/zod", () => ({
  zodResolver: () => undefined,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Form: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@sps/ui-adapter", () => ({
  FormField: () => <div data-testid="currency-field" />,
}));

const passthrough = {
  Component: ({ children }: any) => children({ data: [] }),
};

jest.mock(
  "@sps/ecommerce/models/attribute-key/frontend/component",
  () => passthrough,
);
jest.mock(
  "@sps/ecommerce/relations/products-to-attributes/frontend/component",
  () => passthrough,
);
jest.mock(
  "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component",
  () => passthrough,
);
jest.mock(
  "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component",
  () => passthrough,
);

jest.mock("@sps/billing/models/currency/frontend/component", () => {
  const react = jest.requireActual("react");

  return {
    Component: ({ set, children }: any) => {
      react.useEffect(() => {
        set?.(currencies.value);
      }, [set]);

      return children ? children({ data: currencies.value }) : null;
    },
  };
});

import { Component } from "./ClientComponent";

function renderComponent() {
  return render(
    <Component
      isServer={false}
      variant="ecommerce-module-order-create-default"
      data={{ id: "subject-1" } as any}
      product={{ id: "product-1" } as any}
      language="en"
    />,
  );
}

describe("Given: an add-to-cart control on a product card", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useFormMock.mockReset();
    currencies.value = undefined;

    useFormMock.mockReturnValue({
      control: {},
      register: () => ({}),
      handleSubmit: (submit: (data: typeof submitPayload) => void) => () =>
        submit(submitPayload),
    });
  });

  /**
   * BDD Scenario: a product with no price in any currency.
   *
   * Given: the product's price currencies resolve to an empty list.
   * When: the control renders.
   * Then: the button reads No price and is disabled.
   */
  it("When: the product has no price currency Then: the button is disabled and reads No price", () => {
    currencies.value = [];

    renderComponent();

    const button = screen.getByRole("button", {
      name: "No price",
    }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  /**
   * BDD Scenario: a disabled control sends nothing.
   *
   * Given: the product has no price currency.
   * When: the button is clicked.
   * Then: no add-to-cart request is made.
   */
  it("When: the disabled button is clicked Then: no mutation is sent", () => {
    currencies.value = [];

    renderComponent();

    fireEvent.click(screen.getByRole("button", { name: "No price" }));

    expect(mutateMock).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: price currencies are still loading.
   *
   * Given: the product's price currencies have not resolved yet.
   * When: the control renders.
   * Then: the button stays disabled without claiming the product has no price.
   */
  it("When: the price currencies are still loading Then: the button is disabled and keeps its label", () => {
    currencies.value = undefined;

    renderComponent();

    const button = screen.getByRole("button", {
      name: "Add to cart",
    }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  /**
   * BDD Scenario: a product priced in at least one currency.
   *
   * Given: the product's price currencies resolve to a non-empty list.
   * When: the button is clicked.
   * Then: the add-to-cart mutation is sent for that subject.
   */
  it("When: the product has a price currency Then: clicking sends the add-to-cart mutation", () => {
    currencies.value = [{ id: "currency-rub", symbol: "₽" }];

    renderComponent();

    const button = screen.getByRole("button", {
      name: "Add to cart",
    }) as HTMLButtonElement;

    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    expect(mutateMock).toHaveBeenCalledWith({
      id: "subject-1",
      data: submitPayload,
    });
  });
});
