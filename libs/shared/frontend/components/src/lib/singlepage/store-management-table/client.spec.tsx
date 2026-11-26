/** @jest-environment jsdom */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Component as Table } from "./index";
import {
  firstPage,
  type IStoreTableParams,
  type IStoreTablePage,
} from "./interface";

jest.mock("@sps/ui-adapter", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

const view = {
  isServer: false as const,
  language: "en",
  title: "Orders",
  header: <div>Order number</div>,
  renderRow: (item: string) => <li key={item}>{item}</li>,
  emptyMessage: "No orders yet.",
  deniedMessage: "Access denied.",
};
const orders = Array.from({ length: 23 }, (_, i) => `Order ${i + 1}`);

function readPage(
  { search, offset, limit }: IStoreTableParams,
  source = orders,
) {
  const matches = source.filter((order) => order.includes(search));
  return {
    data: {
      items: matches.slice(offset, offset + limit),
      total: matches.length,
    },
    isError: false,
    refetch: jest.fn(),
  };
}

it("shows the filtered range, resets pagination after a debounced search and changes page size", () => {
  jest.useFakeTimers();
  try {
    const usePage = jest.fn((params: IStoreTableParams) => readPage(params));
    render(<Table {...view} usePage={usePage} />);
    const next = screen.getByRole("button", { name: "Next page" });
    expect(screen.getByText("1–10 of 23")).toBeTruthy();
    expect(screen.getByRole("list", { name: "Orders" })).toBeTruthy();
    fireEvent.click(next);
    expect(screen.getByText("11–20 of 23")).toBeTruthy();
    const search = screen.getByRole("searchbox", { name: "Search" });
    fireEvent.change(search, { target: { value: "  Order 2  " } });
    expect(usePage.mock.calls.at(-1)?.[0].offset).toBe(10);
    act(() => jest.advanceTimersByTime(300));
    expect(usePage.mock.calls.at(-1)?.[0]).toEqual({
      search: "Order 2",
      offset: 0,
      limit: 10,
    });
    expect(screen.getByText("1–5 of 5")).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(search, { target: { value: "" } });
    act(() => jest.advanceTimersByTime(300));
    fireEvent.click(next);
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Rows per page" }), {
      key: "ArrowDown",
    });
    fireEvent.click(screen.getByRole("option", { name: "20" }));
    expect(screen.getByText("1–20 of 23")).toBeTruthy();
    fireEvent.click(next);
    expect(screen.getByText("21–23 of 23")).toBeTruthy();
  } finally {
    jest.useRealTimers();
  }
});

it("moves back to the last available page when records disappear", () => {
  const { rerender } = render(
    <Table {...view} usePage={(params) => readPage(params)} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  rerender(
    <Table
      {...view}
      usePage={(params) => readPage(params, orders.slice(0, 8))}
    />,
  );
  expect(screen.getByText("1–8 of 8")).toBeTruthy();
  expect(screen.getAllByRole("listitem")).toHaveLength(8);
});

it("supplies server data only to the matching query and clears cached rows on access denial", () => {
  const initialData = readPage(firstPage).data;
  const usePage = jest.fn(
    (params: IStoreTableParams, seed?: IStoreTablePage<string>) => ({
      ...readPage(params),
      data: seed ?? readPage(params).data,
    }),
  );
  const { rerender } = render(
    <Table {...view} initialData={initialData} usePage={usePage} />,
  );
  expect(usePage).toHaveBeenLastCalledWith(firstPage, initialData);
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(usePage).toHaveBeenLastCalledWith(
    { ...firstPage, offset: 10 },
    undefined,
  );
  const refetch = jest.fn();
  rerender(
    <Table
      {...view}
      usePage={() => ({ data: initialData, isError: true, refetch })}
    />,
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(10);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(refetch).toHaveBeenCalledTimes(1);
  rerender(
    <Table
      {...view}
      usePage={() => ({
        data: initialData,
        isError: true,
        denied: true,
        refetch,
      })}
    />,
  );
  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByRole("alert").textContent).toBe("Access denied.");
});

it("keeps the search input available for loading and empty results", () => {
  const { rerender } = render(
    <Table
      {...view}
      usePage={() => ({ isError: false, refetch: jest.fn() })}
    />,
  );
  expect(screen.getByText("Loading…")).toBeTruthy();
  const search = screen.getByRole("searchbox");
  const header = screen.getByText("Order number");
  rerender(<Table {...view} usePage={(params) => readPage(params, [])} />);
  expect(screen.getByText("0 of 0")).toBeTruthy();
  expect(screen.getByText(view.emptyMessage)).toBeTruthy();
  expect(screen.getByText("Order number")).toBe(header);
  expect(screen.getByRole("searchbox")).toBe(search);
});
