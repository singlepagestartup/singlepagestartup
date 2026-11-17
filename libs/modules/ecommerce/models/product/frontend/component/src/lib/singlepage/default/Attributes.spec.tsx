/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";

const attributeKeys = [
  {
    id: "formula",
    slug: "price_formula",
    field: "string",
    title: { en: "Formula" },
  },
  {
    id: "version",
    slug: "formula_version",
    field: "string",
    title: { en: "Version" },
  },
  { id: "color", slug: "color", field: "string", title: { ru: "Цвет" } },
];
const attributes = [
  {
    id: "formula",
    attributeId: "formula",
    string: { en: "unit_price * quantity" },
  },
  { id: "version", attributeId: "version", string: { en: "1" } },
  { id: "color", attributeId: "color", string: { ru: "Дуб" } },
];
jest.mock("@sps/shared-utils", () =>
  jest.requireActual(
    "../../../../../../../../../../shared/utils/src/lib/constants/ecommerce",
  ),
);
jest.mock(
  "@sps/ecommerce/relations/products-to-attributes/frontend/component",
  () => ({
    Component: ({ children, variant, data, language }: any) =>
      variant === "find" ? (
        children({ data: attributes })
      ) : (
        <span>{data.string[language] ?? "—"}</span>
      ),
  }),
);
jest.mock(
  "@sps/ecommerce/relations/attribute-keys-to-attributes/frontend/component",
  () => ({
    Component: ({ children, apiProps }: any) =>
      children({
        data: [
          {
            id: apiProps.params.filters.and[0].value,
            attributeKeyId: apiProps.params.filters.and[0].value,
          },
        ],
      }),
  }),
);
jest.mock("@sps/ecommerce/models/attribute-key/frontend/component", () => ({
  Component: ({ children, variant, apiProps, data, language }: any) =>
    variant === "find" ? (
      children({
        data: attributeKeys.filter(
          (key) => key.id === apiProps.params.filters.and[0].value,
        ),
      })
    ) : (
      <span>{data.title[language] ?? "—"}</span>
    ),
}));
import { Component } from "./Attributes";
it("omits internal formula rows and keeps the localized buyer characteristic", () => {
  render(
    <Component
      data={{ id: "product" } as any}
      isServer={false}
      language="ru"
    />,
  );
  expect(screen.getByText("Цвет")).toBeTruthy();
  expect(screen.getByText("Дуб")).toBeTruthy();
  expect(screen.queryAllByText("—")).toHaveLength(0);
  expect(screen.queryByText("unit_price * quantity")).toBeNull();
});
