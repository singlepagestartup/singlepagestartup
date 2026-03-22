/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 form client UI component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { act } from "react";
import { Component } from "./ClientComponent";
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

describe("GIVEN: admin-v2 form client UI component", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  it("WHEN rendered in create mode THEN title is formatted as create action", () => {
    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        module="ecommerce"
        name="product-item"
        type="model"
      >
        <div data-testid="body-content">Body</div>
      </Component>,
    );

    expect(harness.container.textContent).toContain("Create Product Item");
    expect(
      harness.container.querySelector('[data-testid="body-content"]')
        ?.textContent,
    ).toBe("Body");
  });

  it("WHEN rendered in update mode THEN title and id metadata are visible", () => {
    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        module="ecommerce"
        name="product"
        id="entity-42"
        type="model"
      />,
    );

    expect(harness.container.textContent).toContain("Update Product");
    expect(harness.container.textContent).toContain("entity-42");
  });

  it("WHEN form status changes THEN save button text and state match pending/success/error branches", () => {
    const baseForm = {
      handleSubmit: jest.fn(() => jest.fn()),
    } as any;

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        module="ecommerce"
        name="product"
        form={baseForm}
        status="pending"
        onSubmit={jest.fn()}
      />,
    );

    const pendingButton = harness.container.querySelector("button");
    expect(pendingButton?.textContent).toContain("Saving...");
    expect((pendingButton as HTMLButtonElement | null)?.disabled).toBe(true);

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        module="ecommerce"
        name="product"
        form={baseForm}
        status="success"
        onSubmit={jest.fn()}
      />,
    );
    expect(harness.container.querySelector("button")?.className).toContain(
      "bg-green-500",
    );

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        module="ecommerce"
        name="product"
        form={baseForm}
        status="error"
        onSubmit={jest.fn()}
      />,
    );
    expect(harness.container.querySelector("button")?.className).toContain(
      "bg-red-500",
    );
  });

  it("WHEN save button is clicked THEN onSubmit is executed through form.handleSubmit", () => {
    const onSubmit = jest.fn();
    const handleSubmit = jest.fn((handler: (payload: any) => void) => {
      return () => handler({ id: "created-1" });
    });

    renderInHarness(
      harness,
      <Component
        variant="admin-v2-form"
        isServer={false}
        module="ecommerce"
        name="product"
        form={{ handleSubmit } as any}
        onSubmit={onSubmit}
      />,
    );

    const saveButton = harness.container.querySelector("button");
    expect(saveButton).toBeTruthy();

    act(() => {
      (saveButton as HTMLButtonElement).click();
    });

    expect(handleSubmit).toHaveBeenCalledWith(onSubmit);
    expect(onSubmit).toHaveBeenCalledWith({ id: "created-1" });
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});
