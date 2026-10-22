/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./ClientComponent";
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
it("opens the mobile menu, closes on saved link navigation and restores toggle focus on Escape", () => {
  render(
    <Component
      data={{ id: "navbar" } as any}
      variant="navbar-default"
      language="en"
      content={<a href="/saved">Saved link</a>}
    />,
  );
  const toggle = screen.getByRole("button", { name: "Open menu" });
  fireEvent.click(toggle);
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(screen.getByRole("link", { name: "Saved link" }));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(toggle);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
});
