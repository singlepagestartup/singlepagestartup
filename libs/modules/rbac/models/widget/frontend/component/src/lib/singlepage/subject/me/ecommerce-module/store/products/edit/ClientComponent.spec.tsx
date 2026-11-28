/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { IStoreProductDetail } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { cloneElement, type ReactNode } from "react";
import { ClientComponent } from "./ClientComponent";

const mockCatalog = jest.fn();
const mockChangeOffer = jest.fn();
const mockSetAttribute = jest.fn();
const mockUpdate = jest.fn();
const mockRead = jest.fn();
const mockUpdateRelation = jest.fn();
const mockUpload = jest.fn();
const mockReset = jest.fn();
let mockMutationState: { isError?: boolean; error?: { status: number } } = {};

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    ecommerceModuleCatalogMutation: () => ({ mutateAsync: mockChangeOffer }),
    ecommerceModuleCatalogContext: (...args: unknown[]) => mockCatalog(...args),
    ecommerceModuleCatalogAttributeSet: () => ({
      mutateAsync: mockSetAttribute,
    }),
    storeCatalogDirectories: {
      useList: () => ({
        data: {
          total: 1,
          items: [{ id: "green", keyTitle: "Colour", value: { en: "Green" } }],
        },
      }),
    },
    storeProducts: {
      useDetail: () => mockRead(),
      useUpdate: () => ({
        ...mockMutationState,
        mutate: mockUpdate,
        mutateAsync: mockUpdateRelation,
        reset: mockReset,
      }),
      useUploadImage: () => ({ mutateAsync: mockUpload }),
    },
  },
}));
jest.mock("../../StoreSection", () => ({
  StoreSection: ({ children }: { children: (session: object) => ReactNode }) =>
    children({
      access: {
        subjectId: "seller",
        store: { canManageCatalog: true, canManageTasks: true },
      },
    }),
}));
jest.mock(
  "../../../../../../subject-me-crm-module-store-workspace/primitives",
  () => ({}),
);
jest.mock(
  "../../../../../../subject-me-crm-module-store-workspace/view-model",
  () => ({
    hasStatus: (
      error: { status?: number } | undefined,
      ...statuses: number[]
    ) => error?.status !== undefined && statuses.includes(error.status),
  }),
);
jest.mock("@sps/shared-frontend-client-utils", () => ({
  ...jest.requireActual("@sps/shared-frontend-client-utils"),
  formatCurrencyAmount: (amount: string) => amount,
  cn: (...parts: unknown[]) => parts.filter(Boolean).join(" "),
}));
jest.mock("@sps/ui-adapter", () => ({
  FilePreview: ({
    name,
    src,
    localFile,
  }: {
    name: string;
    src?: string;
    localFile?: File;
  }) => <span data-src={src}>{localFile?.name ?? name}</span>,
  Select: ({
    id,
    ui,
    disabled,
    value,
    options,
    onValueChange,
    "aria-label": label,
  }: {
    id: string;
    ui: string;
    disabled: boolean;
    value: string;
    options: { label: string; value: string }[];
    onValueChange: (value: string) => void;
    "aria-label": string;
  }) => (
    <select
      id={id}
      aria-label={label}
      data-ui={ui}
      disabled={disabled}
      value={value}
      onChange={(event) => onValueChange(event.currentTarget.value)}
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

const editor = (
  <ClientComponent
    widgetId="store-widget"
    ecommerceModuleStore={{ id: "store", slug: "shop" } as IStore}
    ecommerceModuleProductId="product"
    language="en"
  />
);

function detail(): IStoreProductDetail {
  return {
    product: {
      id: "product",
      slug: "product",
      title: { ru: "Обложка" },
      adminTitle: "Cover",
      shortDescription: { ru: "Короткое описание" },
      description: { ru: "Старое описание" },
      kind: "physical",
      type: "one_off",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    canEditProduct: true,
    sharedProduct: false,
    offers: [
      {
        id: "offer-a",
        sku: "SKU-A",
        variant: "default",
        configurationKey: "",
        editable: true,
        prices: [],
      },
    ],
    productPrices: [],
    relations: {
      images: [
        {
          id: "image-1",
          fileId: "file-1",
          src: "/cover.jpg",
          title: "Cover photo",
          alt: "",
          orderIndex: 0,
          mimeType: "image/jpeg",
        },
        {
          id: "image-2",
          fileId: "file-2",
          src: "/alternate.jpg",
          title: "Alternate photo",
          alt: "",
          orderIndex: 1,
          mimeType: "image/jpeg",
        },
      ],
      categories: [
        {
          id: "link-1",
          categoryId: "category-1",
          slug: "books",
          title: { en: "Books" },
          adminTitle: "Books",
        },
      ],
      categoryOptions: [
        {
          id: "category-2",
          slug: "covers",
          title: { en: "Covers" },
          adminTitle: "Covers",
        },
      ],
      attributes: [
        {
          id: "attribute-link",
          offerId: "offer-a",
          attributeId: "attribute",
          key: "colour",
          label: "Colour",
          field: "string",
          type: "feature",
          value: { en: "Red", ru: "Красный" },
          editable: true,
          updatedAt: "2026-11-02T00:00:00Z",
        },
        {
          id: "formula-link",
          attributeId: "formula",
          key: "price_formula",
          label: "price_formula",
          field: "string",
          type: "formula",
          value: "base_price",
          editable: false,
          updatedAt: "2026-11-02T00:00:00Z",
        },
      ],
      attributeOptions: [
        { id: "size-key", key: "size", label: "Size", field: "number" },
      ],
      widgets: [
        {
          id: "widget-link",
          widgetId: "widget",
          title: "Details widget",
          kind: "presentation",
        },
      ],
      currencyOptions: [{ id: "rub", title: "RUB", symbol: "₽" }],
    },
  };
}

function editDescription(text: string) {
  const field = screen.getByRole("textbox", {
    name: "Description",
  }) as HTMLElement & { editor: import("@tiptap/core").Editor };
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", marks: [{ type: "bold" }], text }],
      },
    ],
  };
  act(() => {
    field.editor.commands.setContent(doc);
  });
  return JSON.stringify(field.editor.getJSON());
}

function chooseTab(name: string) {
  fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0 });
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
  mockMutationState = {};
  mockRead.mockReturnValue({ data: detail() });
  mockUpload.mockResolvedValue(detail());
  mockUpdateRelation.mockResolvedValue(detail());
});

