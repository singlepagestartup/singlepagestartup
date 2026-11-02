/** @jest-environment jsdom */
/**
 * BDD Suite: Account settings navigation.
 * Given: an authenticated account viewing Settings in Russian.
 * When: the account opens privacy/project links or signs out.
 * Then: destinations retain the current locale.
 */
import { fireEvent, render, screen } from "@testing-library/react";
const logout = jest.fn();
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
  usePathname: () => "/ru/ai-chat/settings",
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
jest.mock("@sps/rbac/models/widget/sdk/client", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  api: { findById: () => ({ data: { id: "settings" }, isLoading: false }) },
}));
jest.mock("@sps/rbac/models/widget/sdk/server", () => ({ api: {} }));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: { authenticationLogout: () => ({ mutate: logout }) },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) =>
    props.variant === "authentication-me-default"
      ? props.children({ data: { id: "subject" }, authenticated: true })
      : null,
}));
import { Component as Widget } from "@sps/rbac/models/widget/frontend/component";
jest.mock("@sps/rbac/models/widget/frontend/component", () => ({
  Component: (props: any) => jest.requireActual("./index").Component(props),
}));
it("retains Russian in Data and privacy links and sign-out redirect", () => {
  render(
    <Widget
      {...({
        isServer: false,
        variant: "subject-me-profile-settings",
        language: "ru",
        data: { id: "settings" },
      } as any)}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Данные и конфиденциальность" }),
  );
  expect(
    screen
      .getByRole("link", {
        name: "как обрабатываются и хранятся ваши материалы",
      })
      .getAttribute("href"),
  ).toBe("/ru/privacy");
  expect(
    screen.getByRole("link", { name: "Мои проекты" }).getAttribute("href"),
  ).toBe("/ru/ai-chat/projects");
  fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
  expect(logout).toHaveBeenCalledWith({ redirectTo: "/ru/ai-chat/sign-in" });
});
