/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { IStoreProduct } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IWidget } from "@sps/rbac/models/widget/sdk/model";
import type { ReactNode } from "react";
import { Component as Overview } from "../../../../subject-me-ecommerce-module-store-overview-default";
import { variant as overviewVariant } from "../../../../subject-me-ecommerce-module-store-overview-default/interface";
import { Component as EmployeeCreate } from "./employees/create";
import { variant as employeeCreateVariant } from "./employees/create/interface";
import { Component as EmployeeDetail } from "./employees/detail";
import { variant as employeeDetailVariant } from "./employees/detail/interface";
import { Component as ProductDetail } from "./products/detail";
import { variant as productDetailVariant } from "./products/detail/interface";
import { Component as ProductEdit } from "./products/edit";
import { variant as productEditVariant } from "./products/edit/interface";
import { Component as Employees } from "./employees";
import { variant as employeesVariant } from "./employees/interface";
import { Component as Products } from "./products";
import { variant as productsVariant } from "./products/interface";
import { Component as Settings } from "./settings";
import { variant as settingsVariant } from "./settings/interface";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockFindOffers = jest.fn();
const mockFindStore = jest.fn();
const mockPresentationFind = jest.fn();
const mockEmployeeConversation = jest.fn();
let mockAuthenticated: boolean;
let mockStoreDescription: Record<string, string> | null;
let mockStoreUpdatedAt: string | Date | undefined;
let mockStoreEnglishTitle: string;

jest.mock("server-only", () => ({}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock("@sps/rbac/models/widget/sdk/client", () => ({
  api: {},
  Provider: jest.fn(),
}));
jest.mock("@sps/rbac/models/widget/sdk/server", () => ({ api: {} }));
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component",
  () => ({
    Component: (props: {
      children: ReactNode | ((result: object) => ReactNode);
      apiProps: object;
    }) => {
      if (typeof props.children === "function") {
        mockPresentationFind(props.apiProps);
        return props.children({ data: [{ id: "presentation-link" }] });
      }
      return props.children;
    },
  }),
);
jest.mock(
  "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component",
  () => ({
    Component: (props: {
      variant: string;
      apiProps?: object;
      children: (result: object) => ReactNode;
    }) => {
      if (props.variant === "find") {
        expect(props.apiProps).toMatchObject({
          params: {
            filters: {
              and: [
                { column: "widgetId", method: "eq", value: "store-widget" },
              ],
            },
          },
        });
        return props.children({
          data: [
            { id: "header-link", ecommerceModuleWidgetId: "header-widget" },
          ],
        });
      }
      const { Component } = jest.requireActual(
        "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component/src/lib/singlepage/default/Component",
      );
      return <Component {...props} />;
    },
  }),
);
jest.mock("@sps/ecommerce/models/widget/frontend/component", () => ({
  Component: (props: {
    variant: string;
    apiProps?: object;
    children: (result: object) => ReactNode;
  }) => {
    if (props.variant === "find") {
      expect(props.apiProps).toMatchObject({
        params: {
          filters: {
            and: [{ column: "id", method: "eq", value: "header-widget" }],
          },
        },
      });
      return props.children({
        data: [{ id: "header-widget", variant: "store-header-default" }],
      });
    }
    const { Component } = jest.requireActual(
      "@sps/ecommerce/models/widget/frontend/component/src/lib/singlepage/store/header-default/Component",
    );
    return <Component {...props} />;
  },
}));
jest.mock("@sps/ecommerce/models/store/frontend/component", () => ({
  Component: (props: {
    variant: string;
    children: (result: object) => ReactNode;
    apiProps: {
      params: { filters: { and: { column: string; value: string }[] } };
    };
  }) => {
    if (props.variant === "header-default") {
      const { Component } = jest.requireActual(
        "@sps/ecommerce/models/store/frontend/component/src/lib/singlepage/header-default/Component",
      );
      return <Component {...props} />;
    }
    mockFindStore(props.apiProps);
    if (
      props.apiProps.params.filters.and.some(
        ({ column, value }) => column === "slug" && value === "atelier",
      )
    ) {
      return props.children({
        data: [{ id: "store-2", slug: "atelier", title: { ru: "Ателье" } }],
      });
    }
    return props.children({
      data: [
        {
          id: "store-1",
          slug: "shop",
          adminTitle: "Shop admin",
          variant: "default",
          title: { ru: "Лавка", en: mockStoreEnglishTitle, fr: "Boutique" },
          updatedAt: mockStoreUpdatedAt,
          shortDescription: { en: "Studio shop" },
          description: mockStoreDescription,
        },
      ],
    });
  },
}));
jest.mock(
  "@sps/ecommerce/relations/stores-to-products/frontend/component",
  () => ({
    Component: (props: {
      children: (result: object) => ReactNode;
      apiProps: object;
    }) => {
      mockFindOffers(props.apiProps);
      return props.children({ data: [{ productId: "product-1" }] });
    },
  }),
);
jest.mock("@sps/ecommerce/models/product/frontend/component", () => ({
  Component: (props: { children: (result: object) => ReactNode }) =>
    props.children({ data: [{ id: "product-1", adminTitle: "Обложка" }] }),
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: {
    variant: string;
    children: (result: object) => ReactNode;
    fallback: ReactNode;
  }) => {
    if (props.variant === "social-module-profile-chat-overview-default") {
      mockEmployeeConversation(props);
      return <p>История служебного чата</p>;
    }
    if (props.variant === "me-ecommerce-module-product-card-default") {
      return "Каталог товара";
    }
    return mockAuthenticated
      ? props.children({ data: { id: "owner" }, authenticated: true })
      : props.fallback;
  },
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    crmWorkspace: {
      useStores: jest.fn(),
      useOverview: jest.fn(),
      useOptions: jest.fn(),
      useEmployees: jest.fn(),
      useEmployee: jest.fn(),
      useTasks: jest.fn(),
      useCommand: jest.fn(),
    },
    providerConnections: jest.fn(),
    ecommerceModuleOfferCreate: jest.fn(),
    ecommerceModuleCatalogMutation: jest.fn(),
    storeProducts: {
      useList: jest.fn(),
      useDetail: jest.fn(),
      useUpdate: jest.fn(),
    },
  },
}));

