/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
jest.mock("@sps/shared-frontend-components/singlepage/analytics-link", () => ({
  AnalyticsLink: ({ analytics, children, ...props }: any) => (
    <a {...props}>{children}</a>
  ),
}));
jest.mock("@sps/ui-adapter", () => ({
  Icon: ({ name }: any) => <svg aria-hidden="true" data-icon={name} />,
}));
import { Component } from "./Component";

it("preserves localized internal destinations on a primary action", () => {
  render(
    <Component
      variant="action"
      isServer={false}
      language="ru"
      data={
        {
          id: "start",
          url: "/framework/modules",
          title: { ru: "Все модули", en: "All modules" },
        } as any
      }
    />,
  );
  const action = screen.getByRole("link", { name: "Все модули" });
  expect(action.getAttribute("href")).toBe("/ru/framework/modules");
  expect(action.getAttribute("target")).toBeNull();
});
it("keeps a repository link external and omits its trailing arrow in the quiet variant", () => {
  const { container } = render(
    <Component
      variant="repository-link"
      isServer={false}
      language="ru"
      data={
        {
          id: "repo",
          url: "https://github.com/example/project",
          title: { ru: "GitHub" },
        } as any
      }
    />,
  );
  const action = screen.getByRole("link", { name: /GitHub/ });
  expect(action.getAttribute("target")).toBe("_blank");
  expect(action.getAttribute("rel")).toBe("noopener noreferrer");
  expect(container.querySelector('[data-icon="github-logo"]')).toBeTruthy();
  expect(container.querySelector('[data-icon="arrow-up-right"]')).toBeNull();
});
