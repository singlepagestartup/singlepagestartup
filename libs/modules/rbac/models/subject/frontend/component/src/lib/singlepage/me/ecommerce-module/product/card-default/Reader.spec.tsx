/** @jest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import type { ReactNode, ComponentType } from "react";

let mockSubject: { id: string; authenticated?: boolean } | undefined;
let mockClientSubject: typeof mockSubject;
const mockView = jest.fn((_props: Record<string, unknown>) => null);
const mockClientReader = jest.fn();
const mockServerReader = jest.fn();
const mockProvider = jest.fn(
  ({ children }: { children: ReactNode }) => children,
);

jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  Provider: (props: { children: ReactNode }) => mockProvider(props),
}));
jest.mock("../../../../authentication/me-default/client", () => ({
  __esModule: true,
  default: (props: any) => {
    mockClientReader(props);
    return props.children({ data: mockClientSubject });
  },
}));
jest.mock("../../../../authentication/me-default/server", () => ({
  __esModule: true,
  default: (props: any) => {
    mockServerReader(props);
    return mockSubject ? props.children({ data: mockSubject }) : props.fallback;
  },
}));
jest.mock("./Component", () => ({
  Component: (props: any) => mockView(props),
}));
jest.mock("../overview-default/Component", () => ({
  Component: (props: any) => mockView(props),
}));
jest.mock("../cart-row-default/Component", () => ({
  Component: (props: any) => mockView(props),
}));
jest.mock("../cart-default/Component", () => ({
  Component: (props: any) => mockView(props),
}));
jest.mock("../checkout-default/Component", () => ({
  Component: (props: any) => mockView(props),
}));
jest.mock("../../cart-default/Component", () => ({
  Component: (props: any) => mockView(props),
}));
jest.mock("../../order/list/checkout-default/Component", () => ({
  Component: (props: any) => mockView(props),
}));

import { Component as ProductCard } from "./index";
import ProductCardServer from "./server";
import { Component as ProductOverview } from "../overview-default";
import ProductOverviewServer from "../overview-default/server";
import { Component as ProductCartRow } from "../cart-row-default";
import ProductCartRowServer from "../cart-row-default/server";
import { Component as ProductCart } from "../cart-default";
import ProductCartServer from "../cart-default/server";
import { Component as ProductCheckout } from "../checkout-default";
import ProductCheckoutServer from "../checkout-default/server";
import { Component as Cart } from "../../cart-default";
import CartServer from "../../cart-default/server";
import { Component as OrderListCheckout } from "../../order/list/checkout-default";
import OrderListCheckoutServer from "../../order/list/checkout-default/server";

const variants = [
  ["me-ecommerce-module-product-card-default", ProductCard, ProductCardServer],
  [
    "me-ecommerce-module-product-overview-default",
    ProductOverview,
    ProductOverviewServer,
  ],
  [
    "me-ecommerce-module-product-cart-row-default",
    ProductCartRow,
    ProductCartRowServer,
  ],
  ["me-ecommerce-module-product-cart-default", ProductCart, ProductCartServer],
  [
    "me-ecommerce-module-product-checkout-default",
    ProductCheckout,
    ProductCheckoutServer,
  ],
  ["me-ecommerce-module-cart-default", Cart, CartServer],
  [
    "me-ecommerce-module-order-list-checkout-default",
    OrderListCheckout,
    OrderListCheckoutServer,
  ],
] as const;

beforeEach(() => {
  mockSubject = { id: "current-subject", authenticated: false };
  mockClientSubject = mockSubject;
  jest.clearAllMocks();
});
afterEach(cleanup);

it.each(variants)(
  "%s preserves the current Subject and foreign inputs in both readers",
  async (variant, Entry, Server) => {
    const props = {
      variant,
      isServer: false,
      language: "en",
      ecommerceModuleProduct: { id: "product" },
      ecommerceModuleStore: { id: "store" },
      apiProps: { options: { headers: { "x-request-id": "reader-check" } } },
    };
    const ClientEntry = Entry as ComponentType<typeof props>;
    render(<ClientEntry {...props} />);
    expect(mockClientReader).toHaveBeenCalledWith(
      expect.objectContaining({ apiProps: props.apiProps }),
    );
    expect(mockView).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...props, data: mockSubject }),
    );
    cleanup();
    render(await Server({ ...props, isServer: true }));
    expect(mockServerReader).toHaveBeenCalledWith(
      expect.objectContaining({ apiProps: props.apiProps }),
    );
    expect(mockView).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...props, isServer: true, data: mockSubject }),
    );
    const passed = mockView.mock.calls.at(-1)![0];
    for (const key of [
      "Provider",
      "Component",
      "clientApi",
      "serverApi",
      "api",
    ])
      expect(passed).not.toHaveProperty(key);
  },
);

it.each(variants)(
  "%s does not render actions without a current Subject",
  async (variant, Entry, Server) => {
    mockSubject = undefined;
    mockClientSubject = undefined;
    const props = { variant, isServer: false, language: "en" };
    const ClientEntry = Entry as ComponentType<typeof props>;
    render(<ClientEntry {...props} />);
    cleanup();
    render(await Server({ ...props, isServer: true }));
    expect(mockView).not.toHaveBeenCalled();
  },
);

it.each(variants)(
  "%s can pick up a browser session when SSR has no Subject",
  async (variant, _Entry, Server) => {
    mockSubject = undefined;
    mockClientSubject = { id: "new-browser-guest", authenticated: false };
    render(
      await Server({
        variant,
        isServer: true,
        language: "en",
        ecommerceModuleProduct: { id: "product" },
        ecommerceModuleStore: { id: "store" },
        apiProps: {
          options: { headers: { Authorization: "server-only-value" } },
        },
      }),
    );
    expect(mockServerReader).toHaveBeenCalledTimes(1);
    expect(mockClientReader).toHaveBeenCalledTimes(1);
    expect(mockClientReader.mock.calls[0][0].apiProps).toBeUndefined();
    expect(mockView).toHaveBeenCalledWith(
      expect.objectContaining({
        data: mockClientSubject,
        isServer: false,
        language: "en",
      }),
    );
    expect(mockView.mock.calls[0][0].apiProps).toBeUndefined();
  },
);

const propsVariants = [
  ["me-ecommerce-module-product-cart-default", ProductCart],
  ["me-ecommerce-module-product-checkout-default", ProductCheckout],
  ["me-ecommerce-module-cart-default", Cart],
] as const;

it.each(propsVariants)(
  "%s renders a supplied Subject without a session reader or Provider in either runtime",
  (variant, Entry) => {
    mockSubject = undefined;
    mockClientSubject = undefined;
    const suppliedSubject = {
      id: "loaded-current-subject",
      authenticated: false,
    };
    for (const isServer of [false, true]) {
      jest.clearAllMocks();
      const props = {
        variant,
        isServer,
        dataSource: "props" as const,
        data: suppliedSubject,
        language: "en",
        className: "cart-actions",
        ecommerceModuleProduct: { id: "product" },
        ecommerceModuleStore: { id: "store" },
      };
      const LoadedEntry = Entry as ComponentType<typeof props>;
      render(<LoadedEntry {...props} />);
      expect(mockClientReader).not.toHaveBeenCalled();
      expect(mockServerReader).not.toHaveBeenCalled();
      expect(mockProvider).not.toHaveBeenCalled();
      expect(mockView).toHaveBeenCalledTimes(1);
      expect(mockView.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          isServer,
          variant,
          data: suppliedSubject,
          language: "en",
          className: "cart-actions",
          ...(variant.includes("product")
            ? {
                ecommerceModuleProduct: props.ecommerceModuleProduct,
                ecommerceModuleStore: props.ecommerceModuleStore,
              }
            : {}),
        }),
      );
      cleanup();
    }
  },
);