const workspace = jest.mocked(api.crmWorkspace);
const catalog = jest.mocked(api.storeProducts);
const saveStore = jest.fn();
const providerConnections = jest.mocked(api.providerConnections);
const path = "/ru/ecommerce/stores/shop";
const props = {
  ecommerceModuleStoreSlug: "shop",
  language: "ru",
  isServer: true,
  dataSource: "props" as const,
  data: { id: "store-widget" } as IWidget,
};
const ownerStore = {
  id: "store-1",
  slug: "shop",
  title: "Лавка",
  canReadCosts: true,
  canManageEmployees: true,
  canManageCatalog: true,
  canManageTasks: true,
  canManageProviderSettings: true,
};

const managedProduct: IStoreProduct = {
  product: {
    id: "product-1",
    slug: "cover",
    adminTitle: "Cover",
    title: { ru: "Обложка" },
    shortDescription: { ru: "По фотографии товара" },
    description: {
      ru: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "bold" }],
                text: "Твёрдая обложка",
              },
            ],
          },
        ],
      }),
    },
    kind: "service",
    type: "one_off",
    updatedAt: "2026-11-20T12:00:00.000Z",
  },
  productPrices: [],
  offers: [
    {
      id: "offer-1",
      sku: "COVER-01",
      variant: "default",
      configurationKey: "",
      editable: true,
      prices: [],
    },
  ],
};

function useStoresData(store: typeof ownerStore) {
  workspace.useStores.mockReturnValue({
    data: [store],
  } as ReturnType<typeof workspace.useStores>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthenticated = true;
  mockStoreDescription = null;
  mockStoreUpdatedAt = undefined;
  mockStoreEnglishTitle = "Shop";
  useStoresData(ownerStore);
  workspace.useOverview.mockReturnValue({
    data: { productCount: 2, orderCount: 0, taskCount: 37 },
  } as ReturnType<typeof workspace.useOverview>);
  saveStore.mockReset().mockResolvedValue({ id: "store-1", slug: "shop" });
  jest.mocked(api.ecommerceModuleCatalogMutation).mockReturnValue({
    mutateAsync: saveStore,
  } as unknown as ReturnType<typeof api.ecommerceModuleCatalogMutation>);
  catalog.useList.mockReturnValue({
    data: { items: [managedProduct], total: 1 },
  } as unknown as ReturnType<typeof catalog.useList>);
  catalog.useDetail.mockReturnValue({
    data: {
      ...managedProduct,
      canEditProduct: true,
      sharedProduct: false,
      funnels: [{ id: "funnel-1", slug: "covers", title: "Дизайн обложки" }],
      orders: {
        items: [
          {
            id: "order-1",
            type: "one_off",
            status: "paid",
            createdAt: "2026-11-21T12:00:00.000Z",
            quantity: 1,
          },
        ],
      },
    },
  } as unknown as ReturnType<typeof catalog.useDetail>);
  workspace.useOptions.mockReturnValue({
    data: { canManageEmployees: true, employees: [], currencies: [] },
  } as unknown as ReturnType<typeof workspace.useOptions>);
  workspace.useCommand.mockReturnValue({
    mutateAsync: jest.fn(),
  } as unknown as ReturnType<typeof workspace.useCommand>);
  jest
    .mocked(api.ecommerceModuleOfferCreate)
    .mockReturnValue({} as ReturnType<typeof api.ecommerceModuleOfferCreate>);
  providerConnections.mockReturnValue({
    data: {
      connections: [],
      assignments: [],
      assistants: [],
      operations: [],
      nextCursor: null,
    },
  } as unknown as ReturnType<typeof api.providerConnections>);
  window.history.replaceState({}, "", path);
});

