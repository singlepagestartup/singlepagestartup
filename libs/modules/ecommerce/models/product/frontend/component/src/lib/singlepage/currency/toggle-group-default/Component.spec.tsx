/** @jest-environment jsdom */
import { render, waitFor, cleanup } from "@testing-library/react";
const collections: Record<string, any[]> = {};
const currencyData = [{ id: "rub", symbol: "₽" }];
jest.mock("@sps/shared-frontend-client-utils", () => ({ cn: () => "" }));
jest.mock("@sps/ecommerce/models/attribute-key/frontend/component", () => ({
  Component: ({ children }: any) => children({ data: collections.keys }),
}));
jest.mock(
  "@sps/ecommerce/relations/products-to-attributes/frontend/component",
  () => ({
    Component: ({ children }: any) => children({ data: collections.products }),
  }),
);
jest.mock(
  "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component",
  () => ({
    Component: ({ children }: any) =>
      children({ data: collections.attributes }),
  }),
);
jest.mock(
  "@sps/ecommerce/relations/attributes-to-billing-module-currencies/frontend/component",
  () => ({
    Component: ({ children }: any) => children({ data: collections.links }),
  }),
);
jest.mock("@sps/billing/models/currency/frontend/component", () => ({
  Component: ({ children, variant }: any) =>
    variant === "find" ? children({ data: collections.currencies }) : null,
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  FormField: () => null,
  FormItem: () => null,
  ToggleGroup: () => null,
  ToggleGroupItem: () => null,
}));
import { Component } from "./Component";
beforeEach(() => {
  Object.assign(collections, {
    keys: [{ id: "price" }],
    products: [{ attributeId: "attribute" }],
    attributes: [{ attributeId: "attribute" }],
    links: [{ billingModuleCurrencyId: "rub" }],
    currencies: currencyData,
  });
});
afterEach(cleanup);
it.each(["keys", "products", "attributes", "links", "currencies"])(
  "reports unavailable pricing when %s is empty",
  async (key) => {
    collections[key] = [];
    const notify = jest.fn();
    render(
      <Component
        {...({
          data: { id: "product" },
          form: { control: {} },
          formFieldName: "currency",
          onCurrenciesResolved: notify,
        } as any)}
      />,
    );
    await waitFor(() => expect(notify).toHaveBeenCalledWith([]));
    expect(notify).toHaveBeenCalledTimes(1);
  },
);
it("reports resolved currencies without changing the current currency selector", async () => {
  const notify = jest.fn();
  render(
    <Component
      {...({
        data: { id: "product" },
        form: { control: {} },
        formFieldName: "currency",
        onCurrenciesResolved: notify,
      } as any)}
    />,
  );
  await waitFor(() => expect(notify).toHaveBeenCalledWith(currencyData));
});
