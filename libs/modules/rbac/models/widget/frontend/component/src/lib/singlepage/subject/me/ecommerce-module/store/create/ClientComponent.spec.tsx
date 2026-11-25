/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ClientComponent } from "./ClientComponent";

const mockPush = jest.fn();
const mockCreate = jest.fn();
let mockAuthenticated = true;
let mockPending = false;

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@sps/shared-ui-shadcn", () => ({ settingsFormStyles: {} }));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleCatalogMutation: () => ({
      isPending: mockPending,
      mutateAsync: mockCreate,
    }),
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ children }: { children: (session: object) => ReactNode }) =>
    children({ data: { id: "seller" }, authenticated: mockAuthenticated }),
}));

beforeEach(() => {
  jest.resetAllMocks();
  mockAuthenticated = true;
  mockPending = false;
});

it("creates the named store for the current subject and opens its settings", async () => {
  mockCreate.mockResolvedValue({ slug: "мой-магазин" });
  render(<ClientComponent language="ru" />);
  const field = screen.getByRole("textbox", { name: "Название магазина" });
  const submit = screen.getByRole("button", { name: "Создать магазин" });
  expect(screen.getByRole("link", { name: "Отмена" })).toHaveAttribute(
    "href",
    "/ru/crm/workspace",
  );
  fireEvent.change(field, { target: { value: "   " } });
  expect(submit).toBeDisabled();
  fireEvent.change(field, { target: { value: " Мой магазин " } });
  fireEvent.click(submit);
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockCreate).toHaveBeenCalledWith({
    id: "seller",
    data: {
      method: "POST",
      entity: "stores",
      data: { adminTitle: "Мой магазин", title: { ru: "Мой магазин" } },
    },
  });
  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith(
      `/ru/ecommerce/stores/${encodeURIComponent("мой-магазин")}/settings`,
    ),
  );
});

it("keeps the name on failure and disables repeated submission while pending", async () => {
  mockCreate.mockRejectedValue(new Error("Store unavailable"));
  const { rerender } = render(<ClientComponent language="en" />);
  const field = screen.getByRole("textbox", { name: "Store name" });
  fireEvent.change(field, { target: { value: "Roses" } });
  mockPending = true;
  rerender(<ClientComponent language="en" />);
  expect(screen.getByRole("button")).toBeDisabled();
  fireEvent.submit(screen.getByRole("form"));
  expect(mockCreate).not.toHaveBeenCalled();
  mockPending = false;
  rerender(<ClientComponent language="en" />);
  fireEvent.click(screen.getByRole("button"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Store unavailable",
  );
  expect(field).toHaveValue("Roses");
  expect(mockPush).not.toHaveBeenCalled();
});

it("requires authentication before showing the form", () => {
  mockAuthenticated = false;
  render(<ClientComponent language="ru" />);
  expect(
    screen.getByText("Войдите в аккаунт, чтобы создать магазин."),
  ).toBeVisible();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(mockCreate).not.toHaveBeenCalled();
});