it("renders the store overview with linked totals and its own navigation", () => {
  render(<Overview variant={overviewVariant} {...props} />);

  expect(mockPresentationFind).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "widgetId", method: "eq", value: "store-widget" }],
      },
    },
  });
  expect(mockFindStore).toHaveBeenCalledWith({
    params: {
      limit: 1,
      filters: { and: [{ column: "slug", method: "eq", value: "shop" }] },
    },
  });
  expect(workspace.useStores).toHaveBeenCalledWith("owner", "shop", false);
  expect(
    screen.getByRole("heading", { level: 1, name: "Лавка" }),
  ).toBeInTheDocument();

  const sections = {
    Обзор: "",
    Товары: "/products",
    Сотрудники: "/employees",
    Задачи: "/crm",
    Воронки: "/crm/funnels",
    Заказы: "/orders",
    Настройки: "/settings",
  };
  for (const [name, route] of Object.entries(sections)) {
    expect(screen.getByRole("link", { name })).toHaveAttribute(
      "href",
      `${path}${route}`,
    );
  }
  expect(workspace.useOverview).toHaveBeenCalledWith({
    id: "owner",
    params: { storeId: "store-1" },
  });
  expect(screen.getByRole("link", { name: "Обзор" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const totals = within(
    screen.getByRole("region", { name: "Показатели магазина" }),
  );
  expect(totals.getAllByRole("link")).toHaveLength(3);
  expect(totals.getByRole("link", { name: "Товары 2" })).toHaveAttribute(
    "href",
    path + "/products",
  );
  expect(totals.getByRole("link", { name: "Заказы 0" })).toHaveAttribute(
    "href",
    path + "/orders",
  );
  expect(totals.getByRole("link", { name: "Задачи 37" })).toHaveAttribute(
    "href",
    path + "/crm",
  );
  expect(screen.queryByRole("form", { name: "Настройки магазина" })).toBeNull();
  expect(catalog.useList).not.toHaveBeenCalled();
  expect(workspace.useOptions).not.toHaveBeenCalled();
  expect(api.ecommerceModuleOfferCreate).not.toHaveBeenCalled();
  expect(providerConnections).not.toHaveBeenCalled();
});

it("shows overview totals to a store manager without catalog editing rights", () => {
  useStoresData({ ...ownerStore, canManageCatalog: false });
  render(<Overview variant={overviewVariant} {...props} language="en" />);
  expect(screen.getByRole("link", { name: "Orders 0" })).toHaveAttribute(
    "href",
    "/en/ecommerce/stores/shop/orders",
  );
  expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
});

it("keeps store totals private for a visitor", () => {
  mockAuthenticated = false;
  render(<Overview variant={overviewVariant} {...props} />);
  expect(workspace.useOverview).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("region", { name: "Показатели магазина" }),
  ).toBeNull();
});