it("keeps the edited offer selected until its changes are reset and saves the next offer's exact currency", () => {
  const detail: IStoreProductDetail = {
    product: {
      id: "product",
      slug: "product",
      title: { en: "Product" },
      adminTitle: "Product",
      shortDescription: null,
      description: null,
      kind: "physical",
      type: "one_off",
      updatedAt: "2026-11-01T00:00:00Z",
    },
    sharedProduct: false,
    canEditProduct: true,
    productPrices: [],
    offers: [
      {
        id: "a",
        sku: "Offer A",
        variant: "default",
        configurationKey: "",
        editable: true,
        prices: [],
      },
      {
        id: "b",
        sku: "Offer B",
        variant: "default",
        configurationKey: "",
        editable: true,
        prices: [
          {
            currencyId: "currency-b",
            currencyTitle: "USD",
            currencySymbol: "$",
            attributeId: "price-b",
            amount: "20.00",
            editable: true,
          },
        ],
      },
    ],
  };
  mockRead.mockReturnValue({ data: detail });
  render(
    <ClientComponent
      widgetId="store-widget"
      ecommerceModuleStore={{ id: "store", slug: "shop" } as IStore}
      ecommerceModuleProductId="product"
      language="en"
    />,
  );
  const select = screen.getByRole("combobox", { name: "Offer" });
  expect(select).toHaveAttribute("data-ui", "shadcn");
  expect(select).toHaveValue("a");

  fireEvent.change(screen.getByRole("textbox", { name: "SKU" }), {
    target: { value: "Draft SKU" },
  });
  expect(select).toBeDisabled();
  fireEvent.change(select, { target: { value: "b" } });
  expect(select).toHaveValue("a");
  fireEvent.click(screen.getByRole("button", { name: "Reset offer changes" }));
  expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("Offer A");
  expect(select).toBeEnabled();

  fireEvent.change(select, { target: { value: "b" } });
  fireEvent.change(screen.getByRole("textbox", { name: /Price.*USD/ }), {
    target: { value: "22.25" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(mockUpdate).toHaveBeenCalledWith(
    {
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        offer: {
          id: "b",
          prices: [
            {
              currencyId: "currency-b",
              attributeId: "price-b",
              expectedAmount: "20.00",
              amount: "22.25",
            },
          ],
        },
      },
    },
    expect.any(Object),
  );
});

it("preserves translation drafts across tabs and sends only the edited locales and fields", () => {
  render(editor);
  const language = screen.getByRole("tab", { name: "English" });
  expect(language).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "Cover in English" },
  });

  fireEvent.keyDown(screen.getByRole("tab", { name: "Russian" }), {
    key: "Enter",
  });
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Обложка");
  expect(
    screen.getByRole("textbox", { name: "Description" }),
  ).toHaveTextContent("Старое описание");
  const formatted = editDescription("Полное описание");

  chooseTab("Relations");
  expect(screen.getByRole("heading", { name: "Images" })).toBeVisible();
  chooseTab("Details and prices");
  chooseTab("English");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
    "Cover in English",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(mockUpdate).toHaveBeenCalledWith(
    {
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        translations: {
          expectedUpdatedAt: "2026-11-01T00:00:00Z",
          entries: {
            en: { title: "Cover in English" },
            ru: { description: formatted },
          },
        },
      },
    },
    expect.any(Object),
  );
});

