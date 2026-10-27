/** @jest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const mockFeatures = [
  { id: "one", variant: "step", title: { ru: "Создайте аккаунт" } },
  { id: "two", variant: "step", title: { ru: "Спроектируйте проект" } },
  { id: "brief", variant: "document", title: { ru: "Бриф" } },
  { id: "brand", variant: "document", title: { ru: "Бренд" } },
  { id: "three", variant: "step", title: { ru: "Опубликуйте проект" } },
  { id: "request", variant: "copy-request", title: { ru: "Работать с кодом" } },
];
const mockLinks = mockFeatures.map((feature, orderIndex) => ({
  id: `link-${feature.id}`,
  widgetId: "steps",
  featureId: feature.id,
  orderIndex,
}));
const mockModes: boolean[] = [];
jest.mock("@sps/shared-ui-shadcn", () => ({ TipTap: () => null }));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
}));
jest.mock("@sps/website-builder/models/feature/frontend/component", () => ({
  Component: ({ children, isServer }: any) => {
    mockModes.push(isServer);
    return children({ data: [...mockFeatures].reverse() });
  },
}));
jest.mock(
  "@sps/website-builder/relations/widgets-to-features/frontend/component",
  () => ({
    Component: ({ variant, data, children, isServer }: any) => {
      mockModes.push(isServer);
      if (variant === "find") return children({ data: mockLinks });
      const feature = mockFeatures.find((item) => item.id === data.featureId)!;
      return (
        <div data-linked-feature={data.featureId}>
          <h3>{feature.title.ru}</h3>
          {children as ReactNode}
        </div>
      );
    },
  }),
);
import { Component } from "./Component";

it("keeps documents inside their ordered step and the supplementary request collapsed", () => {
  const { container } = render(
    <Component
      variant="content-steps"
      isServer={false}
      language="ru"
      data={{ id: "steps", title: { ru: "Запуск" } } as any}
    />,
  );
  const steps = screen.getAllByRole("listitem");
  expect(steps).toHaveLength(3);
  expect(within(steps[0]).queryByText("Бриф")).toBeNull();
  expect(within(steps[1]).getByText("Бриф")).toBeTruthy();
  expect(within(steps[1]).getByText("Бренд")).toBeTruthy();
  expect(within(steps[2]).getByText("Опубликуйте проект")).toBeTruthy();
  const disclosure = container.querySelector("details")!;
  expect(disclosure.open).toBe(false);
  expect(disclosure.querySelector("summary")?.textContent).toBe(
    "Работать с кодом",
  );
  expect(
    disclosure.querySelector('[data-linked-feature="request"]'),
  ).toBeTruthy();
  expect(mockModes.every((mode) => mode === false)).toBe(true);
});
