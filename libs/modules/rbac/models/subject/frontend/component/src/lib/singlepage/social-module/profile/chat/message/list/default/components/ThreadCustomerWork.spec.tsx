/** @jest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import type { ICustomerWorkView } from "@sps/rbac/models/subject/sdk/model";
import { ThreadCustomerWork } from "./ThreadCustomerWork";

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    orderWork: { read: () => ({}) },
    changeCustomerWork: () => ({}),
  },
}));

jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: jest.requireActual(
    "@sps/ecommerce/models/product/frontend/component/src/lib/singlepage/cart/default/Component",
  ).Component,
}));

jest.mock(
  "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component",
  () => ({
    Component: ({
      children,
      variant,
    }: {
      children?: (props: { data: { id: string }[] }) => React.ReactNode;
      variant: string;
    }) =>
      variant === "find" ? (
        children?.({ data: [{ id: "cover-image" }] })
      ) : (
        <img alt="Обложка товара" src="/cover.jpg" />
      ),
  }),
);

const work: ICustomerWorkView = {
  storeId: "store",
  taskId: "task",
  chatId: "chat",
  threadId: "thread",
  orderId: "order",
  offerId: "offer",
  productSlug: "cover",
  assignment: "unassigned",
  status: "active",
  customerPays: false,
  messages: [],
};

function renderOrder(order: ICustomerWorkView) {
  render(
    <ThreadCustomerWork
      subjectId="subject"
      work={order}
      productTitle="Обложка"
      language="ru"
      resultSectionRef={null}
      onVersionSelect={jest.fn()}
    />,
  );
  return within(
    screen.getByRole("heading", { name: "Заказ" }).closest("section")!,
  );
}

it("shows a read-only cart product with its cover, quantity and one exact order link", () => {
  const order = renderOrder({
    ...work,
    cartProposal: {
      id: "confirmed-proposal",
      orderId: "order",
      offerId: "offer",
      title: "Название подтверждённого предложения",
      currencyId: "rub",
      currency: "rub",
      quantity: 2,
      amount: "1590",
      expiresAt: "2026-11-21T10:00:00.000Z",
    },
    orderSummary: {
      product: {
        id: "product",
        slug: "cover",
        title: { ru: "Обложка" },
        shortDescription: {},
        type: "one_off",
      },
      quantity: 2,
      offerId: "offer",
      total: { amount: 1590, symbol: "₽", precision: 2 },
    },
  });

  expect(
    order.getByRole("img", { name: "Обложка товара" }).getAttribute("src"),
  ).toBe("/cover.jpg");
  expect(order.getByText("Количество 2")).toBeTruthy();
  expect(order.getByText("Итого по заказу")).toBeTruthy();
  expect(order.getByText(/590 ₽/)).toBeTruthy();
  expect(order.queryByText("Название подтверждённого предложения")).toBeNull();
  expect(order.getAllByRole("link")).toHaveLength(1);
  expect(
    order.getByRole("link", { name: "Обложка" }).getAttribute("href"),
  ).toBe("/ru/ecommerce/products/cover?offer=offer#order-order");
  expect(order.queryByRole("button")).toBeNull();
});

it("keeps one link for an older response with no projected order line", () => {
  const order = renderOrder(work);

  expect(order.getAllByRole("link")).toHaveLength(1);
  expect(
    order.getByRole("link", { name: "Обложка" }).getAttribute("href"),
  ).toBe("/ru/ecommerce/products/cover?offer=offer#order-order");
  expect(order.queryByText("Итого по заказу")).toBeNull();
});
