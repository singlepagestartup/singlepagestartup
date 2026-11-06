/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: ({ value }: any) => <div>{value}</div>,
}));
jest.mock(
  "@sps/website-builder/relations/slides-to-file-storage-module-files/frontend/component",
  () => ({ Component: ({ children }: any) => children?.({ data: [] }) }),
);
jest.mock(
  "@sps/website-builder/relations/slides-to-buttons-arrays/frontend/component",
  () => ({
    Component: ({ variant, children }: any) =>
      variant === "find" ? (
        children({ data: [{ id: "cta", orderIndex: 1, variant: "default" }] })
      ) : (
        <a href="/saved-cta">Saved CTA</a>
      ),
  }),
);
const data = {
  id: "slide",
  title: {},
  url: "https://example.com/saved",
  subtitle: {},
  description: {},
};
it("keeps a saved destination available without a localized title", () => {
  render(
    <Component
      isServer={false}
      variant="default"
      data={data as any}
      language="en"
    />,
  );
  expect(
    screen.getByRole("link", { name: "Open slide" }).getAttribute("href"),
  ).toBe(data.url);
  expect(
    screen.getByRole("link", { name: "Saved CTA" }).closest("a a"),
  ).toBeNull();
});
it("keeps title and CTA destinations independent", () => {
  render(
    <Component
      isServer={false}
      variant="default"
      data={{ ...data, title: { en: "Saved title" } } as any}
      language="en"
    />,
  );
  expect(
    screen.getByRole("link", { name: "Saved title" }).getAttribute("href"),
  ).toBe(data.url);
  expect(
    screen.getByRole("link", { name: "Saved CTA" }).getAttribute("href"),
  ).toBe("/saved-cta");
});
