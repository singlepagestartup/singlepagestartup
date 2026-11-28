/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./Component";
import { variant } from "./interface";

jest.mock("@sps/ui-adapter", () => ({
  Icon: () => <span data-testid="cover-placeholder" />,
}));

const props = {
  variant,
  isServer: false,
  dataSource: "props" as const,
  data: { id: "saved-item", slug: "gift-set", title: { und: "Original name" } },
  language: "en",
  quantity: 2,
  priceLabel: "$130.00",
  coverUrl: "/api/files/cover.jpg",
};

it("shows the purchased quantity and recorded total, links to the catalog and recovers a broken cover", () => {
  const { container } = render(<Component {...props} />);
  const link = screen.getByRole("link", {
    name: "Open product: Original name",
  });
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(link.getAttribute("href")).toBe("/en/ecommerce/products/gift-set");
  expect(
    link.contains(screen.getByRole("heading", { name: "Original name" })),
  ).toBe(true);
  expect(link.contains(screen.getByText("Qty 2"))).toBe(true);
  expect(link.contains(screen.getByText("$130.00"))).toBe(true);
  expect(link.querySelector("img")).toBeTruthy();
  link.focus();
  expect(document.activeElement).toBe(link);
  const image = container.querySelector("img")!;
  expect(new URL(image.src).pathname).toBe("/api/files/cover.jpg");
  fireEvent.error(image);
  expect(screen.getByTestId("cover-placeholder")).toBeTruthy();
});

it("keeps an unavailable historical line without claiming a price or offering a dead link", () => {
  render(
    <Component
      {...props}
      data={{ id: "archived", title: { ru: "Архивный товар" } }}
      language="ru"
      priceLabel={undefined}
      coverUrl={undefined}
    />,
  );
  expect(screen.getByRole("heading", { name: "Архивный товар" })).toBeTruthy();
  expect(screen.getByText("2 шт.")).toBeTruthy();
  expect(screen.getByText("Товар недоступен")).toBeTruthy();
  expect(screen.getByText("Цена не сохранилась")).toBeTruthy();
  expect(screen.queryByRole("link")).toBeNull();
});
