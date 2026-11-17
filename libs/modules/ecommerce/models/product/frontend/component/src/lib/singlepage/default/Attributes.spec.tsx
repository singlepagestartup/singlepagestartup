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
    "../../../../../../../../../../shared/utils/src/lib/constants",
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
        data: apiProps.params.filters.and[0].value.map((id: string) => ({
          id,
          attributeId: id,
          attributeKeyId: id,
        })),
      }),
  }),
);
jest.mock("@sps/ecommerce/models/attribute-key/frontend/component", () => ({
  Component: ({ children, variant, apiProps, data, language }: any) =>
    variant === "find" ? (
      children({
        data: attributeKeys.filter((key) =>
          apiProps.params.filters.and[0].value.includes(key.id),
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

it("counts only buyer attributes when collapsing the remaining characteristics", () => {
  for (let index = 0; index < 3; index += 1) {
    attributeKeys.push({
      id: `feature-${index}`,
      slug: `feature-${index}`,
      field: "string",
      title: { ru: `Характеристика ${index}` },
    });
    attributes.push({
      id: `feature-${index}`,
      attributeId: `feature-${index}`,
      string: { ru: `Значение ${index}` },
    });
  }
  try {
    render(
      <Component
        data={{ id: "product" } as any}
        isServer={false}
        language="ru"
      />,
    );
    expect(screen.getByText("Ещё характеристик: 1")).toBeTruthy();
    expect(screen.queryAllByText("—")).toHaveLength(0);
    expect(screen.getByText("Цвет")).toBeTruthy();
  } finally {
    attributeKeys.splice(3);
    attributes.splice(3);
  }
});
