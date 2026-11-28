/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { stageSchema } from "@sps/crm/models/stage/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceFunnel } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IWidget } from "@sps/rbac/models/widget/sdk/model";
import type { ReactNode } from "react";
import { Component as Create } from "./create";
import { Component as Edit } from "./edit";
import { Component as List } from "./list";
import { variant as createVariant } from "./create/interface";
import { variant as editVariant } from "./edit/interface";
import { variant as listVariant } from "./list/interface";

const mockReplace = jest.fn();
const mockPresentationFind = jest.fn();
let mockAuthenticated: boolean;

jest.mock(
  "@sps/rbac/relations/widgets-to-ecommerce-module-widgets/frontend/component",
  () => ({
    Component: ({
      children,
    }: {
      children: ReactNode | ((result: object) => ReactNode);
    }) =>
      typeof children === "function"
        ? children({ data: [{ id: "header-link" }] })
        : children,
  }),
);

jest.mock("server-only", () => ({}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
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
      variant: string;
      children: ReactNode | ((data: object) => ReactNode);
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
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: {
    children: (result: object) => ReactNode;
    fallback: ReactNode;
  }) =>
    mockAuthenticated
      ? props.children({ data: { id: "owner" }, authenticated: true })
      : props.fallback,
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    crmWorkspace: {
      useStores: jest.fn(),
      useOptions: jest.fn(),
      useFunnelProducts: jest.fn(),
      useFunnels: jest.fn(),
      useFunnel: jest.fn(),
      useDetail: jest.fn(),
      useCommand: jest.fn(),
    },
  },
}));

const workspace = jest.mocked(api.crmWorkspace);
type Execute = ReturnType<typeof workspace.useCommand>["mutateAsync"];
const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();
const refetchFunnel = jest.fn().mockResolvedValue(undefined);
const date = "2026-11-20T10:00:00.000Z";
const funnel: ICrmWorkspaceFunnel = {
  id: "funnel-1",
  slug: "persisted-slug",
  createdAt: date,
  updatedAt: date,
  storeId: "store-1",
  revision: 5,
  name: "Обложки",
  kind: "consultation",
  definition: {
    initialStageId: "intake",
    stages: [
      { id: "intake", name: "Подготовка", instruction: "", actions: [] },
    ],
  },
  bindings: { productIds: [], offerIds: [], formIds: [] },
};
const path = "/ru/ecommerce/stores/shop/crm/funnels";
const widgetProps = {
  dataSource: "props" as const,
  data: { id: "routed-widget" } as IWidget,
  ecommerceModuleStoreSlug: "shop",
  language: "ru",
  isServer: true,
};
const edit = (
  <Edit
    variant={editVariant}
    crmModuleFunnelSlug={funnel.slug}
    {...widgetProps}
  />
);

it("uses the instruction for image handling when editing a former cover stage", async () => {
  const current: ICrmWorkspaceFunnel = {
    ...funnel,
    kind: "individual-service",
    definition: {
      ...funnel.definition,
      stages: [
        {
          ...funnel.definition.stages[0],
          coverAttachmentRole: "product-photo",
        },
      ],
    },
  };
  workspace.useFunnel.mockReturnValue({ data: current } as ReturnType<
    typeof workspace.useFunnel
  >);
  execute.mockResolvedValue({ kind: "save-funnel-stage", data: current });
  render(edit);

  expect(screen.queryByText("Фотографии для обложки")).toBeNull();
  const instruction = "Опиши назначение полученного документа.";
  fireEvent.change(screen.getByRole("textbox", { name: "Инструкция" }), {
    target: { value: instruction },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));
  expect(await screen.findByText("Этап сохранён.")).toBeVisible();
  const [command] = execute.mock.calls[0];
  expect(command.kind).toBe("save-funnel-stage");
  if (command.kind === "save-funnel-stage") {
    expect(command.funnel.stage.instruction).toBe(instruction);
    expect(command.funnel.stage).not.toHaveProperty("coverAttachmentRole");
  }
});

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

async function selectStageEmployee(name: string) {
  fireEvent.click(screen.getByRole("combobox", { name: "Исполнитель этапа" }));
  fireEvent.change(
    await screen.findByRole("combobox", { name: "Поиск исполнителя" }),
    {
      target: { value: name },
    },
  );
  fireEvent.click(await screen.findByRole("option", { name }));
}

beforeEach(() => {
  jest.clearAllMocks();
  execute.mockReset();
  mockAuthenticated = true;
  workspace.useStores.mockReturnValue({
    data: [{ id: funnel.storeId, slug: "shop", title: "Магазин" }],
  } as ReturnType<typeof workspace.useStores>);
  workspace.useOptions.mockReturnValue({
    data: {
      participants: [{ id: "owner", name: "Владелец", kind: "human" }],
      employees: [],
      canManageEmployees: true,
      payers: [],
      currencies: [],
      skillsByAssignee: {},
    },
  } as ReturnType<typeof workspace.useOptions>);
  workspace.useFunnels.mockReturnValue({
    data: { items: [funnel], total: 1, nextCursor: null },
  } as ReturnType<typeof workspace.useFunnels>);
  workspace.useFunnel.mockReturnValue({
    data: funnel,
    refetch: refetchFunnel,
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  workspace.useDetail.mockReturnValue(
    {} as ReturnType<typeof workspace.useDetail>,
  );
  workspace.useCommand.mockReturnValue({
    mutateAsync: execute,
  } as unknown as ReturnType<typeof workspace.useCommand>);
});

it("uses the routed widget's presentation and links to the saved funnel slug", () => {
  render(<List variant={listVariant} {...widgetProps} />);

  expect(mockPresentationFind).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [{ column: "widgetId", method: "eq", value: "routed-widget" }],
      },
    },
  });
  expect(workspace.useStores).toHaveBeenCalledWith("owner", "shop");
  expect(workspace.useFunnels).toHaveBeenCalledWith({
    id: "owner",
    params: expect.objectContaining({ storeId: funnel.storeId }),
  });
  const funnelLink = screen.getByRole("link", { name: funnel.name });
  expect(funnelLink).toHaveAttribute("href", `${path}/${funnel.slug}`);
  expect(funnelLink).toHaveAccessibleDescription("Этапов: 1");
  expect(screen.getByRole("link", { name: "Новая воронка" })).toHaveAttribute(
    "href",
    `${path}/new`,
  );
  expect(
    screen.queryByRole("textbox", { name: "Название воронки" }),
  ).toBeNull();
});

