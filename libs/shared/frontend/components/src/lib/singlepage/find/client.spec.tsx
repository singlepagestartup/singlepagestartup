/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./client";
jest.mock("client-only", () => ({}));
jest.mock("@sps/shared-frontend-client-api", () => ({ factory: jest.fn() }));

it("keeps the mounted form, draft, focus and selection during background fetch/error", () => {
  const data = [{ id: "one" }];
  const find = jest.fn(() => ({
    data,
    isFetching: false,
    isLoading: false,
    isError: false,
  }));
  const props: any = {
    api: { find },
    children: ({ data }: any) =>
      data?.map((row: any) => (
        <input key={row.id} aria-label="Draft" defaultValue="" />
      )),
  };
  const view = render(<Component {...props} />);
  const input = screen.getByRole("textbox", {
    name: "Draft",
  }) as HTMLInputElement;
  fireEvent.change(input, { target: { value: "unsent draft" } });
  input.focus();
  input.setSelectionRange(2, 5);
  find.mockReturnValue({
    data,
    isFetching: true,
    isLoading: false,
    isError: false,
  });
  view.rerender(<Component {...props} />);
  expect(screen.getByRole("textbox", { name: "Draft" })).toBe(input);
  find.mockReturnValue({
    data,
    isFetching: false,
    isLoading: false,
    isError: true,
  });
  view.rerender(<Component {...props} />);
  expect(input.value).toBe("unsent draft");
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
  view.rerender(<Component {...props} keepDataWhileFetching={false} />);
  find.mockReturnValue({
    data,
    isFetching: true,
    isLoading: false,
    isError: false,
  });
  view.rerender(<Component {...props} keepDataWhileFetching={false} />);
  expect(screen.queryByRole("textbox", { name: "Draft" })).toBeNull();
});
