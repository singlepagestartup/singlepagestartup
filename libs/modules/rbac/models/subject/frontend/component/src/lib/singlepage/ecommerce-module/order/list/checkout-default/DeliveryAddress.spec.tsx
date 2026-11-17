/** @jest-environment jsdom */
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DeliveryAddress } from "./DeliveryAddress";

const onSelection = jest.fn();
const mockSearch = jest.fn();
jest.mock("@sps/ecommerce/relations/stores-to-products/sdk/client", () => ({
  api: { addressSuggestions: (props: unknown) => mockSearch(props) },
}));

function Field() {
  const [value, setValue] = useState("Existing address");
  return (
    <DeliveryAddress
      id="shipping-address"
      label="Адрес доставки"
      language="ru"
      offerId="courier"
      className=""
      value={value}
      onChange={(address, selected) => {
        setValue(address);
        if (selected) onSelection(address);
      }}
    />
  );
}

beforeEach(() => {
  onSelection.mockClear();
  mockSearch.mockReset();
  mockSearch.mockImplementation(({ data, reactQueryOptions }) => ({
    data: {
      suggestions: reactQueryOptions.enabled
        ? [data.query + " 1", data.query + " 2"]
        : [],
      attribution: [{ label: "Test provider", url: "https://example.com/" }],
    },
  }));
});

it("queries edited prefixes only, hides stale results and uses the highlighted address for pricing", async () => {
  render(<Field />);
  const field = screen.getByRole("combobox", { name: "Адрес доставки" });
  fireEvent.focus(field);
  expect(mockSearch).not.toHaveBeenCalledWith(
    expect.objectContaining({ reactQueryOptions: { enabled: true } }),
  );
  fireEvent.change(field, { target: { value: "Не" } });
  expect(field.getAttribute("aria-expanded")).toBe("false");
  fireEvent.change(field, { target: { value: "Невский" } });
  await screen.findByRole("option", { name: "Невский 1" });
  expect(
    screen.getByRole("link", { name: "Test provider" }).getAttribute("href"),
  ).toBe("https://example.com/");
  fireEvent.change(field, { target: { value: "Невский проспект" } });
  expect(screen.queryByRole("option", { name: "Невский 1" })).toBeNull();
  await screen.findByRole("option", { name: "Невский проспект 1" });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(onSelection).toHaveBeenCalledWith("Невский проспект 2");
  expect((field as HTMLInputElement).value).toBe("Невский проспект 2");
  expect(field.getAttribute("aria-expanded")).toBe("false");
});

it("keeps manual entry possible after failure and dismisses suggestions without changing the address", async () => {
  render(<Field />);
  const field = screen.getByRole("combobox");
  fireEvent.change(field, { target: { value: "Литейный" } });
  const option = await screen.findByRole("option", { name: "Литейный 1" });
  fireEvent.keyDown(field, { key: "Escape" });
  expect(document.contains(option)).toBe(false);
  expect((field as HTMLInputElement).value).toBe("Литейный");
  mockSearch.mockImplementation(({ reactQueryOptions }) => ({
    isError: reactQueryOptions.enabled,
  }));
  fireEvent.change(field, { target: { value: "Литейный проспект 4" } });
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "Введите адрес полностью",
    ),
  );
  expect((field as HTMLInputElement).value).toBe("Литейный проспект 4");
  expect(onSelection).not.toHaveBeenCalled();
});