it("selects the exact offer for attributes while keeping shared product characteristics visible", async () => {
  const data = detail();
  data.canEditProduct = false;
  data.sharedProduct = true;
  data.offers.push({ ...data.offers[0], id: "offer-b", sku: "SKU-B" });
  mockRead.mockReturnValue({ data });
  render(editor);
  chooseTab("Relations");
  expect(screen.getByRole("form", { name: "Colour" })).toBeVisible();
  fireEvent.change(
    screen.getByRole("combobox", { name: "Offer for attributes" }),
    { target: { value: "offer-b" } },
  );
  expect(screen.queryByRole("form", { name: "Colour" })).toBeNull();
  expect(screen.getByText("base_price")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Add from directory" }));
  fireEvent.click(screen.getByRole("option", { name: /Green/ }));
  await waitFor(() =>
    expect(mockUpdateRelation).toHaveBeenCalledWith({
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        relation: {
          kind: "attach-attribute",
          offerId: "offer-b",
          attributeId: "green",
        },
      },
    }),
  );
});

it("shows catalog links and sends the selected attribute's offer ID when saving", async () => {
  render(editor);
  chooseTab("Relations");
  expect(screen.getByText("Cover photo")).toHaveAttribute(
    "data-src",
    "/cover.jpg",
  );
  expect(screen.getByText("Books")).toBeVisible();
  expect(screen.getByText("Details widget")).toBeVisible();
  expect(screen.getByText("Price calculation formula")).toBeVisible();
  expect(screen.getByText("base_price")).toBeVisible();
  expect(screen.queryByText("price_formula")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Funnels" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Orders" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Linked offers" })).toBeNull();

  expect(
    screen.getByRole("button", { name: "Move up · Cover photo" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Move down · Cover photo" }),
  );
  expect(mockUpdateRelation).toHaveBeenLastCalledWith({
    id: "seller",
    storeId: "store",
    productId: "product",
    data: {
      relation: { kind: "move-image", id: "image-1", direction: "down" },
    },
  });
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Links updated."),
  );

  const file = new File(["image"], "new-cover.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Add photos"), {
    target: { files: [file] },
  });
  expect(screen.getByText("new-cover.png")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save photos" }));
  expect(mockUpload).toHaveBeenCalledWith({
    id: "seller",
    storeId: "store",
    productId: "product",
    file,
  });
  await waitFor(() => expect(screen.queryByText("new-cover.png")).toBeNull());

  fireEvent.change(screen.getByRole("combobox", { name: "New category" }), {
    target: { value: "category-2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add category" }));
  expect(mockUpdateRelation).toHaveBeenLastCalledWith({
    id: "seller",
    storeId: "store",
    productId: "product",
    data: { relation: { kind: "add-category", categoryId: "category-2" } },
  });
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Links updated."),
  );

  const colour = screen.getByRole("form", { name: "Colour" });
  fireEvent.change(within(colour).getByRole("textbox", { name: "English" }), {
    target: { value: "Blue" },
  });
  fireEvent.click(within(colour).getByRole("button", { name: "Save" }));
  expect(mockUpdateRelation).toHaveBeenLastCalledWith({
    id: "seller",
    storeId: "store",
    productId: "product",
    data: {
      relation: {
        kind: "update-attribute",
        offerId: "offer-a",
        id: "attribute-link",
        expectedUpdatedAt: "2026-11-02T00:00:00Z",
        value: { en: "Blue", ru: "Красный" },
      },
    },
  });
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Links updated."),
  );
});

