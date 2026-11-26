/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import type { TStoreCatalogDirectoryKind } from "@sps/rbac/models/subject/sdk/model";
import { ClientComponent } from "./ClientComponent";

const mockDetail = jest.fn();
const mockSave = jest.fn();
const mockList = jest.fn();
jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("../../StoreSection", () => ({
  StoreSection: ({ children }) =>
    children({
      access: { subjectId: "subject", store: { canManageCatalog: true } },
    }),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    storeCatalogDirectories: {
      useList: (props) => mockList(props),
      useDetail: (props) => mockDetail(props),
      useUpdate: () => ({ mutateAsync: mockSave }),
      useCreate: () => ({ reset: jest.fn() }),
    },
  },
}));
jest.mock(
  "@sps/shared-frontend-components/singlepage/store-management-table",
  () => ({
    Component: ({ action, renderRow, usePage }) => (
      <>
        {action}
        <ul>{usePage({ offset: 0, limit: 20 }).data.items.map(renderRow)}</ul>
      </>
    ),
  }),
);
jest.mock("@sps/ui-adapter", () => ({
  Select: ({ value, options, onValueChange, disabled, ...props }) => (
    <select
      aria-label={props["aria-label"]}
      disabled={disabled}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  ),
}));

function show(kind: TStoreCatalogDirectoryKind, canEdit = true) {
  const record = {
    id: "record",
    slug: "blue",
    adminTitle: "Blue",
    title: { en: "Blue" },
    field: "string",
    ...(kind === "attributes" && {
      value: { en: "Blue" },
      keyTranslations: { en: "Colour" },
    }),
    canEdit,
    canChangeField: false,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  mockList.mockReturnValue({
    data: { items: [record], total: 1, canCreate: true },
  });
  mockDetail.mockReturnValue({ data: record });
  render(
    <ClientComponent
      kind={kind}
      widgetId="widget"
      ecommerceModuleStore={{ id: "store" } as IStore}
      language="en"
    />,
  );
  return record;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockSave.mockResolvedValue({});
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

it.each(["categories", "attribute-keys", "attributes"] as const)(
  "opens %s from the keyboard, saves and returns focus to the same row",
  async (kind) => {
    const user = userEvent.setup();
    const record = show(kind);
    const row = screen.getByRole("button", {
      name: kind === "attributes" ? "Colour Blue" : /^Blue /,
    });
    row.focus();
    await user.keyboard("{Enter}");
    const label = {
      categories: "Category name",
      "attribute-keys": "Key name",
      attributes: "Value",
    }[kind];
    const field = await screen.findByRole("textbox", { name: label });
    expect(field).toHaveValue("Blue");
    if (kind === "attribute-keys")
      expect(screen.getByRole("combobox")).toBeDisabled();
    await user.clear(field);
    await user.type(field, "Green");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(mockSave).toHaveBeenCalledWith({
      kind,
      language: "en",
      expectedUpdatedAt: record.updatedAt,
      ...(kind === "attributes" ? { value: "Green" } : { title: "Green" }),
      ...(kind === "attribute-keys" && { field: "string" }),
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(row).toHaveFocus());
  },
);

it("shows shared records read-only and returns to the list with Escape", async () => {
  const user = userEvent.setup();
  show("categories", false);
  const row = screen.getByRole("button", { name: /^Blue / });
  await user.click(row);
  expect(
    await screen.findByRole("textbox", { name: "Category name" }),
  ).toHaveAttribute("readonly");
  expect(
    screen.queryByRole("button", { name: "Save" }),
  ).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() => expect(row).toHaveFocus());
});

it("offers a primary button to create a key inside the attribute form", async () => {
  const user = userEvent.setup();
  show("attributes");
  await user.click(screen.getByRole("button", { name: "Create attribute" }));
  const toggle = await screen.findByRole("button", {
    name: "Create a new key",
  });
  expect(toggle).toHaveClass("bg-primary", "text-primary-foreground");
  await user.click(toggle);
  expect(screen.getByRole("textbox", { name: "Key name" })).toBeVisible();
});