it("shows a retry action when the total request fails", () => {
  const refetch = jest.fn();
  workspace.useOverview.mockReturnValue({
    isError: true,
    error: new Error("network"),
    refetch,
  } as unknown as ReturnType<typeof workspace.useOverview>);
  render(<Overview variant={overviewVariant} {...props} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Не удалось загрузить показатели",
  );
  expect(
    screen.queryByRole("region", { name: "Показатели магазина" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
  expect(refetch).toHaveBeenCalledTimes(1);
});

it("uses the second routed store for the shared header and its links", () => {
  const { container } = render(
    <Products
      variant={productsVariant}
      {...props}
      ecommerceModuleStoreSlug="atelier"
    />,
  );
  const heading = screen.getByRole("heading", { name: "Ателье" });
  expect(heading.closest('[data-model="store"]')).toHaveAttribute(
    "data-id",
    "store-2",
  );
  expect(
    heading.closest(
      '[data-model="widget"][data-variant="store-header-default"]',
    ),
  ).toHaveAttribute("data-id", "header-widget");
  expect(
    container.querySelector(
      '[data-model="store"][data-variant="header-default"]',
    ),
  ).toContainElement(heading);
  expect(screen.getByRole("link", { name: "Товары" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/atelier/products",
  );
  expect(
    screen.queryByRole("link", { name: "Настройки" }),
  ).not.toBeInTheDocument();
});

it("saves changed store translations and keeps other locales and fields", async () => {
  render(<Settings variant={settingsVariant} {...props} />);
  const submit = screen.getByRole("button", { name: "Сохранить изменения" });
  expect(submit).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Название" }), {
    target: { value: "Фотолавка" },
  });
  fireEvent.keyDown(screen.getByRole("tab", { name: "Английский" }), {
    key: "Enter",
  });
  expect(screen.getByRole("textbox", { name: "Название" })).toHaveValue("Shop");
  fireEvent.change(screen.getByRole("textbox", { name: "Краткое описание" }), {
    target: { value: "" },
  });
  fireEvent.click(submit);
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Настройки сохранены.",
  );
  expect(saveStore).toHaveBeenCalledWith({
    id: "owner",
    data: {
      entity: "stores",
      method: "PATCH",
      recordId: "store-1",
      data: {
        title: { ru: "Фотолавка", en: "Shop", fr: "Boutique" },
        shortDescription: { en: "" },
      },
    },
  });
  expect(mockRefresh).toHaveBeenCalled();
});

it("displays saved formatted descriptions in the editor and preserves them on unrelated changes", async () => {
  mockStoreDescription = {
    ru: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Описание с форматированием" }],
        },
      ],
    }),
  };
  render(<Settings variant={settingsVariant} {...props} />);
  const description = await screen.findByText("Описание с форматированием");
  expect(description.closest("[contenteditable=true]")).toBeInTheDocument();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Внутреннее название" }),
    {
      target: { value: "Updated admin name" },
    },
  );
  fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
  await screen.findByRole("status");
  expect(saveStore.mock.calls[0][0].data.data).toEqual({
    adminTitle: "Updated admin name",
  });
});

it("opens legacy multiline text and empty translations in the full editor without changing them", async () => {
  mockStoreDescription = { ru: "Первая строка\nВторая строка" };
  render(<Settings variant={settingsVariant} {...props} />);
  const first = await screen.findByText("Первая строка");
  expect(first.closest("[contenteditable=true]")).toContainElement(
    screen.getByText("Вторая строка"),
  );
  expect(
    screen.getByRole("button", { name: "Сохранить изменения" }),
  ).toBeDisabled();
  fireEvent.keyDown(screen.getByRole("tab", { name: "Английский" }), {
    key: "Enter",
  });
  await waitFor(() =>
    expect(
      screen.getByRole("tabpanel").querySelector("[contenteditable=true]"),
    ).toBeInTheDocument(),
  );
  expect(
    screen.getByRole("button", { name: "Сохранить изменения" }),
  ).toBeDisabled();
});

it("saves an edit made inside the formatted description", async () => {
  mockStoreDescription = {
    ru: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Первое описание" }],
        },
      ],
    }),
    en: "English description",
  };
  render(<Settings variant={settingsVariant} {...props} />);
  const paragraph = await screen.findByText("Первое описание");
  const editor = paragraph.closest("[contenteditable=true]")!;
  paragraph.textContent = "Новое описание";
  fireEvent.input(editor);
  const submit = screen.getByRole("button", { name: "Сохранить изменения" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  await screen.findByRole("status");
  const descriptions = saveStore.mock.calls[0][0].data.data.description;
  expect(JSON.parse(descriptions.ru).content[0].content[0].text).toBe(
    "Новое описание",
  );
  expect(descriptions.en).toBe("English description");
});