it("adds a price in a new currency to the exact product", () => {
  render(editor);
  fireEvent.change(
    screen.getByRole("combobox", { name: "Product prices: add price" }),
    { target: { value: "rub" } },
  );
  fireEvent.change(screen.getByRole("textbox", { name: /Price.*RUB/ }), {
    target: { value: "950,50" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(mockUpdate).toHaveBeenCalledWith(
    {
      id: "seller",
      storeId: "store",
      productId: "product",
      data: { productNewPrices: [{ currencyId: "rub", amount: "950.50" }] },
    },
    expect.any(Object),
  );
});

it("confirms removal of a specific currency and restores keyboard focus on cancel", async () => {
  const data = detail();
  data.productPrices = [
    {
      attributeId: "price-rub",
      currencyId: "rub",
      currencyTitle: "RUB",
      currencySymbol: "₽",
      amount: "500",
      editable: true,
    },
    {
      attributeId: "price-usd",
      currencyId: "usd",
      currencyTitle: "USD",
      currencySymbol: "$",
      amount: "5",
      editable: true,
    },
  ];
  mockRead.mockReturnValue({ data });
  render(editor);
  const remove = screen.getByRole("button", { name: "Remove price · USD" });
  remove.focus();
  fireEvent.click(remove);
  const dialog = screen.getByRole("alertdialog", {
    name: "Remove this price?",
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(remove).toHaveFocus());
  expect(mockUpdate).not.toHaveBeenCalled();

  fireEvent.click(remove);
  fireEvent.click(
    within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Remove price",
    }),
  );
  expect(mockUpdate).toHaveBeenCalledWith(
    {
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        relation: {
          kind: "remove-price",
          owner: "product",
          attributeId: "price-usd",
          currencyId: "usd",
          expectedAmount: "5",
        },
      },
    },
    expect.any(Object),
  );
});

it("retains changed translations when a conflict requires a fresh revision", async () => {
  const initial = detail();
  const latest = {
    ...initial,
    product: {
      ...initial.product,
      title: { ru: "Обложка", en: "Another operator's title" },
      shortDescription: { en: "Updated description" },
      updatedAt: "2026-11-03T00:00:00Z",
    },
  };
  const refetch = jest
    .fn()
    .mockResolvedValue({ isSuccess: true, data: latest });
  mockRead.mockReturnValue({ data: initial, refetch });
  const { rerender } = render(editor);
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "My English title" },
  });
  mockMutationState = { isError: true, error: { status: 409 } };
  rerender(cloneElement(editor));
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Reload current data" }));
  await waitFor(() => expect(mockReset).toHaveBeenCalled());
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
    "My English title",
  );
  expect(
    screen.getByRole("textbox", { name: "Short description" }),
  ).toHaveValue("Updated description");
  mockMutationState = {};
  mockRead.mockReturnValue({ data: latest, refetch });
  rerender(cloneElement(editor));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(mockUpdate).toHaveBeenLastCalledWith(
    {
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        translations: {
          expectedUpdatedAt: latest.product.updatedAt,
          entries: { en: { title: "My English title" } },
        },
      },
    },
    expect.any(Object),
  );
});

