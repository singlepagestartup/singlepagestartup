/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { ProductForm } from "./ProductForm";

const mockCreate = jest.fn();
const mockNavigate = jest.fn();
const mockOptions = jest.fn();
const mockPage = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockNavigate }),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    crmWorkspace: { useOptions: () => mockOptions() },
    ecommerceModuleOfferCreate: () => ({ mutateAsync: mockCreate }),
    storeCatalogDirectories: { useList: (args: unknown) => mockPage(args) },
  },
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-utils"),
  cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
}));
jest.mock("@sps/ui-adapter", () => ({
  FilePreview: ({ localFile }: { localFile: File }) => (
    <span>{localFile.name}</span>
  ),
  Select: ({
    value,
    options,
    onValueChange,
    "aria-label": label,
  }: {
    value: string;
    options: { value: string; label: string }[];
    onValueChange: (id: string) => void;
    "aria-label": string;
  }) => (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="" />
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

function show(language = "en") {
  return render(
    <ProductForm
      subjectId="manager"
      ecommerceModuleStore={{ id: "store", slug: "shop" } as IStore}
      language={language}
    />,
  );
}

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  mockOptions.mockReturnValue({
    data: {
      currencies: [
        { id: "usd", title: "USD" },
        { id: "rub", title: "RUB" },
      ],
    },
  });
  mockCreate.mockResolvedValue({ product: { id: "product" } });
  mockPage.mockImplementation(({ kind, offset }) => {
    if (kind === "attributes")
      return {
        data: {
          items: [{ id: "red", keyTitle: "Colour", value: { en: "Red" } }],
          total: 1,
        },
      };
    return {
      data: {
        items: [
          offset
            ? { id: "books", adminTitle: "Books" }
            : { id: "food", adminTitle: "Food" },
        ],
        total: 11,
        nextOffset: offset ? undefined : 10,
      },
    };
  });
});

it("submits the translations, currency prices, selected catalogue entries and photos together", async () => {
  show();
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "Book" },
  });
  fireEvent.keyDown(screen.getByRole("tab", { name: "Russian" }), {
    key: "Enter",
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "Книга" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Price · USD" }), {
    target: { value: "2.50" },
  });
  fireEvent.change(
    screen.getByRole("combobox", { name: "Prices: add price" }),
    { target: { value: "rub" } },
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Price · RUB" }), {
    target: { value: "199,99" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Categories" }));
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  fireEvent.click(screen.getByRole("option", { name: "Books" }));
  expect(mockPage).toHaveBeenCalledWith(
    expect.objectContaining({
      id: "manager",
      storeId: "store",
      offset: 10,
      kind: "categories",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Offer attributes" }));
  fireEvent.click(screen.getByRole("option", { name: "Colour · Red" }));

  const photo = new File(["cover"], "cover.png", { type: "image/png" });
  const extra = new File(["back"], "back.png", { type: "image/png" });
  const spine = new File(["spine"], "spine.png", { type: "image/png" });
  const input = screen.getByLabelText("Add photos");
  fireEvent.change(input, { target: { files: [photo, extra] } });
  fireEvent.drop(input.parentElement!, { dataTransfer: { files: [spine] } });
  fireEvent.click(
    screen.getByRole("button", { name: "Remove image · back.png" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Move up · spine.png" }));
  const editor = (
    screen.getByRole("textbox", {
      name: "Description",
    }) as HTMLElement & { editor: import("@tiptap/core").Editor }
  ).editor;
  act(() => {
    editor.commands.setContent("<p><em>Описание</em></p>");
  });
  const description = JSON.stringify(editor.getJSON());
  fireEvent.click(screen.getByRole("button", { name: "Save product" }));
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/ecommerce/stores/shop/products/product",
    ),
  );
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(mockCreate).toHaveBeenCalledWith({
    id: "manager",
    images: [spine, photo],
    data: expect.objectContaining({
      storeId: "store",
      categoryIds: ["books"],
      attributeIds: ["red"],
      product: expect.objectContaining({
        title: { en: "Book", ru: "Книга" },
        adminTitle: "Book",
        description: { ru: description },
      }),
      prices: [
        { currencyId: "usd", amount: "2.50" },
        { currencyId: "rub", amount: "199.99" },
      ],
    }),
  });
});

it("keeps the draft on failure and retries the same creation in the Russian interface", async () => {
  mockCreate.mockRejectedValueOnce(new Error("Ошибка сохранения"));
  show("ru");
  fireEvent.change(screen.getByRole("textbox", { name: "Цена · USD" }), {
    target: { value: "0" },
  });
  const submit = screen.getByRole("button", { name: "Сохранить товар" });
  fireEvent.click(submit);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Укажите название хотя бы на одном языке",
  );
  expect(mockCreate).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("textbox", { name: "Название" }), {
    target: { value: "Книга" },
  });
  fireEvent.click(submit);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Ошибка сохранения",
  );
  expect(screen.getByRole("textbox", { name: "Название" })).toHaveValue(
    "Книга",
  );
  expect(mockNavigate).not.toHaveBeenCalled();
  fireEvent.click(submit);
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith(
      "/ru/ecommerce/stores/shop/products/product",
    ),
  );
  expect(mockCreate.mock.calls[0]).toEqual(mockCreate.mock.calls[1]);
});

it("blocks saving while currencies are missing and offers to retry a failed load", () => {
  const refetch = jest.fn();
  mockOptions.mockReturnValue({ isError: true, refetch });
  show();
  expect(screen.getByRole("button", { name: "Save product" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(refetch).toHaveBeenCalled();
});
