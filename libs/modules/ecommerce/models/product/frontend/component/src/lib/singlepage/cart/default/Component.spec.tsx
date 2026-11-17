/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { TIPTAP_EMPTY_DOC } from "@sps/shared-utils";
import { Component } from "./Component";

jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: ({ value }: any) => (
    <div data-testid="short-description">{value}</div>
  ),
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));
jest.mock(
  "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component",
  () => ({
    Component: ({ children }: any) => children?.({ data: [] }) ?? null,
  }),
);

const props: any = {
  isServer: false,
  variant: "cart-default",
  language: "en",
  data: {
    id: "product",
    slug: "chair",
    title: { en: "Chair" },
    shortDescription: { en: "Oak chair", ru: "Дубовый стул" },
  },
};

it("keeps the localized description beneath its title and above cart controls", () => {
  render(
    <Component {...props}>
      <button type="button">Quantity and currency</button>
    </Component>,
  );
  const title = screen.getByRole("heading", { name: "Chair" });
  const description = screen.getByTestId("short-description");
  const controls = screen.getByRole("button", {
    name: "Quantity and currency",
  });
  expect(description.textContent).toBe("Oak chair");
  expect(
    title.compareDocumentPosition(description) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    description.compareDocumentPosition(controls) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.queryByText("Дубовый стул")).toBeNull();
});

it.each([undefined, "", TIPTAP_EMPTY_DOC])(
  "omits an absent or empty short description",
  (description) => {
    render(
      <Component
        {...props}
        data={{ ...props.data, shortDescription: { en: description } }}
      />,
    );
    expect(screen.queryByTestId("short-description")).toBeNull();
    expect(screen.getByRole("heading", { name: "Chair" })).toBeTruthy();
  },
);