it("opens the saved locale-specific store address after a rename", async () => {
  saveStore.mockResolvedValue({ id: "store-1", slug: "photo-shop" });
  render(<Settings variant={settingsVariant} {...props} language="en" />);
  fireEvent.change(screen.getByRole("textbox", { name: "Store URL slug" }), {
    target: { value: "photo-shop" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(mockReplace).toHaveBeenCalledWith(
      "/en/ecommerce/stores/photo-shop/settings",
    ),
  );
  expect(saveStore.mock.calls[0][0].data.data).toEqual({ slug: "photo-shop" });
});

it("keeps the typed slug after a conflict and allows another attempt", async () => {
  saveStore.mockRejectedValueOnce(
    Object.assign(new Error("Conflict error. Entity already exists"), {
      status: 409,
    }),
  );
  render(<Settings variant={settingsVariant} {...props} />);
  const slug = screen.getByRole("textbox", { name: "Адрес магазина" });
  fireEvent.change(slug, { target: { value: "taken" } });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Этот адрес магазина уже занят",
  );
  expect(slug).toHaveValue("taken");
  expect(mockReplace).not.toHaveBeenCalled();
});

it("keeps edits on a stale version and retries with the refreshed translations and version", async () => {
  const initial = "2026-11-23T12:00:00.000Z";
  const latest = "2026-11-23T12:01:00.000Z";
  mockStoreUpdatedAt = new Date(initial);
  saveStore.mockRejectedValueOnce(
    Object.assign(new Error("Conflict error. Store settings have changed"), {
      status: 409,
    }),
  );
  const view = <Settings variant={settingsVariant} {...props} />;
  const { rerender } = render(view);
  const name = screen.getByRole("textbox", { name: "Название" });
  const submit = screen.getByRole("button", { name: "Сохранить изменения" });
  fireEvent.change(name, { target: { value: "Моя лавка" } });
  mockStoreUpdatedAt = latest;
  mockStoreEnglishTitle = "Updated by another editor";
  rerender(<Settings variant={settingsVariant} {...props} />);
  fireEvent.click(submit);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Настройки магазина изменились.",
  );
  expect(saveStore.mock.calls[0][0].data.expectedUpdatedAt).toBe(initial);
  expect(submit).toBeDisabled();
  expect(name).toHaveValue("Моя лавка");
  fireEvent.click(
    screen.getByRole("button", { name: "Загрузить актуальные данные" }),
  );
  expect(mockRefresh).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(submit).toBeEnabled());
  expect(name).toHaveValue("Моя лавка");
  fireEvent.click(submit);
  await screen.findByRole("status");
  expect(saveStore.mock.calls[1][0].data).toMatchObject({
    expectedUpdatedAt: latest,
    data: {
      title: {
        ru: "Моя лавка",
        en: "Updated by another editor",
        fr: "Boutique",
      },
    },
  });
});

it("does not identify an unrecognized conflict as a duplicate store address", async () => {
  saveStore.mockRejectedValueOnce(
    Object.assign(new Error("Conflict error."), { status: 409 }),
  );
  render(<Settings variant={settingsVariant} {...props} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Адрес магазина" }), {
    target: { value: "shop-new" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить изменения" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Не удалось сохранить настройки магазина.",
  );
});

it.each([true, false])(
  "keeps store settings read-only without catalog access (authenticated=%s)",
  (authenticated) => {
    mockAuthenticated = authenticated;
    useStoresData({ ...ownerStore, canManageCatalog: false });
    render(<Settings variant={settingsVariant} {...props} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Лавка" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Товары" })).toHaveAttribute(
      "href",
      `${path}/products`,
    );
    expect(
      screen.queryByRole("form", { name: "Настройки магазина" }),
    ).toBeNull();
    expect(api.ecommerceModuleCatalogMutation).not.toHaveBeenCalled();
  },
);

it.each([
  ["#store-products", "/products"],
  ["#store-employees", "/employees"],
  ["#store-workspace", "/crm"],
  ["?view=table&funnel=funnel-1", "/crm?view=table&funnel=funnel-1"],
  [
    "?edit=1&funnel=funnel-1&testTask=test-1#store-workspace",
    "/crm?edit=1&funnel=funnel-1&testTask=test-1",
  ],
  ["?task=task-1&view=table#store-workspace", "/crm/tasks/task-1?view=table"],
])(
  "redirects old store location %s to the dedicated page",
  (oldLocation, nextPath) => {
    window.history.replaceState({}, "", `${path}${oldLocation}`);
    render(<Overview variant={overviewVariant} {...props} />);

    expect(mockReplace).toHaveBeenCalledWith(`${path}${nextPath}`);
  },
);

it("shows the public catalog anonymously and product creation to the store manager", () => {
  mockAuthenticated = false;
  const { unmount } = render(<Products variant={productsVariant} {...props} />);

  expect(workspace.useStores).not.toHaveBeenCalled();
  expect(screen.getByText("Каталог товара")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Товары" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.queryByRole("link", { name: "Добавить товар" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Задачи" })).toBeNull();
  expect(catalog.useList).not.toHaveBeenCalled();
  unmount();

  mockAuthenticated = true;
  render(<Products variant={productsVariant} {...props} />);
  expect(screen.getByRole("link", { name: "Добавить товар" })).toHaveAttribute(
    "href",
    `${path}/products/new`,
  );
  expect(catalog.useList).toHaveBeenCalledWith(
    "owner",
    "store-1",
    0,
    10,
    undefined,
  );
  const productLink = screen.getByRole("link", { name: "Обложка" });
  expect(productLink).toHaveAttribute("href", `${path}/products/product-1`);
  expect(productLink).toHaveAccessibleDescription(
    /Тип: Услуга.*Вид предложения: Обычное.*Цена: —/,
  );
  expect(screen.queryByText("Каталог товара")).toBeNull();
});

