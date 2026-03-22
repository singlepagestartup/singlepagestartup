/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 form client loader.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { Component } from "./client";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

describe("GIVEN: admin-v2 form client loader", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  it("WHEN data.id is provided and API returns entity THEN hydrated entity is forwarded to child with isServer=false", () => {
    const findById = jest.fn().mockReturnValue({
      data: { id: "entity-1", adminTitle: "Hydrated Entity" },
      isLoading: false,
    });
    const childSpy = jest.fn((props: any) => (
      <div data-testid="child-title">{props.data?.adminTitle}</div>
    ));

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        data={{ id: "entity-1" } as any}
        api={{ findById } as any}
        Component={childSpy as any}
      />,
    );

    expect(findById).toHaveBeenCalledWith({ id: "entity-1" });
    expect(childSpy).toHaveBeenCalled();
    expect(childSpy.mock.calls[0]?.[0]?.isServer).toBe(false);
    expect(childSpy.mock.calls[0]?.[0]?.data).toEqual({
      id: "entity-1",
      adminTitle: "Hydrated Entity",
    });
    expect(
      harness.container.querySelector('[data-testid="child-title"]')
        ?.textContent,
    ).toBe("Hydrated Entity");
  });

  it("WHEN API is loading for data.id THEN skeleton fallback is rendered", () => {
    const findById = jest.fn().mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        data={{ id: "entity-2" } as any}
        api={{ findById } as any}
        Skeleton={<div data-testid="form-skeleton">loading</div>}
        Component={() => <div data-testid="child">child</div>}
      />,
    );

    expect(
      harness.container.querySelector('[data-testid="form-skeleton"]')
        ?.textContent,
    ).toBe("loading");
  });

  it("WHEN no data.id is provided THEN passthrough data is forwarded to child without findById call", () => {
    const findById = jest.fn();
    const childSpy = jest.fn((props: any) => (
      <div data-testid="child-mode">{props.data ? "with-data" : "no-data"}</div>
    ));

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        api={{ findById } as any}
        Component={childSpy as any}
      />,
    );

    expect(findById).not.toHaveBeenCalled();
    expect(childSpy).toHaveBeenCalled();
    expect(childSpy.mock.calls[0]?.[0]?.isServer).toBe(false);
    expect(childSpy.mock.calls[0]?.[0]?.data).toBeUndefined();
    expect(
      harness.container.querySelector('[data-testid="child-mode"]')
        ?.textContent,
    ).toBe("no-data");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
