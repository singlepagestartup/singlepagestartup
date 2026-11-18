/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

const mockProductAttributes = jest.fn();
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));
jest.mock(
  "@sps/ecommerce/relations/products-to-attributes/frontend/component",
  () => ({
    Component: (props: any) => {
      mockProductAttributes(props);
      return props.children({
        data: [
          { id: "link-usd", attributeId: "usd-price" },
          { id: "link-eur", attributeId: "eur-price" },
        ],
      });
    },
  }),
);
jest.mock("@sps/ecommerce/models/attribute/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "find" ? (
      props.children({
        data: [
          { id: "usd-price", number: "100" },
          { id: "eur-price", number: "90" },
        ],
      })
    ) : (
      <span>{props.data.number}</span>
    ),
}));
jest.mock(
  "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component",
  () => ({
    Component: (props: any) => {
      const filters = props.apiProps.params.filters.and;
      const attributeId = filters.find(
        (filter: any) => filter.column === "attributeId",
      ).value;
      const currencyId = filters.find(
        (filter: any) => filter.column === "billingModuleCurrencyId",
      ).value;
      return props.children({
        data: attributeId.startsWith(currencyId)
          ? [{ id: `${attributeId}-currency` }]
          : [],
      });
    },
  }),
);
jest.mock(
  "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component",
  () => ({
    Component: (props: any) =>
      props.children({
        data: [{ id: "key-attribute", attributeKeyId: "price-key" }],
      }),
  }),
);
jest.mock("@sps/ecommerce/models/attribute-key/frontend/component", () => ({
  Component: (props: any) =>
    props.children({
      data: props.apiProps.params.filters.and.some(
        (filter: any) => filter.column === "type" && filter.value === "price",
      )
        ? [{ id: "price-key", field: "number" }]
        : [],
    }),
}));
import { Component } from "./Component";

const baseProps = {
  isServer: false,
  variant: "price-default" as const,
  data: { id: "product" } as any,
  language: "en",
};
beforeEach(() => {
  mockProductAttributes.mockClear();
});

it.each([false, true])(
  "keeps the original currency-filtered Product attribute price (isServer=%s)",
  (isServer) => {
    const { rerender } = render(
      <Component
        {...baseProps}
        isServer={isServer}
        billingModuleCurrencyId="usd"
      />,
    );
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.queryByText("90")).toBeNull();
    rerender(
      <Component
        {...baseProps}
        isServer={isServer}
        billingModuleCurrencyId="eur"
      />,
    );
    expect(screen.getByText("90")).toBeTruthy();
    expect(screen.queryByText("100")).toBeNull();
  },
);

it.each(["pending", "unavailable"] as const)(
  "does not substitute Product attributes for a %s Store quote",
  (status) => {
    render(
      <Component
        {...baseProps}
        billingModuleCurrencyId="usd"
        calculatedPrice={{ status }}
      />,
    );
    expect(
      screen.getByText(
        status === "pending" ? "Calculating…" : "Cannot calculate",
      ),
    ).toBeTruthy();
    expect(mockProductAttributes).not.toHaveBeenCalled();
    expect(screen.queryByText("100")).toBeNull();
  },
);

it("displays a calculated zero price without loading attribute prices", () => {
  render(
    <Component
      {...baseProps}
      calculatedPrice={{ status: "ready", amount: "0", currencySymbol: "$" }}
    />,
  );
  expect(screen.getByText("0 $")).toBeTruthy();
  expect(mockProductAttributes).not.toHaveBeenCalled();
});