it("opens a direct edit by store and slug and saves the loaded revision", async () => {
  const name = "Новые обложки";
  execute.mockResolvedValue({
    kind: "save-funnel-settings",
    data: { ...funnel, name, revision: 6 },
  });
  render(edit);

  expect(workspace.useFunnel).toHaveBeenCalledWith({
    id: "owner",
    params: { storeId: funnel.storeId, funnelSlug: funnel.slug },
  });
  expect(workspace.useFunnels).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("textbox", { name: "Название воронки" }), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Сохранить настройки" }));

  expect(
    await screen.findByText("Настройки воронки сохранены."),
  ).toBeInTheDocument();
  expect(execute).toHaveBeenCalledTimes(1);
  expect(execute).toHaveBeenCalledWith({
    kind: "save-funnel-settings",
    funnel: expect.objectContaining({
      funnelId: funnel.id,
      name,
      expectedRevision: 5,
    }),
  });
});

it("keeps the draft until the user loads a newer revision", () => {
  const { rerender } = render(edit);
  const name = screen.getByRole("textbox", { name: "Название воронки" });
  fireEvent.change(name, { target: { value: "Мой черновик" } });
  workspace.useFunnel.mockReturnValue({
    data: { ...funnel, name: "Версия коллеги", revision: 6 },
  } as ReturnType<typeof workspace.useFunnel>);
  rerender(
    <Edit
      variant={editVariant}
      crmModuleFunnelSlug={funnel.slug}
      {...widgetProps}
    />,
  );

  expect(name).toHaveValue("Мой черновик");
  expect(
    screen.getByRole("button", { name: "Сохранить настройки" }),
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole("button", { name: "Загрузить новую версию" }),
  );
  expect(name).toHaveValue("Версия коллеги");
  expect(
    screen.getByRole("button", { name: "Сохранить настройки" }),
  ).toBeEnabled();
});

