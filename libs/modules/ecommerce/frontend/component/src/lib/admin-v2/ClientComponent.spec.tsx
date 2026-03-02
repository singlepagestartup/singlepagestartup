/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: ecommerce admin-v2 route integration.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { createRoot, Root } from "react-dom/client";
import { act } from "react";
import { Component } from "./ClientComponent";

let pathname = "/admin";

const productComponentMock = jest.fn();
const attributeComponentMock = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, asChild, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock(
  "@sps/shared-frontend-components/singlepage/admin-v2/panel/Component",
  () => ({
    Component: ({ children }: any) => <div data-testid="panel">{children}</div>,
  }),
);

jest.mock("./sidebar-module-item", () => ({
  Component: () => <div data-testid="sidebar-module-item" />,
}));

jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: any) => {
    productComponentMock(props);
    return <div data-testid={`product:${props.variant}`} />;
  },
}));

jest.mock("@sps/ecommerce/models/attribute/frontend/component", () => ({
  Component: (props: any) => {
    attributeComponentMock(props);
    return <div data-testid={`attribute:${props.variant}`} />;
  },
}));

describe("ecommerce admin-v2 route integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  beforeEach(() => {
    pathname = "/admin";
    productComponentMock.mockClear();
    attributeComponentMock.mockClear();
  });

  it("renders product table route for /admin/ecommerce/product", () => {
    pathname = "/admin/ecommerce/product";

    act(() => {
      root.render(<Component adminBasePath="/admin" isServer={false} />);
    });

    const variants = productComponentMock.mock.calls.map(
      (call) => call[0].variant,
    );

    expect(variants).toContain("admin-v2-table");
    expect(productComponentMock.mock.calls[0][0].header?.props?.variant).toBe(
      "admin-v2-model-header",
    );
  });

  it("renders attribute table route for /admin/ecommerce/attribute", () => {
    pathname = "/admin/ecommerce/attribute";

    act(() => {
      root.render(<Component adminBasePath="/admin" isServer={false} />);
    });

    const variants = attributeComponentMock.mock.calls.map(
      (call) => call[0].variant,
    );

    expect(variants).toContain("admin-v2-table");
    expect(attributeComponentMock.mock.calls[0][0].header?.props?.variant).toBe(
      "admin-v2-model-header",
    );
  });

  it("renders module overview cards for /admin/ecommerce", () => {
    pathname = "/admin/ecommerce";

    act(() => {
      root.render(<Component adminBasePath="/admin" isServer={false} />);
    });

    expect(
      productComponentMock.mock.calls.some(
        (call) => call[0].variant === "admin-v2-module-overview-card",
      ),
    ).toBe(true);
    expect(
      attributeComponentMock.mock.calls.some(
        (call) => call[0].variant === "admin-v2-module-overview-card",
      ),
    ).toBe(true);
  });

  it("does not render module overview cards for /admin root", () => {
    pathname = "/admin";

    act(() => {
      root.render(<Component adminBasePath="/admin" isServer={false} />);
    });

    expect(
      productComponentMock.mock.calls.some(
        (call) => call[0].variant === "admin-v2-module-overview-card",
      ),
    ).toBe(false);
    expect(
      attributeComponentMock.mock.calls.some(
        (call) => call[0].variant === "admin-v2-module-overview-card",
      ),
    ).toBe(false);
  });

  it("returns null when route points to a different module", () => {
    pathname = "/admin/blog/article";

    act(() => {
      root.render(<Component adminBasePath="/admin" isServer={false} />);
    });

    expect(container.firstChild).toBeNull();
    expect(productComponentMock).not.toHaveBeenCalled();
    expect(attributeComponentMock).not.toHaveBeenCalled();
  });

  it("renders provided children instead of default content", () => {
    pathname = "/admin/ecommerce/product";

    act(() => {
      root.render(
        <Component adminBasePath="/admin" isServer={false}>
          <div data-testid="custom-child">Custom child content</div>
        </Component>,
      );
    });

    expect(
      container.querySelector('[data-testid="custom-child"]'),
    ).not.toBeNull();
    expect(
      productComponentMock.mock.calls.some(
        (call) => call[0].variant === "admin-v2-table",
      ),
    ).toBe(false);
  });
});
beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
});
