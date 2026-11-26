/** @jest-environment jsdom */
/**
 * BDD Suite: Account settings navigation.
 * Given: an authenticated account viewing Settings in Russian.
 * When: the account opens the privacy link or signs out.
 * Then: destinations retain the current locale.
 */
import { fireEvent, render, screen } from "@testing-library/react";
const logout = jest.fn();
const mockSubjectProps = jest.fn();
jest.mock("client-only", () => ({}), { virtual: true });
jest.mock("server-only", () => ({}), { virtual: true });
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/ru/rbac/subjects/settings",
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
  Component: (props: any) => {
    mockSubjectProps(props);
    return props.variant === "authentication-me-default"
      ? props.children({ data: { id: "subject" }, authenticated: true })
      : null;
  },
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
  expect(
    screen.getByRole("link", { name: "Заказы" }).getAttribute("href"),
  ).toBe("/ru/rbac/subjects/orders");
  expect(screen.getByRole("link", { name: "Чаты" }).getAttribute("href")).toBe(
    "/ru/social/chats",
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
  expect(screen.queryByRole("link", { name: "Мои проекты" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
  expect(logout).toHaveBeenCalledWith({
    redirectTo: "/ru/rbac/subject/authentication/email-and-password",
  });
});
it("uses the authenticated Subject for the profile and purchase history", () => {
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
  expect(mockSubjectProps).toHaveBeenLastCalledWith(
    expect.objectContaining({
      variant: "me-social-module-profile-list-settings-ai-chat",
      dataSource: "props",
      data: { id: "subject" },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Покупки" }));
  expect(mockSubjectProps).toHaveBeenLastCalledWith(
    expect.objectContaining({
      variant: "me-ecommerce-module-order-list-ai-chat",
      isServer: false,
      dataSource: "props",
      data: { id: "subject" },
    }),
  );
});