it("localizes a product kind and shows each distinct offer price with its currency", () => {
  const rubles = {
    attributeId: "rub-price",
    currencyId: "rub",
    currencyTitle: "RUB",
    currencySymbol: "₽",
    amount: "500",
    editable: true,
  };
  const euros = {
    ...rubles,
    attributeId: "eur-price",
    currencyId: "eur",
    currencyTitle: "EUR",
    currencySymbol: "€",
    amount: "12",
  };
  const usd = {
    ...rubles,
    currencyId: "usd",
    currencySymbol: "$",
    currencyTitle: "USD",
  };
  const cad = { ...usd, currencyId: "cad", currencyTitle: "CAD" };
  catalog.useList.mockReturnValue({
    data: {
      total: 1,
      items: [
        {
          ...managedProduct,
          offers: [
            {
              ...managedProduct.offers[0],
              prices: [rubles, euros, rubles, usd],
            },
            { ...managedProduct.offers[0], id: "second-offer", prices: [] },
          ],
          productPrices: [cad],
        },
      ],
    },
  } as unknown as ReturnType<typeof catalog.useList>);
  render(<Products variant={productsVariant} {...props} language="en" />);
  const row = screen.getByRole("link", { name: "Обложка" });
  expect(within(row).getByText("Service")).toBeVisible();
  expect(within(row).getByText("Standard")).toBeVisible();
  expect(within(row).getAllByText("500 ₽")).toHaveLength(1);
  expect(within(row).getByText("12 €")).toBeVisible();
  expect(within(row).getByText("500 USD")).toBeVisible();
  expect(within(row).getByText("500 CAD")).toBeVisible();
});

it("links to employee details for readers and shows the creation link only to managers", () => {
  workspace.useEmployees.mockReturnValue({
    data: {
      items: [
        {
          id: "employee-1",
          name: "Fallback name",
          kind: "ai",
          profile: {
            title: { ru: "Анна", en: "Anna" },
            subtitle: { ru: "Редактор каталога", en: "Catalog editor" },
            slug: "anna-catalog",
            variant: "artificial-intelligence",
          },
        },
        { id: "employee-2", name: "Без профиля", kind: "human" },
      ],
      total: 2,
    },
  } as ReturnType<typeof workspace.useEmployees>);
  useStoresData({ ...ownerStore, canManageEmployees: false });
  const { unmount } = render(
    <Employees variant={employeesVariant} {...props} />,
  );

  expect(workspace.useEmployees).toHaveBeenCalledWith({
    id: "owner",
    params: { storeId: "store-1", limit: 10, offset: 0 },
  });
  const employee = screen.getByRole("link", { name: "Анна" });
  expect(employee).toHaveAttribute("href", `${path}/employees/employee-1`);
  expect(employee).toHaveAccessibleDescription(
    "Редактор каталога anna-catalog Вариант профиля artificial-intelligence",
  );
  expect(
    screen.getByRole("link", { name: "Без профиля" }),
  ).not.toHaveAccessibleDescription();
  expect(screen.queryByText("ИИ-сотрудник")).not.toBeInTheDocument();
  expect(screen.queryByText("Тип")).not.toBeInTheDocument();
  expect(screen.getByText("anna-catalog")).toBeInTheDocument();
  expect(screen.getByText("artificial-intelligence")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Добавить сотрудника" }),
  ).toBeNull();
  unmount();

  useStoresData(ownerStore);
  render(<Employees variant={employeesVariant} {...props} language="en" />);
  expect(
    screen.getByRole("link", { name: "Anna" }),
  ).toHaveAccessibleDescription(
    "Catalog editor anna-catalog Profile variant artificial-intelligence",
  );
  expect(screen.getByRole("link", { name: "Add employee" })).toHaveAttribute(
    "href",
    "/en/ecommerce/stores/shop/employees/new",
  );
});

