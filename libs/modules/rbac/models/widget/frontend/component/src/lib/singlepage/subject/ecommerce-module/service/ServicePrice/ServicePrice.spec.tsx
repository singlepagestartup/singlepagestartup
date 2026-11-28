/** @jest-environment jsdom */

/**
 * BDD Suite: Framework service prices.
 * Given: the catalog or detail page has selected a retail service offer.
 * When: the slot renders for a guest or a signed-in buyer.
 * Then: the exact offer supplies the wallet tariff or its fixed-price quote.
 */

import { render, screen } from "@testing-library/react";
import type { IComponentProps as ISubjectProps } from "@sps/rbac/models/subject/frontend/component";
import { ServicePrice } from "./index";
import type { IServicePriceProps } from "./interface";

const mockAvailability = jest.fn();
const mockQuoteReader = jest.fn();
let mockSubject: { id: string } | undefined;

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    customerWorkAvailability: (...args: unknown[]) => mockAvailability(...args),
  },
}));

jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  WorkTokenTariff: jest.requireActual(
    "../../../../../../../../../../subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/customer-work/WorkTokenTariff",
  ).WorkTokenTariff,
  Component: (
    props: Extract<ISubjectProps, { variant: "authentication-me-default" }>,
  ) =>
    mockSubject
      ? props.children?.({
          data: mockSubject as never,
          authenticated: false,
        })
      : props.skeleton,
}));

jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: (props: unknown) => {
    mockQuoteReader(props);
    return <span>1,900 ₽</span>;
  },
}));

const product = {
  id: "product",
} as IServicePriceProps["ecommerceModuleProduct"];
const offer = {
  id: "offer",
  storeId: "store",
  settings: { workTokenPricing: { currencyId: "token", multiplier: "2" } },
} as IServicePriceProps["ecommerceModuleOffer"];
const tariff = {
  rates: [
    {
      model: "custom-text-model",
      capability: "text",
      input: "0.008",
      output: "0.04",
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSubject = { id: "guest" };
  mockAvailability.mockReturnValue({ data: { workTokenTariff: tariff } });
});

it("reads localized wallet rates for the exact selected offer after guest bootstrap", () => {
  mockSubject = undefined;
  const { rerender } = render(
    <ServicePrice
      ecommerceModuleProduct={product}
      ecommerceModuleOffer={offer}
      language="ru"
    />,
  );
  expect(screen.getByRole("status").textContent).toBe("Загружаем тариф…");
  expect(mockAvailability).not.toHaveBeenCalled();

  mockSubject = { id: "guest" };
  rerender(
    <ServicePrice
      ecommerceModuleProduct={product}
      ecommerceModuleOffer={offer}
      language="ru"
    />,
  );

  expect(mockAvailability).toHaveBeenCalledWith({
    id: "guest",
    storeId: "store",
    offerId: "offer",
    productId: "product",
  });
  expect(screen.getByText("Суммы в токенах кошелька SPS")).toBeTruthy();
  expect(screen.getByText("custom-text-model")).toBeTruthy();
  expect(
    screen.getByText("Вход (запрос)").nextElementSibling?.textContent,
  ).toBe("0,008");
  expect(
    screen.getByText("Выход (ответ)").nextElementSibling?.textContent,
  ).toBe("0,04");
  expect(mockQuoteReader).not.toHaveBeenCalled();
});

it("shows an unavailable tariff when the offer has no published rate or access is denied", () => {
  mockAvailability.mockReturnValueOnce({ data: undefined, isPending: false });
  const { rerender } = render(
    <ServicePrice
      ecommerceModuleProduct={product}
      ecommerceModuleOffer={offer}
      language="en"
    />,
  );
  expect(screen.getByRole("status").textContent).toBe(
    "The rate is currently unavailable.",
  );

  mockAvailability.mockReturnValueOnce({
    data: { workTokenTariff: tariff },
    error: { status: 403 },
  });
  rerender(
    <ServicePrice
      ecommerceModuleProduct={product}
      ecommerceModuleOffer={offer}
      language="en"
    />,
  );
  expect(screen.getByRole("status").textContent).toBe(
    "The rate is currently unavailable.",
  );
  expect(screen.queryByText("0.008")).toBeNull();
});

it("delegates fixed prices to the existing public offer quote reader", () => {
  render(
    <ServicePrice
      ecommerceModuleProduct={product}
      ecommerceModuleOffer={{ ...offer, settings: {} }}
      language="en"
    />,
  );
  expect(mockQuoteReader).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: false,
      variant: "product-price-default",
      offerId: "offer",
      storeId: "store",
      product,
      readOnly: true,
    }),
  );
  expect(screen.getByText("1,900 ₽")).toBeTruthy();
  expect(mockAvailability).not.toHaveBeenCalled();
});
