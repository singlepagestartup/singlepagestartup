/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Stores } from "./Stores";

jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: { crmWorkspace: { useStores: jest.fn() } },
}));

const useStores = jest.mocked(api.crmWorkspace.useStores);

it("links each listed store to its overview and shows both counts", () => {
  useStores.mockReturnValue({
    isSuccess: true,
    data: [
      {
        id: "one",
        slug: "studio",
        title: "Студия",
        canManageCatalog: true,
        productCount: 3,
        employeeCount: 0,
      },
      {
        id: "two",
        slug: "shop",
        title: "Магазин",
        canManageCatalog: false,
        productCount: 0,
        employeeCount: 2,
      },
    ],
  } as unknown as ReturnType<typeof useStores>);

  render(<Stores subjectId="owner" language="ru" />);

  expect(useStores).toHaveBeenCalledWith("owner");
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Создать магазин" })).toHaveAttribute(
    "href",
    "/ru/crm/workspace/new",
  );
  const studio = screen.getByRole("link", { name: "Студия" });
  expect(studio).toHaveAttribute("href", "/ru/ecommerce/stores/studio");
  expect(studio).toHaveAccessibleDescription("Товары 3 Сотрудники 0");
  const shop = screen.getByRole("link", { name: "Магазин" });
  expect(shop).toHaveAttribute("href", "/ru/ecommerce/stores/shop");
  expect(shop).toHaveAccessibleDescription("Товары 0 Сотрудники 2");
});

it("offers creation in the current language when the list is empty", () => {
  useStores.mockReturnValue({
    isSuccess: true,
    data: [],
  } as unknown as ReturnType<typeof useStores>);
  render(<Stores subjectId="owner" language="en" />);

  expect(screen.getByText("You do not have any stores yet.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Create store" })).toHaveAttribute(
    "href",
    "/en/crm/workspace/new",
  );
});