it("navigates to the employee profile after creation", async () => {
  const mutateAsync = jest.fn().mockResolvedValue({
    kind: "create-employee",
    data: { id: "employee-new" },
  });
  workspace.useCommand.mockReturnValue({ mutateAsync } as unknown as ReturnType<
    typeof workspace.useCommand
  >);
  render(<EmployeeCreate variant={employeeCreateVariant} {...props} />);

  fireEvent.change(screen.getByLabelText("Имя сотрудника"), {
    target: { value: "Михаил" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Создать сотрудника" }));

  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith(`${path}/employees/employee-new`),
  );
  expect(mutateAsync).toHaveBeenCalledWith({
    kind: "create-employee",
    employee: {
      storeId: "store-1",
      name: "Михаил",
      operationKey: expect.any(String),
    },
  });
});

it("keeps current tasks and shows the private chat only when the operator can train the employee", async () => {
  const mutateAsync = jest.fn().mockResolvedValue({
    kind: "open-employee-chat",
    data: { chatId: "chat", threadId: "training-thread" },
  });
  workspace.useCommand.mockReturnValue({ mutateAsync } as unknown as ReturnType<
    typeof workspace.useCommand
  >);
  workspace.useTasks.mockReturnValue({
    data: {
      items: [
        {
          id: "task-1",
          label: "Обложка",
          customerName: "Марина",
          stageName: "Дизайн",
          status: "waiting",
        },
      ],
    },
  } as ReturnType<typeof workspace.useTasks>);
  workspace.useEmployee.mockReturnValue({
    data: { id: "employee-1", name: "Анна", kind: "human", canTrain: false },
  } as ReturnType<typeof workspace.useEmployee>);
  const { rerender } = render(
    <EmployeeDetail
      variant={employeeDetailVariant}
      {...props}
      rbacSubjectId="employee-1"
    />,
  );

  expect(workspace.useTasks).toHaveBeenCalledWith(
    {
      id: "owner",
      params: {
        storeId: "store-1",
        assigneeId: "employee-1",
        current: true,
        includeStageNames: true,
        limit: 20,
      },
    },
    true,
  );
  expect(screen.getByRole("link", { name: /Обложка/ })).toHaveAttribute(
    "href",
    `${path}/crm/tasks/task-1`,
  );
  expect(
    screen.getByRole("link", { name: /Марина.*Дизайн.*Ожидание/ }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Служебный чат" })).toBeNull();

  workspace.useEmployee.mockReturnValue({
    data: { id: "employee-1", name: "Анна", kind: "ai", canTrain: true },
  } as ReturnType<typeof workspace.useEmployee>);
  rerender(
    <EmployeeDetail
      variant={employeeDetailVariant}
      {...props}
      rbacSubjectId="employee-1"
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Подключить служебный чат" }),
  );
  await waitFor(() =>
    expect(mutateAsync).toHaveBeenCalledWith({
      kind: "open-employee-chat",
      employee: { storeId: "store-1", subjectId: "employee-1" },
    }),
  );

  workspace.useEmployee.mockReturnValue({
    data: {
      id: "employee-1",
      name: "Анна",
      kind: "ai",
      canTrain: true,
      training: {
        actorProfile: { id: "manager-profile" },
        profileId: "employee-profile",
        chatId: "chat",
        threadId: "training-thread",
      },
    },
  } as ReturnType<typeof workspace.useEmployee>);
  rerender(
    <EmployeeDetail
      variant={employeeDetailVariant}
      {...props}
      rbacSubjectId="employee-1"
    />,
  );
  expect(screen.getByText("История служебного чата")).toBeInTheDocument();
  expect(screen.getByText("ИИ-сотрудник")).toBeInTheDocument();
  expect(mockEmployeeConversation).toHaveBeenLastCalledWith(
    expect.objectContaining({
      data: { id: "owner" },
      socialModuleProfile: { id: "manager-profile" },
      socialModuleEmployeeProfileId: "employee-profile",
      socialModuleChatId: "chat",
      socialModuleThreadId: "training-thread",
      defaultThreadId: "training-thread",
      getThreadHref: expect.any(Function),
      onCreateThread: expect.any(Function),
    }),
  );
  expect(screen.getByRole("link", { name: /Обложка/ })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Подключить служебный чат" }),
  ).toBeNull();
  window.history.replaceState(
    null,
    "",
    `${path}/employees/employee-1?view=tasks&thread=covers#chat`,
  );
  rerender(
    <EmployeeDetail
      variant={employeeDetailVariant}
      {...props}
      rbacSubjectId="employee-1"
    />,
  );
  expect(mockEmployeeConversation).toHaveBeenLastCalledWith(
    expect.objectContaining({
      defaultThreadId: "training-thread",
      socialModuleThreadId: "covers",
    }),
  );
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Новая тема" }),
  ).not.toBeInTheDocument();
  const { getThreadHref, onCreateThread } =
    mockEmployeeConversation.mock.lastCall![0];
  const href = new URL(getThreadHref("palette"), window.location.href);
  expect(href.pathname).toBe(`${path}/employees/employee-1`);
  expect(href.searchParams.get("view")).toBe("tasks");
  expect(href.searchParams.get("thread")).toBe("palette");
  expect(href.hash).toBe("#chat");
  expect(
    new URL(
      getThreadHref("training-thread"),
      window.location.href,
    ).searchParams.has("thread"),
  ).toBe(false);
  mutateAsync
    .mockRejectedValueOnce(new Error("Network unavailable"))
    .mockResolvedValueOnce({
      kind: "create-employee-thread",
      data: {
        id: "employee-1",
        chatId: "chat",
        threadId: "palette",
        profileId: "employee-profile",
      },
    });
  await expect(onCreateThread("Палитра")).rejects.toThrow();
  await expect(onCreateThread("Палитра")).resolves.toBe("palette");
  const expected = {
    kind: "create-employee-thread",
    employee: {
      storeId: "store-1",
      subjectId: "employee-1",
      title: "Палитра",
      operationKey: expect.any(String),
    },
  };
  expect(mutateAsync).toHaveBeenNthCalledWith(2, expected);
  expect(mutateAsync).toHaveBeenNthCalledWith(3, mutateAsync.mock.calls[1][0]);
  expect(mockPush).not.toHaveBeenCalled();
});

it("opens the management product, its editor, linked funnel and its order", () => {
  render(
    <ProductDetail
      variant={productDetailVariant}
      {...props}
      ecommerceModuleProductId="product-1"
    />,
  );
  expect(catalog.useDetail).toHaveBeenCalledWith(
    "owner",
    "store-1",
    "product-1",
    0,
  );
  expect(screen.getByRole("heading", { name: "Обложка" })).toBeInTheDocument();
  expect(screen.getByText("Твёрдая обложка").tagName).toBe("STRONG");
  expect(screen.getByRole("link", { name: /Редактировать/ })).toHaveAttribute(
    "href",
    `${path}/products/product-1/edit`,
  );
  expect(screen.getByRole("link", { name: /order-1/ })).toHaveAttribute(
    "href",
    `${path}/orders/order-1`,
  );
  expect(screen.getByRole("link", { name: "Дизайн обложки" })).toHaveAttribute(
    "href",
    `${path}/crm/funnels/covers`,
  );
  expect(screen.queryByText("Каталог товара")).toBeNull();
});

it("saves a localized edit against the product and store from the route", () => {
  const mutate = jest.fn();
  catalog.useUpdate.mockReturnValue({ mutate } as unknown as ReturnType<
    typeof catalog.useUpdate
  >);
  render(
    <ProductEdit
      variant={productEditVariant}
      {...props}
      ecommerceModuleProductId="product-1"
    />,
  );
  const save = screen.getByRole("button", { name: "Сохранить изменения" });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByRole("textbox", { name: "Краткое описание" }), {
    target: { value: "Новая обложка по фотографии" },
  });
  fireEvent.click(save);

  expect(mutate).toHaveBeenCalledWith(
    {
      id: "owner",
      storeId: "store-1",
      productId: "product-1",
      data: {
        translations: {
          expectedUpdatedAt: managedProduct.product.updatedAt,
          entries: { ru: { shortDescription: "Новая обложка по фотографии" } },
        },
      },
    },
    expect.any(Object),
  );
});

it("keeps the management editor private when a store visitor opens its URL", () => {
  mockAuthenticated = false;
  render(
    <ProductEdit
      variant={productEditVariant}
      {...props}
      ecommerceModuleProductId="product-1"
    />,
  );
  expect(catalog.useDetail).not.toHaveBeenCalled();
  expect(catalog.useUpdate).not.toHaveBeenCalled();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("serves the store editor at settings and reserves editing for catalog managers", () => {
  useStoresData({ ...ownerStore, canManageCatalog: false });
  const { unmount } = render(<Settings variant={settingsVariant} {...props} />);

  expect(providerConnections).not.toHaveBeenCalled();
  expect(screen.queryByRole("link", { name: "Операции" })).toBeNull();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "права на управление каталогом",
  );
  unmount();

  useStoresData(ownerStore);
  render(<Settings variant={settingsVariant} {...props} />);
  expect(
    screen.getByRole("form", { name: "Настройки магазина" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Настройки" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(providerConnections).not.toHaveBeenCalled();
});
