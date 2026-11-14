/** @jest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import type { ReactNode, ComponentType } from "react";
import type { IModel as ISubject } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import type { IComponentProps as IAuthenticationProps } from "../../../../authentication/me-default/interface";

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

const recordFields = {
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  variant: "default",
};
const product: IProduct = {
  ...recordFields,
  id: "product",
  slug: "product",
  adminTitle: "Product",
  title: {},
  description: {},
  shortDescription: {},
  metadata: {},
  type: "one_off",
};
const store: IStore = {
  ...recordFields,
  id: "store",
  slug: "store",
  adminTitle: "Store",
  title: {},
  description: {},
  shortDescription: {},
};
const sharedProps = {
  isServer: false,
  language: "en",
  ecommerceModuleProduct: product,
  ecommerceModuleStore: store,
  apiProps: {
    options: {
      next: { revalidate: 0 },
      headers: { "x-request-id": "reader-check" },
    },
  },
};

interface IReaderTestProps {
  variant: string;
  isServer: boolean;
  apiProps?: IAuthenticationProps["apiProps"];
}

function readerCase<Props extends IReaderTestProps>(
  Entry: ComponentType<Props>,
  Server: (props: Props) => Promise<ReactNode>,
  props: NoInfer<Props>,
) {
  return {
    variant: props.variant,
    props,
    renderClient: () => render(<Entry {...props} />),
    renderServer: (overrides: Pick<IReaderTestProps, "apiProps"> = {}) =>
      Server({ ...props, ...overrides, isServer: true }),
  };
}

const variants = [
  readerCase(ProductCard, ProductCardServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-product-card-default",
  }),
  readerCase(ProductOverview, ProductOverviewServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-product-overview-default",
  }),
  readerCase(ProductCartRow, ProductCartRowServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-product-cart-row-default",
  }),
  readerCase(ProductCart, ProductCartServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-product-cart-default",
  }),
  readerCase(ProductCheckout, ProductCheckoutServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-product-checkout-default",
  }),
  readerCase(Cart, CartServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-cart-default",
  }),
  readerCase(OrderListCheckout, OrderListCheckoutServer, {
    ...sharedProps,
    variant: "me-ecommerce-module-order-list-checkout-default",
  }),
];

beforeEach(() => {
  mockSubject = { id: "current-subject", authenticated: false };
  mockClientSubject = mockSubject;
  jest.clearAllMocks();
});
afterEach(cleanup);

it.each(variants)(
  "$variant preserves the current Subject and foreign inputs in both readers",
  async ({ props, renderClient, renderServer }) => {
    renderClient();
    expect(mockClientReader).toHaveBeenCalledWith(
      expect.objectContaining({ apiProps: props.apiProps }),
    );
    expect(mockView).toHaveBeenLastCalledWith(
      expect.objectContaining({ ...props, data: mockSubject }),
    );
    cleanup();
    render(await renderServer());
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
    ]) {
      expect(passed).not.toHaveProperty(key);
    }
  },
);

it.each(variants)(
  "$variant does not render actions without a current Subject",
  async ({ renderClient, renderServer }) => {
    mockSubject = undefined;
    mockClientSubject = undefined;
    renderClient();
    cleanup();
    render(await renderServer());
    expect(mockView).not.toHaveBeenCalled();
  },
);

it.each(variants)(
  "$variant can pick up a browser session when SSR has no Subject",
  async ({ renderServer }) => {
    mockSubject = undefined;
    mockClientSubject = { id: "new-browser-guest", authenticated: false };
    render(
      await renderServer({
        apiProps: {
          options: {
            next: { revalidate: 0 },
            headers: { Authorization: "server-only-value" },
          },
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

const suppliedSubject: ISubject = {
  ...recordFields,
  id: "loaded-current-subject",
  slug: "loaded-current-subject",
  tokensValidAfter: null,
};
const loadedProps = {
  isServer: false,
  dataSource: "props" as const,
  data: suppliedSubject,
  language: "en",
  className: "cart-actions",
  ecommerceModuleProduct: product,
  ecommerceModuleStore: store,
};

function loadedCase<Props extends { variant: string; isServer: boolean }>(
  Entry: ComponentType<Props>,
  props: NoInfer<Props>,
) {
  return {
    variant: props.variant,
    renderEntry: (isServer: boolean) =>
      render(<Entry {...props} isServer={isServer} />),
  };
}

const propsVariants = [
  loadedCase(ProductCart, {
    ...loadedProps,
    variant: "me-ecommerce-module-product-cart-default",
  }),
  loadedCase(ProductCheckout, {
    ...loadedProps,
    variant: "me-ecommerce-module-product-checkout-default",
  }),
  loadedCase(Cart, {
    ...loadedProps,
    variant: "me-ecommerce-module-cart-default",
  }),
];

it.each(propsVariants)(
  "$variant renders a supplied Subject without a session reader or Provider in either runtime",
  ({ variant, renderEntry }) => {
    mockSubject = undefined;
    mockClientSubject = undefined;
    for (const isServer of [false, true]) {
      jest.clearAllMocks();
      renderEntry(isServer);
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
                ecommerceModuleProduct: product,
                ecommerceModuleStore: store,
              }
            : {}),
        }),
      );
      cleanup();
    }
  },
);
