/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Component } from "./index";
import { variants } from "./variants";

jest.mock("./variants", () => ({
  variants: {
    default: jest.fn((props) => props.data.title),
    hidden: jest.fn(() => null),
  },
}));

beforeEach(() => jest.clearAllMocks());

it("dispatches the requested view instead of suppressing a record whose saved variant is hidden", () => {
  render(
    <Component
      {...({
        variant: "default",
        data: {
          id: "one",
          variant: "hidden",
          title: "Visible in the requested view",
        },
      } as any)}
    />,
  );
  expect(screen.getByText("Visible in the requested view")).toBeTruthy();
});

it("invokes the registered hidden component as an ordinary variant", () => {
  render(
    <Component {...({ variant: "hidden", data: { id: "one" } } as any)} />,
  );
  expect(variants.hidden).toHaveBeenCalled();
  expect(variants.default).not.toHaveBeenCalled();
});
