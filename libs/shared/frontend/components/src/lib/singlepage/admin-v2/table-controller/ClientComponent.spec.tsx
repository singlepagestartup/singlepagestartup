/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 table-controller integration.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { createRoot, Root } from "react-dom/client";
import { useEffect, act } from "react";
import { Component } from "./ClientComponent";
import { useTableContext } from "./Context";

jest.mock("@sps/shared-ui-shadcn", () => ({
  Input: (props: any) => <input {...props} />,
  Button: ({ children, asChild, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  Select: ({ children, value, onValueChange }: any) => (
    <select
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectValue: () => null,
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children }: any) => <>{children}</>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <>{children}</>,
  SheetDescription: ({ children }: any) => <>{children}</>,
}));

function Probe() {
  const ctx = useTableContext();

  useEffect(() => {
    if (!ctx || ctx.total === 250) {
      return;
    }

    ctx.setState((prev) => ({
      ...prev,
      total: 250,
    }));
  }, [ctx, ctx?.total]);

  return (
    <div>
      <span data-testid="search">{ctx?.search}</span>
      <span data-testid="debounced-search">{ctx?.debouncedSearch}</span>
      <span data-testid="offset">{ctx?.offset}</span>
      <span data-testid="limit">{ctx?.limit}</span>
      <span data-testid="total">{ctx?.total}</span>
    </div>
  );
}

function SearchSetter() {
  const ctx = useTableContext();

  useEffect(() => {
    if (!ctx || ctx.search === "chair") {
      return;
    }

    ctx.setState((prev) => ({
      ...prev,
      search: "chair",
    }));
  }, [ctx, ctx?.search]);

  return null;
}

describe("admin-v2 table-controller integration", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.useRealTimers();
  });

  it("updates search and debounced search value", () => {
    act(() => {
      root.render(
        <Component module="ecommerce" name="product" variant="admin-v2-table">
          <Probe />
          <SearchSetter />
        </Component>,
      );
    });

    expect(container.querySelector('[data-testid="search"]')?.textContent).toBe(
      "chair",
    );
    expect(
      container.querySelector('[data-testid="debounced-search"]')?.textContent,
    ).toBe("");

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(
      container.querySelector('[data-testid="debounced-search"]')?.textContent,
    ).toBe("chair");
  });

  it("changes pagination when next button is clicked", () => {
    act(() => {
      root.render(
        <Component module="ecommerce" name="product" variant="admin-v2-table">
          <Probe />
        </Component>,
      );
    });

    expect(container.textContent).toContain("Page 1 of 3 (250 total)");
    expect(container.querySelector('[data-testid="offset"]')?.textContent).toBe(
      "0",
    );

    const nextButton = container.querySelector(
      'button[aria-label="Next page"]',
    ) as HTMLButtonElement | null;

    expect(nextButton).toBeTruthy();

    act(() => {
      nextButton?.click();
    });

    expect(container.textContent).toContain("Page 2 of 3 (250 total)");
    expect(container.querySelector('[data-testid="offset"]')?.textContent).toBe(
      "100",
    );
  });
});
beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
});
