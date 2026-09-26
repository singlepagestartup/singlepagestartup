/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: rbac order update action behavior.
 *
 * Given: the order's lines are bound into the real update form through mocked relation components.
 * When: the user submits the update with a line quantity.
 * Then: a whole-number quantity within the order line bounds reaches the update mutation with the
 * subject id, the order id and the lines, and any other quantity is stopped by the form.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { quantityBounds } from "@sps/ecommerce/relations/orders-to-products/sdk/model";

const mutateMock = jest.fn();
let orderLines: { id: string; quantity: unknown }[] = [];

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleOrderUpdate: () => ({
      mutate: mutateMock,
      isSuccess: false,
    }),
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn() },
}));

jest.mock("@sps/shared-ui-shadcn", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Form: ({ children }: any) => <div>{children}</div>,
}));

jest.mock(
  "@sps/ecommerce/relations/orders-to-products/frontend/component",
  () => {
    const { useEffect } = jest.requireActual("react");

    function LineField({ form, name, field, data }: any) {
      useEffect(() => {
        form.setValue(name, data[field]);
      }, [form, name, field, data]);

      return <input data-testid={name} readOnly />;
    }

    return {
      Component: (props: any) => {
        if (props.variant === "find") {
          return props.children ? props.children({ data: orderLines }) : null;
        }

        return <LineField {...props} />;
      },
    };
  },
);

import { Component } from "./ClientComponent";

async function renderAndSubmit() {
  render(
    <Component
      isServer={false}
      variant="ecommerce-module-order-update-default"
      data={{ id: "subject-1" } as any}
      order={{ id: "order-1" } as any}
      language="en"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "Update" }));

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

describe("Given: order update-default action component", () => {
  beforeEach(() => {
    mutateMock.mockReset();
  });

  /**
   * BDD Scenario
   * Given: the order has one line with a quantity of 3.
   * When: the user submits the update.
   * Then: the mutation receives the subject id, the order id and the line.
   */
  it("When: update button is submitted Then: mutation receives id, orderId, and order lines", async () => {
    orderLines = [{ id: "line-1", quantity: 3 }];

    await renderAndSubmit();

    expect(mutateMock).toHaveBeenCalledWith({
      id: "subject-1",
      orderId: "order-1",
      data: {
        ordersToProducts: [{ id: "line-1", quantity: 3 }],
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the order has one line with a quantity of 0, a negative number, a
   * fraction or a value above the maximum.
   * When: the user submits the update.
   * Then: the form stops the submission and the mutation is not called.
   */
  it.each([0, -1, 1.5, quantityBounds.max + 1])(
    "When: the line quantity is %p Then: the form does not submit",
    async (quantity) => {
      orderLines = [{ id: "line-1", quantity }];

      await renderAndSubmit();

      expect(mutateMock).not.toHaveBeenCalled();
    },
  );
});
