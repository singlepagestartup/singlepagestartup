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

import { useEffect, act } from "react";
import { Component } from "./ClientComponent";
import { useTableContext } from "./Context";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

jest.mock("@sps/shared-ui-shadcn", () => {
  return jest.requireActual("../test-utils/shadcn-mocks").adminV2ShadcnMocks;
});

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

describe("GIVEN: admin-v2 table-controller integration", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    jest.useFakeTimers();
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
    jest.useRealTimers();
  });

  it("WHEN search state changes THEN debounced search value is updated after debounce delay", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        module="ecommerce"
        name="product"
        variant="admin-v2-table"
      >
        <Probe />
        <SearchSetter />
      </Component>,
    );

    expect(
      harness.container.querySelector('[data-testid="search"]')?.textContent,
    ).toBe("chair");
    expect(
      harness.container.querySelector('[data-testid="debounced-search"]')
        ?.textContent,
    ).toBe("");

    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(
      harness.container.querySelector('[data-testid="debounced-search"]')
        ?.textContent,
    ).toBe("chair");
  });

  it("WHEN next page button is clicked THEN offset and visible page metadata are updated", () => {
    renderInHarness(
      harness,
      <Component
        isServer={false}
        module="ecommerce"
        name="product"
        variant="admin-v2-table"
      >
        <Probe />
      </Component>,
    );

    expect(harness.container.textContent).toContain("Page 1 of 3 (250 total)");
    expect(
      harness.container.querySelector('[data-testid="offset"]')?.textContent,
    ).toBe("0");

    const nextButton = harness.container.querySelector(
      'button[aria-label="Next page"]',
    ) as HTMLButtonElement | null;

    expect(nextButton).toBeTruthy();

    act(() => {
      nextButton?.click();
    });

    expect(harness.container.textContent).toContain("Page 2 of 3 (250 total)");
    expect(
      harness.container.querySelector('[data-testid="offset"]')?.textContent,
    ).toBe("100");
  });
});
beforeAll(() => {
  enableReactActEnvironment();
});
