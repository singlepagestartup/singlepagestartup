/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Component } from "./ClientComponent";
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
it("opens saved navigation for the keyboard, closes on navigation and restores toggle focus on Escape", () => {
  render(
    <Component
      data={{ id: "navbar" } as any}
      variant="navbar-default"
      language="en"
      content={
        <a href="/en/saved">
          <span>Saved link</span>
        </a>
      }
    />,
  );
  const toggle = screen.getByRole("button", { name: "Open menu" });
  const link = screen.getByRole("link", { name: "Saved link" });
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(document.activeElement).toBe(link);
  fireEvent.click(screen.getByText("Saved link"));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(link.getAttribute("href")).toBe("/en/saved");
  fireEvent.click(toggle);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
});
it("keeps the saved logo and account/cart slots outside the collapsed navigation", () => {
  render(
    <Component
      data={{ id: "navbar" } as any}
      variant="navbar-default"
      language="en"
      logotype={<a href="/en">Saved brand</a>}
      content={
        <>
          <a href="/en/blog">Blog</a>
          <a href="/ru">RU</a>
        </>
      }
    >
      <button type="button">Cart</button>
      <a href="/en/account">Account</a>
    </Component>,
  );
  const navigation = screen.getByRole("navigation", {
    name: "Main navigation",
  });
  expect(within(navigation).queryByRole("button", { name: "Cart" })).toBeNull();
  expect(
    within(navigation).queryByRole("link", { name: "Account" }),
  ).toBeNull();
  expect(
    within(navigation).queryByRole("link", { name: "Saved brand" }),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Cart" })).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Account" }).getAttribute("href"),
  ).toBe("/en/account");
  const toggle = screen.getByRole("button", { name: "Open menu" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  expect(screen.getAllByRole("link", { name: "Blog" })).toHaveLength(1);
  fireEvent.click(screen.getByRole("link", { name: "RU" }));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
});
it("uses Russian navigation controls without replacing saved destinations", () => {
  render(
    <Component
      data={{ id: "navbar" } as any}
      variant="navbar-default"
      language="ru"
      content={<a href="/ru/blog">Блог</a>}
    />,
  );
  const toggle = screen.getByRole("button", { name: "Открыть меню" });
  fireEvent.click(toggle);
  expect(screen.getByRole("button", { name: "Закрыть меню" })).toBe(toggle);
  expect(
    screen.getByRole("navigation", { name: "Основная навигация" }),
  ).toBeTruthy();
  expect(screen.getByRole("link", { name: "Блог" }).getAttribute("href")).toBe(
    "/ru/blog",
  );
});