it("shows a title error only while clearing the last nonempty locale", () => {
  render(cloneElement(editor, { language: "ru" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Название" }), {
    target: { value: "" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Укажите название хотя бы на одном языке",
  );
  expect(screen.getByRole("textbox", { name: "Название" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(screen.getByRole("textbox", { name: "Название" })).toHaveFocus();
  expect(mockUpdate).not.toHaveBeenCalled();

  chooseTab("Английский");
  fireEvent.change(screen.getByRole("textbox", { name: "Название" }), {
    target: { value: "Cover" },
  });
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
  expect(mockUpdate).toHaveBeenCalledWith(
    {
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        translations: {
          expectedUpdatedAt: "2026-11-01T00:00:00Z",
          entries: { ru: { title: "" }, en: { title: "Cover" } },
        },
      },
    },
    expect.any(Object),
  );
});

it("lets an older unnamed product save a change to its description", () => {
  const data = detail();
  data.product.title = {};
  mockRead.mockReturnValue({ data });
  render(editor);
  const formatted = editDescription("Updated description");
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(mockUpdate).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        translations: {
          expectedUpdatedAt: "2026-11-01T00:00:00Z",
          entries: { en: { description: formatted } },
        },
      },
    }),
    expect.any(Object),
  );
});

it("moves a saved photo by dropping it on another photo", async () => {
  render(editor);
  chooseTab("Relations");
  const source = screen.getByText("Alternate photo").closest("li")!;
  const target = screen.getByText("Cover photo").closest("li")!;
  const values = new Map<string, string>();
  const dataTransfer = {
    setData: (type: string, id: string) => values.set(type, id),
    getData: (type: string) => values.get(type) || "",
  };
  fireEvent.dragStart(source, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
  await waitFor(() =>
    expect(mockUpdateRelation).toHaveBeenCalledWith({
      id: "seller",
      storeId: "store",
      productId: "product",
      data: {
        relation: { kind: "move-image", id: "image-2", targetId: "image-1" },
      },
    }),
  );
});

it("retains only unsaved photos after an interrupted multiple upload", async () => {
  mockUpload
    .mockResolvedValueOnce(detail())
    .mockRejectedValueOnce(new Error("failed"))
    .mockResolvedValue(detail());
  render(editor);
  chooseTab("Relations");
  const first = new File(["a"], "first.png", { type: "image/png" });
  const second = new File(["b"], "second.png", { type: "image/png" });
  fireEvent.drop(screen.getByLabelText("Add photos").parentElement!, {
    dataTransfer: { files: [first, second] },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save photos" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not upload the image.",
    ),
  );
  expect(screen.queryByText("first.png")).toBeNull();
  expect(screen.getByText("second.png")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save photos" }));
  await waitFor(() => expect(screen.queryByText("second.png")).toBeNull());
  expect(mockUpload.mock.calls.map(([item]) => item.file.name)).toEqual([
    "first.png",
    "second.png",
    "second.png",
  ]);
});

it("opens the product formula from its price editor and saves through the catalogue owner", async () => {
  const refetch = jest.fn();
  mockCatalog.mockReturnValue({
    data: {
      ownedProductIds: ["product"],
      offers: [],
      currencies: [],
      attributes: [
        {
          id: "formula",
          key: "price_formula",
          field: "string",
          text: "provider_usd * topup_tokens / topup_usd * 2",
          owner: { type: "product", id: "product" },
        },
      ],
    },
    refetch,
  });
  render(editor);
  expect(mockCatalog).not.toHaveBeenCalled();
  chooseTab("Pricing formula");
  const field = screen.getByRole("textbox", { name: "Value" });
  expect(field).toHaveValue("provider_usd * topup_tokens / topup_usd * 2");
  const updated = "provider_usd * topup_tokens / topup_usd * 3";
  fireEvent.change(field, { target: { value: updated } });
  fireEvent.click(screen.getByRole("button", { name: "Save rate or formula" }));
  await screen.findByText("Catalogue attribute saved.");
  expect(mockSetAttribute).toHaveBeenCalledWith({
    id: "seller",
    data: expect.objectContaining({
      owner: { type: "product", id: "product" },
      key: "price_formula",
      field: "string",
      string: updated,
    }),
  });
  expect(refetch).toHaveBeenCalledTimes(1);
  expect(mockUpdate).not.toHaveBeenCalled();
});

it("enables work pricing on the selected service offer and preserves its other settings", async () => {
  const service = detail();
  service.product.kind = "service";
  mockRead.mockReturnValue({ data: service });
  const offer = {
    ...service.offers[0],
    storeId: "store",
    productId: "product",
    settings: { receiptMethod: "electronic" },
  };
  mockCatalog.mockReturnValue({
    data: {
      offers: [offer],
      ownedProductIds: ["product"],
      currencies: [{ id: "wallet", slug: "token", title: "Token" }],
      attributes: [
        {
          owner: { type: "offer", id: offer.id },
          id: "price",
          key: "price",
          type: "price",
          field: "number",
          currencyId: "wallet",
          number: "0.00",
        },
      ],
    },
    refetch: jest.fn(),
  });
  render(editor);
  chooseTab("Pricing formula");
  fireEvent.change(screen.getByLabelText("When the customer pays"), {
    target: { value: "work-formula" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save payment terms" }));
  await waitFor(() =>
    expect(mockChangeOffer).toHaveBeenCalledWith({
      id: "seller",
      data: {
        entity: "stores-to-products",
        method: "PATCH",
        recordId: offer.id,
        data: {
          settings: {
            receiptMethod: "electronic",
            requiresResultAcceptance: false,
            standalone: true,
            workTokenPricing: { currencyId: "wallet" },
          },
        },
      },
    }),
  );
});
