/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type {
  ICrmWorkspaceFunnel,
  ICrmWorkspaceOptions,
} from "@sps/rbac/models/subject/sdk/model";
import { Workspace } from "./Workspace";

jest.mock("server-only", () => ({}));

const replace = jest.fn();
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

jest.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    crmWorkspace: {
      useStores: jest.fn(),
      useOptions: jest.fn(),
      useFunnels: jest.fn(),
      useTasks: jest.fn(),
      useDetail: jest.fn(),
      useCommand: jest.fn(),
    },
  },
}));

const workspace = jest.mocked(api.crmWorkspace);
const date = "2026-11-20T10:00:00.000Z";
const funnel: ICrmWorkspaceFunnel = {
  id: "funnel-1",
  createdAt: date,
  updatedAt: date,
  storeId: "store-1",
  revision: 5,
  name: "Обложки",
  slug: "covers",
  kind: "consultation",
  definition: {
    initialStageId: "intake",
    stages: [
      { id: "intake", name: "Подготовка", instruction: "", actions: [] },
    ],
  },
  bindings: { productIds: [], offerIds: [], formIds: [] },
};
const options: ICrmWorkspaceOptions = {
  participants: [],
  employees: [],
  canManageEmployees: true,
  payers: [],
  currencies: [],
  skillsByAssignee: {},
};
type Execute = ReturnType<typeof workspace.useCommand>["mutateAsync"];
const execute = jest.fn<ReturnType<Execute>, Parameters<Execute>>();

beforeEach(() => {
  workspace.useStores.mockClear();
  execute.mockReset();
  replace.mockClear();
  workspace.useStores.mockReturnValue({
    data: [{ id: funnel.storeId, slug: "shop", title: "Магазин" }],
    isSuccess: true,
  } as ReturnType<typeof workspace.useStores>);
  workspace.useOptions.mockReturnValue({
    data: options,
  } as ReturnType<typeof workspace.useOptions>);
  workspace.useFunnels.mockReturnValue({
    data: { items: [funnel] },
  } as ReturnType<typeof workspace.useFunnels>);
  workspace.useTasks.mockReturnValue({
    data: {
      items: [
        {
          id: "current",
          funnelId: funnel.id,
          stageId: "intake",
          status: "active",
          label: "Текущая задача",
          updatedAt: date,
        },
        {
          id: "historical",
          funnelId: funnel.id,
          stageId: "removed",
          status: "closed",
          label: "Ранняя задача",
          updatedAt: date,
        },
      ],
    },
  } as ReturnType<typeof workspace.useTasks>);
  workspace.useDetail.mockReturnValue(
    {} as ReturnType<typeof workspace.useDetail>,
  );
  workspace.useCommand.mockReturnValue({
    mutateAsync: execute,
  } as unknown as ReturnType<typeof workspace.useCommand>);
  window.history.replaceState({}, "", "/ru/ecommerce/stores/shop/crm");
});

it("shows current and historical tasks on the same board when opening a legacy link", () => {
  window.history.replaceState(
    {},
    "",
    "?version=old-publication&view=kanban#store-workspace",
  );
  render(
    <Workspace
      widgetId="workspace-widget"
      subjectId="owner-1"
      storeSlug="shop"
      language="ru"
    />,
  );

  const [query, enabled] = workspace.useTasks.mock.lastCall!;
  expect(enabled).toBe(true);
  expect(query.params).toMatchObject({
    storeId: funnel.storeId,
    funnelId: funnel.id,
  });
  expect(query.params).not.toHaveProperty("publicationId");
  expect(window.location.search).toBe("?view=kanban");
  expect(window.location.hash).toBe("#store-workspace");
  expect(screen.queryByText("Версия")).not.toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Подготовка" })).getByText(
      "Текущая задача",
    ),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("region", { name: "Этап недоступен" })).getByText(
      "Ранняя задача",
    ),
  ).toBeInTheDocument();
});

it("links to the list, create route and selected funnel without mounting an editor", () => {
  render(
    <Workspace
      widgetId="workspace-widget"
      subjectId="owner-1"
      storeSlug="shop"
      language="ru"
    />,
  );

  const funnelsPath = "/ru/ecommerce/stores/shop/crm/funnels";
  const sections = within(
    screen.getByRole("navigation", { name: "Разделы магазина" }),
  );
  expect(sections.getByRole("link", { name: "Обзор" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/shop",
  );
  expect(sections.getByRole("link", { current: "page" })).toHaveTextContent(
    "Задачи",
  );
  expect(sections.getByRole("link", { name: "Товары" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/shop/products",
  );
  expect(screen.getByRole("link", { name: "Воронки" })).toHaveAttribute(
    "href",
    funnelsPath,
  );
  expect(screen.queryByRole("link", { name: "Новая воронка" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Редактор воронки" })).toBeNull();
  expect(
    screen.queryByRole("textbox", { name: "Название воронки" }),
  ).toBeNull();
});

it("requests only the store in the current board URL", () => {
  workspace.useStores.mockImplementation(
    (id, slug) =>
      ({
        data:
          slug === "shop"
            ? [{ id: funnel.storeId, slug: "shop", title: "Магазин" }]
            : [
                {
                  id: "store-2",
                  slug: "another-shop",
                  title: "Другой магазин",
                },
              ],
        isSuccess: Boolean(id),
      }) as ReturnType<typeof workspace.useStores>,
  );

  render(
    <Workspace
      widgetId="workspace-widget"
      subjectId="owner-1"
      storeSlug="shop"
      language="ru"
    />,
  );

  expect(workspace.useStores).toHaveBeenCalledWith("owner-1", "shop");
  expect(workspace.useStores).not.toHaveBeenCalledWith("owner-1");
  expect(
    screen.queryByRole("combobox", { name: "Магазин" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Текущая задача" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/shop/crm/tasks/current",
  );
  expect(screen.getByRole("link", { name: "Новая задача" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/shop/crm/tasks/new",
  );
  expect(screen.queryByRole("link", { name: "Редактор воронки" })).toBeNull();
});

it("redirects old editor links to the store-scoped funnel", () => {
  window.history.replaceState(
    {},
    "",
    "?edit=1&funnel=funnel-1&testTask=test-task#store-workspace",
  );
  render(
    <Workspace
      widgetId="workspace-widget"
      subjectId="owner-1"
      storeSlug="shop"
      language="ru"
    />,
  );

  expect(replace).toHaveBeenCalledWith(
    "/ru/ecommerce/stores/shop/crm/funnels/covers",
  );
  expect(workspace.useStores).toHaveBeenCalledWith("owner-1", "shop");
  expect(
    screen.queryByRole("textbox", { name: "Название воронки" }),
  ).toBeNull();
});