it("keeps linked products across paged searches and saves edits to legacy offer links", async () => {
  const legacy = { id: "legacy-product", title: "Старый товар" };
  const unavailable = { id: "unlisted-id" };
  const current = { id: "new-product", title: "Новый товар" };
  const later = { id: "on-second-page", title: "Товар со второй страницы" };
  const firstPage = [
    legacy,
    ...Array.from({ length: 9 }, (_, i) => ({
      id: String(i),
      title: `Изделие ${i}`,
    })),
  ];
  workspace.useFunnelProducts.mockImplementation(({ params }) => {
    const data = params.search
      ? { items: [current], total: 1 }
      : { items: params.offset ? [later] : firstPage, total: 11 };
    return { data, isPending: false, isError: false } as ReturnType<
      typeof workspace.useFunnelProducts
    >;
  });
  const read = workspace.useFunnel({
    id: "owner",
    params: { storeId: funnel.storeId, funnelSlug: funnel.slug },
  });
  workspace.useFunnel.mockReturnValue({
    ...read,
    data: {
      ...funnel,
      bindings: { ...funnel.bindings, offerIds: ["legacy-offer"] },
      linkedProducts: [legacy, unavailable],
    },
  });
  const saved = {
    ...funnel,
    revision: 6,
    bindings: { ...funnel.bindings, productIds: [later.id, current.id] },
    linkedProducts: [later, current],
  };
  execute.mockResolvedValue({ kind: "save-funnel-settings", data: saved });
  const { unmount } = render(edit);
  expect(workspace.useOptions).toHaveBeenCalledWith(
    "owner",
    funnel.storeId,
    "editor",
  );
  expect(workspace.useFunnelProducts).not.toHaveBeenCalled();
  expect(
    screen.getByRole("link", { name: `Открыть товар «${legacy.title}»` }),
  ).toHaveAttribute("href", `/ru/ecommerce/stores/shop/products/${legacy.id}`);
  fireEvent.click(screen.getByRole("button", { name: "Выбрать товары" }));
  expect(screen.getByRole("option", { name: legacy.title })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Следующая страница" }));
  fireEvent.click(screen.getByRole("option", { name: later.title }));
  expect(workspace.useFunnelProducts).toHaveBeenCalledWith({
    id: "owner",
    params: {
      storeId: funnel.storeId,
      language: "ru",
      offset: 10,
      limit: 10,
      search: undefined,
    },
  });
  const search = screen.getByRole("combobox", {
    name: "Поиск по названию товара",
  });
  fireEvent.change(search, { target: { value: "Новый" } });
  const result = await screen.findByRole("option", { name: current.title });
  fireEvent.keyDown(search, { key: "ArrowDown", code: "ArrowDown" });
  fireEvent.keyDown(search, { key: "Enter", code: "Enter" });
  expect(result).toHaveAttribute("aria-checked", "true");
  expect(workspace.useFunnelProducts).toHaveBeenCalledWith({
    id: "owner",
    params: {
      storeId: funnel.storeId,
      language: "ru",
      offset: 0,
      limit: 10,
      search: "Новый",
    },
  });
  fireEvent.keyDown(search, { key: "Escape", code: "Escape" });
  fireEvent.click(
    screen.getByRole("button", { name: `Убрать «${legacy.title}»` }),
  );
  expect(screen.getByText("Недоступный товар · unlisted")).toBeVisible();
  expect(screen.queryByRole("link", { name: /Недоступный товар/ })).toBeNull();
  fireEvent.click(
    screen.getByRole("button", {
      name: "Убрать «Недоступный товар · unlisted»",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Сохранить настройки" }));
  expect(
    await screen.findByText("Настройки воронки сохранены."),
  ).toBeInTheDocument();
  expect(execute).toHaveBeenCalledWith({
    kind: "save-funnel-settings",
    funnel: expect.objectContaining({
      storeId: funnel.storeId,
      expectedRevision: funnel.revision,
      linkedProductIds: [later.id, current.id],
    }),
  });
  unmount();
  workspace.useFunnel.mockReturnValue({ ...read, data: saved });
  render(edit);
  expect(
    screen.queryByRole("link", { name: `Открыть товар «${legacy.title}»` }),
  ).not.toBeInTheDocument();
  for (const product of [later, current]) {
    expect(
      screen.getByRole("link", { name: `Открыть товар «${product.title}»` }),
    ).toHaveAttribute(
      "href",
      `/ru/ecommerce/stores/shop/products/${product.id}`,
    );
  }
});

it("opens the localized product badge before loading any page of choices", () => {
  workspace.useFunnel.mockReturnValue({
    data: {
      ...funnel,
      linkedProducts: [
        {
          id: "canvas",
          title: "Картина",
          localizedTitle: { ru: "Картина", en: "Canvas" },
        },
      ],
    },
    refetch: refetchFunnel,
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  render(
    <Edit
      {...widgetProps}
      language="en"
      variant={editVariant}
      crmModuleFunnelSlug={funnel.slug}
    />,
  );
  expect(
    screen.getByRole("link", { name: "Open product “Canvas”" }),
  ).toHaveAttribute("href", "/en/ecommerce/stores/shop/products/canvas");
  expect(workspace.useFunnelProducts).not.toHaveBeenCalled();
});

it("keeps selected options removable at the funnel binding limit", () => {
  const selected = Array.from({ length: 100 }, (_, index) => ({
    id: `product-${index}`,
    title: `Товар ${index}`,
  }));
  const extra = { id: "extra-product", title: "Ещё один товар" };
  workspace.useFunnel.mockReturnValue({
    data: { ...funnel, linkedProducts: selected },
    refetch: refetchFunnel,
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  workspace.useFunnelProducts.mockReturnValue({
    data: { items: [selected[0], extra], total: 2 },
    isPending: false,
    isError: false,
  } as ReturnType<typeof workspace.useFunnelProducts>);
  render(edit);
  fireEvent.click(screen.getByRole("button", { name: "Выбрать товары" }));
  const alreadySelected = screen.getByRole("option", {
    name: selected[0].title,
  });
  const newChoice = screen.getByRole("option", { name: extra.title });
  expect(newChoice).toHaveAttribute("aria-disabled", "true");
  expect(alreadySelected).toHaveAttribute("aria-checked", "true");
  fireEvent.click(alreadySelected);
  expect(newChoice).not.toHaveAttribute("aria-disabled", "true");
  fireEvent.click(newChoice);
  expect(newChoice).toHaveAttribute("aria-checked", "true");
});

it.each([
  [403, "Нет доступа к воронкам этого магазина."],
  [404, "Воронка в этом магазине не найдена."],
])("hides cached edit data after a %s response", (status, message) => {
  workspace.useFunnel.mockReturnValue({
    data: funnel,
    error: { status },
    isError: true,
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  render(edit);

  expect(screen.getByRole("alert")).toHaveTextContent(message);
  expect(
    screen.queryByRole("textbox", { name: "Название воронки" }),
  ).toBeNull();
});

it("waits for sign-in before reading shop data", () => {
  mockAuthenticated = false;
  render(edit);

  expect(
    screen.getByText("Войдите в аккаунт, чтобы открыть воронки магазина."),
  ).toBeInTheDocument();
  expect(workspace.useStores).not.toHaveBeenCalled();
  expect(workspace.useFunnel).not.toHaveBeenCalled();
});

it("retries with the same creation key and opens the saved funnel route", async () => {
  const name = "Новая воронка";
  const slug = "another-persisted-slug";
  execute
    .mockRejectedValueOnce(new Error("Воронку не удалось сохранить."))
    .mockResolvedValueOnce({
      kind: "save",
      data: { ...funnel, id: "funnel-2", name, slug },
    });
  render(<Create variant={createVariant} {...widgetProps} />);

  fireEvent.change(screen.getByRole("textbox", { name: "Название воронки" }), {
    target: { value: name },
  });
  const create = screen.getByRole("button", { name: "Создать воронку" });
  fireEvent.click(create);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Воронку не удалось сохранить.",
  );
  fireEvent.click(create);

  expect(await screen.findByText("Воронка сохранена.")).toBeInTheDocument();
  const [first] = execute.mock.calls[0];
  expect(first).toEqual({
    kind: "save",
    funnel: expect.objectContaining({ name, operationKey: expect.any(String) }),
  });
  expect(execute).toHaveBeenNthCalledWith(2, first);
  expect(mockReplace).toHaveBeenCalledWith(`${path}/${slug}`);
});

it("edits the funnel without opening or starting a test task", () => {
  render(edit);
  expect(workspace.useDetail).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Запустить тест" })).toBeNull();
});

it("links to employee creation when no one can be assigned to the stage", () => {
  const current = workspace.useOptions.getMockImplementation()?.(
    "owner",
    funnel.storeId,
  );
  workspace.useOptions.mockReturnValue({
    ...current,
    data: { ...current?.data, participants: [] },
  } as ReturnType<typeof workspace.useOptions>);
  render(<Create variant={createVariant} {...widgetProps} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Название воронки" }), {
    target: { value: "Обложки" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Создать воронку" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Выберите сотрудника для этапа.",
  );
  expect(
    screen.getByRole("link", { name: "Добавить сотрудника" }),
  ).toHaveAttribute("href", "/ru/ecommerce/stores/shop/employees/new");
  expect(execute).not.toHaveBeenCalled();
});

it("saves the customer multiplier without stage or message limits when a new AI employee is selected", async () => {
  const options = workspace.useOptions.getMockImplementation();
  const current = options?.("owner", funnel.storeId);
  const tokenId = "9088eecb-4acd-404f-ae35-9e10dc304c0a";
  const ownerId = "e08a073b-a7e2-44f7-adfa-71a10459d72d";
  workspace.useOptions.mockReturnValue({
    ...current,
    data: {
      ...current?.data,
      participants: [{ id: "agent", name: "Редактор", kind: "ai" }],
      payers: [{ id: ownerId, name: "Владелец", kind: "human" }],
      currencies: [{ id: tokenId, slug: "token", title: "Token", units: 4 }],
    },
  } as ReturnType<typeof workspace.useOptions>);
  execute.mockResolvedValue({ kind: "save-funnel-stage", data: funnel });
  render(edit);

  await selectStageEmployee("Редактор");
  const save = screen.getByRole("button", { name: "Сохранить этап" });
  fireEvent.change(screen.getByRole("textbox", { name: /коэффициент/i }), {
    target: { value: "1.5" },
  });
  expect(
    screen.queryByRole("textbox", { name: "На одно сообщение, Token" }),
  ).toBeNull();
  expect(
    screen.queryByRole("textbox", { name: "На этап в одной задаче, Token" }),
  ).toBeNull();
  fireEvent.click(save);

  expect(await screen.findByText("Этап сохранён.")).toBeInTheDocument();
  expect(execute).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: "save-funnel-stage",
      funnel: expect.objectContaining({
        stage: expect.objectContaining({
          defaultAssigneeSubjectId: "agent",
          workFunding: {
            payer: "customer",
            multiplier: "1.5",
            currencyId: tokenId,
          },
        }),
      }),
    }),
  );
});

it.each([
  {
    field: "Инструкция",
    value: "Укажи открытые вопросы в брифе.",
    instruction: "Укажи открытые вопросы в брифе.",
    multiplier: "2",
  },
  {
    field: "Коэффициент стоимости для клиента",
    value: "2.5",
    instruction: "Подготовь бриф.",
    multiplier: "2.5",
  },
])(
  "keeps the saved Token-funded PDF terms when editing $field",
  async ({ field, value, instruction, multiplier }) => {
    const currencyId = "9088eecb-4acd-404f-ae35-9e10dc304c0a";
    const employeeId = "e08a073b-a7e2-44f7-adfa-71a10459d72d";
    const options = workspace.useOptions("owner", funnel.storeId);
    workspace.useOptions.mockReturnValue({
      ...options,
      data: {
        ...options.data!,
        participants: [{ id: employeeId, name: "Редактор", kind: "ai" }],
        currencies: [
          { id: currencyId, slug: "token", title: "Token", units: 4 },
        ],
      },
    });
    const stage = stageSchema.parse({
      id: "prepare",
      name: "Результат и правки",
      instruction: "Подготовь бриф.",
      defaultAssigneeSubjectId: employeeId,
      output: "pdf",
      workFunding: {
        payer: "customer",
        multiplier: "2",
        currencyId,
        maxRunAmount: "1200",
      },
      operations: ["knowledge-search"],
      resultPricing: { kind: "work-tokens" },
      actions: [
        {
          id: "accept",
          name: "Принять версию",
          actors: ["system"],
          evidence: ["result-accepted"],
          outcome: "completed",
        },
      ],
    });
    const current: ICrmWorkspaceFunnel = {
      ...funnel,
      kind: "individual-service",
      definition: { initialStageId: stage.id, stages: [stage] },
    };
    workspace.useFunnel.mockReturnValue({ data: current } as ReturnType<
      typeof workspace.useFunnel
    >);
    execute.mockResolvedValue({ kind: "save-funnel-stage", data: current });
    render(edit);

    const format = screen.getByRole("combobox", { name: "Формат результата" });
    expect(format).toBeDisabled();
    expect(format).toHaveTextContent("PDF");
    const orderAction = screen.getByRole("combobox", {
      name: "Действие с заказом",
    });
    expect(orderAction).toBeDisabled();
    expect(orderAction).toHaveAccessibleDescription(/Это последний этап/);
    expect(screen.queryByText(/с водяным знаком/)).toBeNull();
    expect(
      screen.getByText(/коэффициент должен быть больше нуля/),
    ).toBeVisible();

    const input = screen.getByRole("textbox", { name: field });
    const save = screen.getByRole("button", { name: "Сохранить этап" });
    if (field === "Коэффициент стоимости для клиента") {
      fireEvent.change(input, { target: { value: "0" } });
      fireEvent.click(save);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Для этого этапа укажите коэффициент больше нуля.",
      );
      expect(execute).not.toHaveBeenCalled();
    }
    fireEvent.change(input, { target: { value } });
    fireEvent.click(save);

    expect(await screen.findByText("Этап сохранён.")).toBeVisible();
    expect(execute).toHaveBeenCalledWith({
      kind: "save-funnel-stage",
      funnel: {
        storeId: current.storeId,
        funnelId: current.id,
        expectedRevision: current.revision,
        stage: expect.objectContaining({
          instruction,
          output: "pdf",
          resultPricing: stage.resultPricing,
          workFunding: {
            payer: "customer",
            multiplier,
            currencyId,
            maxRunAmount: "1200",
          },
          operations: stage.operations,
          actions: stage.actions,
        }),
      },
    });
  },
);

it("defaults to Astra High and saves an explicit Medium selection", async () => {
  execute.mockResolvedValue({ kind: "save-funnel-stage", data: funnel });
  render(edit);

  const model = screen.getByRole("button", { name: "Используемая модель" });
  expect(model).toHaveTextContent("Авто · GPT-6.2 Astra · Высокий");
  expect(screen.queryByRole("button", { name: "Архивировать" })).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Режим рассуждения" }),
  ).toBeNull();
  fireEvent.click(model);
  const search = await screen.findByRole("searchbox", { name: "Поиск модели" });
  fireEvent.change(search, { target: { value: "mini" } });
  expect(screen.getByRole("status")).toHaveTextContent("Модели не найдены");
  fireEvent.change(search, { target: { value: "astra" } });
  fireEvent.click(screen.getByRole("button", { name: /^GPT-6\.2 Astra/ }));

  const reasoning = screen.getByRole("button", { name: "Режим рассуждения" });
  expect(reasoning).toHaveTextContent("Высокий");
  expect(model).not.toHaveAccessibleDescription(/применяется выбор клиента/);
  fireEvent.keyDown(reasoning, { key: "Enter" });
  const medium = await screen.findByRole("menuitemradio", {
    name: "Средний",
    exact: true,
  });
  expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
  expect(
    screen.getByRole("menuitemradio", { name: "Высокий", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  fireEvent.click(medium);
  expect(reasoning).toHaveTextContent("Средний");
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));

  expect(await screen.findByText("Этап сохранён.")).toBeInTheDocument();
  expect(execute.mock.calls[0][0]).toMatchObject({
    kind: "save-funnel-stage",
    funnel: {
      stage: {
        provider: { modelId: "gpt-6.2-astra", reasoning: "medium" },
      },
    },
  });
});

it("keeps the saved legacy model and effort when editing an existing funnel", async () => {
  const provider = {
    modelId: "gpt-5.4-mini-2026-03-17",
    reasoning: "low",
  } as const;
  const saved = {
    ...funnel,
    definition: {
      ...funnel.definition,
      stages: [{ ...funnel.definition.stages[0], provider }],
    },
  };
  workspace.useFunnel.mockReturnValue({
    data: saved,
    refetch: refetchFunnel,
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  execute.mockResolvedValue({ kind: "save-funnel-stage", data: saved });
  render(edit);

  expect(
    screen.getByRole("button", { name: "Используемая модель" }),
  ).toHaveTextContent(provider.modelId);
  expect(screen.getByText("Режим рассуждения · Низкий")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Режим рассуждения" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));

  expect(await screen.findByText("Этап сохранён.")).toBeInTheDocument();
  expect(execute.mock.calls[0][0]).toMatchObject({
    kind: "save-funnel-stage",
    funnel: { stage: { provider } },
  });
});

it("offers only the image model for an image stage", async () => {
  workspace.useFunnel.mockReturnValue({
    data: {
      ...funnel,
      kind: "individual-service",
      definition: {
        ...funnel.definition,
        stages: [{ ...funnel.definition.stages[0], output: "image" }],
      },
    },
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  render(edit);

  expect(
    screen.getByText(/сервер создаёт копию с водяным знаком/),
  ).toBeVisible();
  const model = screen.getByRole("button", { name: "Используемая модель" });
  expect(model).toHaveTextContent(/^Авто$/);
  fireEvent.click(model);
  expect(screen.queryByRole("button", { name: /^GPT-6\.2 Astra/ })).toBeNull();
  fireEvent.click(
    await screen.findByRole("button", {
      name: "gpt-image-2.5-flare-2026-09-08",
    }),
  );
  expect(model).toHaveTextContent("gpt-image-2.5-flare-2026-09-08");
  expect(
    screen.queryByRole("button", { name: "Режим рассуждения" }),
  ).toBeNull();
});

it("uses the route language for the model picker and hint", async () => {
  render(
    <Edit
      variant={editVariant}
      crmModuleFunnelSlug={funnel.slug}
      {...widgetProps}
      language="en"
    />,
  );
  const model = screen.getByRole("button", { name: "Model in use" });
  expect(model).toHaveTextContent("Auto · GPT-6.2 Astra · High");
  expect(model).toHaveAccessibleDescription(
    /Auto uses the customer's selection when available/,
  );
  fireEvent.click(model);
  expect(
    await screen.findByRole("searchbox", { name: "Search models" }),
  ).toBeInTheDocument();
});

function showStages(names: string[], archivedId?: string) {
  const stages = names.map((name, index) => ({
    id: String(index),
    name,
    instruction: "",
    actions: [],
    archived: String(index) === archivedId,
  }));
  const current = {
    ...funnel,
    definition: { initialStageId: stages[0].id, stages },
  };
  workspace.useFunnel.mockReturnValue({ data: current } as ReturnType<
    typeof workspace.useFunnel
  >);
  render(edit);
  return {
    current,
    stages,
    sidebar: within(screen.getByRole("complementary", { name: "Этапы" })),
  };
}

it("saves the stage condition and settings independently while preserving the neighbouring draft", async () => {
  const { current, stages, sidebar } = showStages(["Палитра", "Шрифт"]);
  const condition = "Клиент подтвердил палитру.";
  const name = "Весенняя коллекция";
  const next = {
    ...current,
    revision: 6,
    definition: {
      ...current.definition,
      stages: [{ ...stages[0], evidenceInstruction: condition }, stages[1]],
    },
  };
  execute.mockResolvedValueOnce({ kind: "save-funnel-stage", data: next });
  execute.mockResolvedValueOnce({
    kind: "save-funnel-settings",
    data: { ...next, name, revision: 7 },
  });
  expect(screen.queryByText("Переходы между этапами")).not.toBeInTheDocument();
  const title = screen.getByRole("textbox", { name: "Название воронки" });
  fireEvent.change(title, { target: { value: name } });
  fireEvent.click(sidebar.getByRole("button", { name: "Шрифт" }));
  const instruction = "Согласовать гарнитуру";
  fireEvent.change(screen.getByRole("textbox", { name: "Инструкция" }), {
    target: { value: instruction },
  });
  fireEvent.click(sidebar.getByRole("button", { name: "Палитра" }));
  fireEvent.change(
    screen.getByRole("textbox", {
      name: "Когда переходить к следующему этапу",
    }),
    { target: { value: condition } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));
  expect(await screen.findByText("Этап сохранён.")).toBeVisible();
  expect(execute).toHaveBeenNthCalledWith(1, {
    kind: "save-funnel-stage",
    funnel: {
      storeId: current.storeId,
      funnelId: current.id,
      expectedRevision: 5,
      stage: expect.objectContaining({
        id: "0",
        evidenceInstruction: condition,
      }),
    },
  });
  expect(title).toHaveValue(name);
  fireEvent.click(sidebar.getByRole("button", { name: "Шрифт" }));
  expect(screen.getByRole("textbox", { name: "Инструкция" })).toHaveValue(
    instruction,
  );
  fireEvent.click(screen.getByRole("button", { name: "Сохранить настройки" }));
  expect(await screen.findByText("Настройки воронки сохранены.")).toBeVisible();
  const [command] = execute.mock.calls[1];
  expect(command).toMatchObject({
    kind: "save-funnel-settings",
    funnel: {
      storeId: current.storeId,
      funnelId: current.id,
      expectedRevision: 6,
      name,
    },
  });
  expect(command).not.toHaveProperty("funnel.definition");
  expect(command).not.toHaveProperty("funnel.stage");
  expect(screen.getByRole("textbox", { name: "Инструкция" })).toHaveValue(
    instruction,
  );
});

it("persists keyboard and pointer moves immediately using the latest revision", async () => {
  const { current, stages, sidebar } = showStages([
    "Приём",
    "Макет",
    "Проверка",
  ]);
  execute.mockResolvedValueOnce({
    kind: "move-funnel-stage",
    data: {
      ...current,
      revision: 6,
      definition: {
        initialStageId: "1",
        stages: [stages[1], stages[0], stages[2]],
      },
    },
  });
  execute.mockResolvedValueOnce({
    kind: "move-funnel-stage",
    data: {
      ...current,
      revision: 7,
      definition: {
        initialStageId: "0",
        stages: [stages[0], stages[2], stages[1]],
      },
    },
  });
  const order = () =>
    sidebar.getAllByRole("listitem").map((row) => row.textContent);
  const handle = sidebar.getByRole("button", {
    name: "Изменить позицию этапа «Макет»",
  });
  handle.focus();
  fireEvent.keyDown(handle, { key: "ArrowUp" });
  expect(await screen.findByText("Порядок этапов сохранён.")).toBeVisible();
  expect(order()).toEqual(["Макет", "Приём", "Проверка"]);
  expect(execute).toHaveBeenNthCalledWith(1, {
    kind: "move-funnel-stage",
    funnel: {
      storeId: current.storeId,
      funnelId: current.id,
      expectedRevision: 5,
      stageId: "1",
      targetStageId: "0",
    },
  });
  fireEvent.keyDown(handle, { key: "ArrowUp" });
  expect(execute).toHaveBeenCalledTimes(1);
  const target = sidebar.getByRole("button", { name: "Проверка" });
  const original = Object.getOwnPropertyDescriptor(
    document,
    "elementFromPoint",
  );
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => target,
  });
  Object.defineProperty(handle, "setPointerCapture", {
    configurable: true,
    value: jest.fn(),
  });
  function pointer(type: string) {
    return Object.assign(new MouseEvent(type, { bubbles: true, button: 0 }), {
      pointerId: 2,
      isPrimary: true,
      pointerType: "touch",
    });
  }
  try {
    fireEvent(handle, pointer("pointerdown"));
    fireEvent(handle, pointer("pointerup"));
    await waitFor(() =>
      expect(order()).toEqual(["Приём", "Проверка", "Макет"]),
    );
    expect(execute).toHaveBeenNthCalledWith(2, {
      kind: "move-funnel-stage",
      funnel: {
        storeId: current.storeId,
        funnelId: current.id,
        expectedRevision: 6,
        stageId: "1",
        targetStageId: "2",
      },
    });
  } finally {
    if (original) Object.defineProperty(document, "elementFromPoint", original);
    else Reflect.deleteProperty(document, "elementFromPoint");
  }
});

it("confirms deletion of a saved stage and moves its open tasks to the chosen active stage", async () => {
  const { current, stages, sidebar } = showStages(
    ["Приём", "Сбор", "Проверка", "Старый этап"],
    "3",
  );
  execute.mockResolvedValue({
    kind: "delete-funnel-stage",
    data: {
      ...current,
      revision: 6,
      definition: { initialStageId: "1", stages: stages.slice(1) },
    },
  });
  const remove = screen.getByRole("button", { name: "Удалить этап" });
  fireEvent.click(remove);
  fireEvent.click(
    within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Отмена",
    }),
  );
  expect(execute).not.toHaveBeenCalled();
  expect(sidebar.getByRole("button", { name: "Приём" })).toBeVisible();
  fireEvent.click(remove);
  const dialog = within(screen.getByRole("alertdialog"));
  const destination = dialog.getByRole("combobox", {
    name: "Перевести открытые задачи на этап",
  });
  fireEvent.keyDown(destination, { key: "Enter" });
  expect(screen.queryByRole("option", { name: "Приём" })).toBeNull();
  expect(screen.queryByRole("option", { name: /Старый этап/ })).toBeNull();
  fireEvent.keyDown(await screen.findByRole("option", { name: "Проверка" }), {
    key: "Enter",
  });
  fireEvent.click(dialog.getByRole("button", { name: "Подтвердить удаление" }));
  expect(await screen.findByText("Этап удалён.")).toBeVisible();
  expect(execute).toHaveBeenCalledWith({
    kind: "delete-funnel-stage",
    funnel: {
      storeId: current.storeId,
      funnelId: current.id,
      expectedRevision: 5,
      stageId: "0",
      targetStageId: "2",
    },
  });
  expect(sidebar.queryByRole("button", { name: "Приём" })).toBeNull();
  expect(sidebar.getByRole("button", { name: "Проверка" })).toBeVisible();
});

it("retries a rejected deletion in its dialog without hiding the stage or changing the destination", async () => {
  const { current, stages, sidebar } = showStages([
    "Приём",
    "Сбор",
    "Проверка",
  ]);
  execute.mockRejectedValueOnce(new Error("Изменения не сохранены."));
  execute.mockResolvedValueOnce({
    kind: "delete-funnel-stage",
    data: {
      ...current,
      revision: 6,
      definition: { initialStageId: "1", stages: stages.slice(1) },
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Удалить этап" }));
  const dialog = within(screen.getByRole("alertdialog"));
  const destination = dialog.getByRole("combobox", {
    name: "Перевести открытые задачи на этап",
  });
  fireEvent.keyDown(destination, { key: "Enter" });
  fireEvent.keyDown(await screen.findByRole("option", { name: "Проверка" }), {
    key: "Enter",
  });
  const confirm = dialog.getByRole("button", { name: "Подтвердить удаление" });
  fireEvent.click(confirm);
  expect(await dialog.findByRole("alert")).toHaveTextContent(
    "Изменения не сохранены.",
  );
  expect(destination).toHaveTextContent("Проверка");
  expect(sidebar.getAllByRole("listitem", { hidden: true })).toHaveLength(3);
  fireEvent.click(confirm);
  expect(await screen.findByText("Этап удалён.")).toBeVisible();
  expect(execute.mock.calls[1][0]).toEqual(execute.mock.calls[0][0]);
  expect(sidebar.getAllByRole("listitem")).toHaveLength(2);
});

it("appends a new stage through its own save and treats the returned stage as persisted", async () => {
  const employeeId = "630c718b-f4e6-4dfa-b733-3d06287fc262";
  const options = workspace.useOptions("owner", funnel.storeId);
  workspace.useOptions.mockReturnValue({
    ...options,
    data: {
      ...options.data!,
      participants: [{ id: employeeId, name: "Владелец", kind: "human" }],
    },
  });
  const { current, stages, sidebar } = showStages(["Приём"]);
  execute.mockImplementationOnce(async (command) => {
    if (command.kind !== "save-funnel-stage")
      throw new Error("Expected a stage save");
    return {
      kind: command.kind,
      data: {
        ...current,
        revision: 6,
        definition: {
          ...current.definition,
          stages: [...stages, stageSchema.parse(command.funnel.stage)],
        },
      },
    };
  });
  fireEvent.click(sidebar.getByRole("button", { name: "Добавить этап" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Название этапа" }), {
    target: { value: "Проверка" },
  });
  await selectStageEmployee("Владелец");
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));
  expect(await screen.findByText("Этап сохранён.")).toBeVisible();
  expect(execute).toHaveBeenCalledWith({
    kind: "save-funnel-stage",
    funnel: {
      storeId: current.storeId,
      funnelId: current.id,
      expectedRevision: 5,
      stage: expect.objectContaining({
        id: expect.any(String),
        name: "Проверка",
        defaultAssigneeSubjectId: employeeId,
      }),
    },
  });
  expect(
    sidebar.getAllByRole("listitem").map((row) => row.textContent),
  ).toEqual(["Приём", "Проверка"]);
  fireEvent.click(screen.getByRole("button", { name: "Удалить этап" }));
  expect(screen.getByRole("alertdialog")).toHaveAccessibleName(
    "Удалить этап «Проверка»?",
  );
  expect(execute).toHaveBeenCalledTimes(1);
});

it("confirms before discarding a draft and protects the only remaining active stage", () => {
  const { sidebar } = showStages(["Приём"]);
  expect(screen.getByRole("button", { name: "Удалить этап" })).toBeDisabled();
  fireEvent.click(sidebar.getByRole("button", { name: "Добавить этап" }));
  expect(sidebar.getByRole("button", { name: "Новый этап" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Удалить этап" }));
  const dialog = within(screen.getByRole("alertdialog"));
  expect(dialog.queryByRole("combobox")).toBeNull();
  fireEvent.click(dialog.getByRole("button", { name: "Отмена" }));
  expect(sidebar.getByRole("button", { name: "Новый этап" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Удалить этап" }));
  fireEvent.click(
    within(screen.getByRole("alertdialog")).getByRole("button", {
      name: "Подтвердить удаление",
    }),
  );
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(sidebar.queryByRole("button", { name: "Новый этап" })).toBeNull();
  expect(screen.getByRole("button", { name: "Удалить этап" })).toBeDisabled();
  expect(execute).not.toHaveBeenCalled();
});

it("uses customer funding for a later AI handoff on a human stage with an inherited store budget", async () => {
  const currencyId = "9088eecb-4acd-404f-ae35-9e10dc304c0a";
  const current: ICrmWorkspaceFunnel = {
    ...funnel,
    definition: {
      ...funnel.definition,
      stages: [
        { ...funnel.definition.stages[0], operations: ["knowledge-search"] },
      ],
      workFunding: {
        payer: "store-owner",
        currencyId,
        maxTaskAmount: "30",
        maxRunAmount: "16",
      },
    },
  };
  const options = workspace.useOptions("owner", funnel.storeId);
  workspace.useOptions.mockReturnValue({
    ...options,
    data: {
      ...options.data!,
      currencies: [{ id: currencyId, slug: "token", title: "Token", units: 4 }],
    },
  });
  workspace.useFunnel.mockReturnValue({ data: current } as ReturnType<
    typeof workspace.useFunnel
  >);
  execute.mockResolvedValue({ kind: "save-funnel-stage", data: current });
  render(edit);
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));
  expect(await screen.findByText("Этап сохранён.")).toBeInTheDocument();
  const [command] = execute.mock.calls[0];
  expect(
    command.kind === "save-funnel-stage" && command.funnel.stage.workFunding,
  ).toEqual({ payer: "customer", multiplier: "0", currencyId });
  expect(
    command.kind === "save-funnel-stage" && command.funnel.stage.operations,
  ).toBeUndefined();
});

it("saves an AI payment contact and its tariff while reserving payment confirmation for the payment service", async () => {
  const current = workspace.useOptions.getMockImplementation()?.(
    "owner",
    funnel.storeId,
  );
  const token = "9088eecb-4acd-404f-ae35-9e10dc304c0a";
  workspace.useOptions.mockReturnValue({
    ...current,
    data: {
      ...current?.data,
      participants: [{ id: "agent", name: "Лида", kind: "ai" }],
      currencies: [{ id: token, slug: "token", title: "Token" }],
    },
  } as ReturnType<typeof workspace.useOptions>);
  const paymentFunnel = {
    ...funnel,
    kind: "individual-service",
    definition: {
      ...funnel.definition,
      stages: [
        {
          ...funnel.definition.stages[0],
          behavior: "ecommerce-module-order-payment",
        },
      ],
    },
  };
  workspace.useFunnel.mockReturnValue({
    data: paymentFunnel,
  } as unknown as ReturnType<typeof workspace.useFunnel>);
  execute.mockResolvedValue({ kind: "save-funnel-stage", data: funnel });
  render(edit);
  await selectStageEmployee("Лида");
  expect(
    screen.getByText(/Платёжный сервис проверяет сумму и подтверждает оплату/),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Используемая модель" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Сохранить этап" }));
  expect(await screen.findByText("Этап сохранён.")).toBeVisible();
  expect(execute).toHaveBeenCalledWith(
    expect.objectContaining({
      funnel: expect.objectContaining({
        stage: expect.objectContaining({
          behavior: "ecommerce-module-order-payment",
          defaultAssigneeSubjectId: "agent",
          workFunding: expect.objectContaining({
            currencyId: token,
            payer: "customer",
          }),
          actions: [
            expect.objectContaining({
              actors: ["system"],
              evidence: ["payment"],
            }),
          ],
        }),
      }),
    }),
  );
});
