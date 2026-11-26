/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ICrmWorkspaceTaskDetail } from "@sps/rbac/models/subject/sdk/model";
import type { ComponentProps, ReactNode } from "react";
import type { IStoreSession } from "../../../ecommerce-module/store/StoreSection";
import { ClientComponent } from "./ClientComponent";
import { TaskOverview } from "./TaskOverview";

const mockUseDetail = jest.fn();
const mockCommand = jest.fn();

jest.mock("@sps/social/models/profile/frontend/component", () => ({
  Component: () => null,
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: ({ variant }: { variant: string }) => (
    <section aria-label="Переписка" data-variant={variant} />
  ),
}));
jest.mock("@sps/rbac/models/subject/sdk/client", () => ({
  api: {
    crmWorkspace: {
      useDetail: (input: unknown) => mockUseDetail(input),
      useCommand: () => ({ mutateAsync: mockCommand }),
    },
  },
}));
jest.mock("../../../ecommerce-module/store/StoreSection", () => ({
  StoreSection: ({
    children,
  }: {
    children: (session: IStoreSession) => ReactNode;
  }) =>
    children({
      access: {
        subjectId: "manager-1",
        store: {
          id: "store-1",
          slug: "shop",
          title: "Лавка",
          canReadCosts: true,
          canManageEmployees: true,
          canManageTasks: true,
        },
      },
    }),
}));

const employee = { id: "employee-1", name: "Алиса", profileId: "profile-1" };
const participants = [
  { id: employee.id, name: employee.name, kind: "ai" as const },
  { id: "manager-1", name: "Мария", kind: "human" as const },
];
const createdAt = "2026-11-20T10:00:00.000Z";
const detail: ICrmWorkspaceTaskDetail = {
  canManageTasks: true,
  assignmentCandidates: participants,
  task: {
    id: "task-1",
    storeId: "store-1",
    funnelId: "funnel-1",
    customerId: "customer-1",
    productId: null,
    offerId: null,
    orderId: null,
    stageId: "intake",
    status: "active",
    expectedEvent: null,
    outcome: null,
    revision: 7,
    assigneeId: null,
    assigneeKind: null,
    assignmentRevision: 0,
    assignmentExpiresAt: null,
    waitingRevision: null,
    waitingSince: null,
    deadlineAt: null,
    nextActionAt: null,
    timer: null,
    openingKey: "open-task-1",
    openingDigest: "task-digest",
    label: "Обложка товара",
    customerName: "Анна",
    createdAt,
    updatedAt: createdAt,
  },
  funnel: {
    id: "funnel-1",
    slug: "covers",
    createdAt,
    updatedAt: createdAt,
    storeId: "store-1",
    revision: 5,
    name: "Обложки",
    kind: "individual-service",
    definition: {
      initialStageId: "intake",
      stages: [
        { id: "intake", name: "Подготовка", instruction: "", actions: [] },
      ],
    },
    bindings: { productIds: [], offerIds: [], formIds: [] },
  },
  history: { items: [], nextCursor: null },
};

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function openTask(data = detail) {
  const onAssign = jest.fn().mockResolvedValue(undefined);
  render(
    <TaskOverview
      detail={data}
      storeSlug="shop"
      thread={<p>Переписка задачи</p>}
      language="ru"
      onAssign={onAssign}
      onFulfill={jest.fn()}
    />,
  );
  return onAssign;
}

it.each([
  [undefined, "Модель по умолчанию", "GPT-6.2 Astra"],
  ["gpt-4.1-mini", "Модель этапа", "gpt-4.1-mini"],
] as const)(
  "shows the model for an agent's current stage in the manager view",
  (modelId, label, name) => {
    openTask({
      ...detail,
      task: { ...detail.task, assigneeId: employee.id, assigneeKind: "ai" },
      funnel: {
        ...detail.funnel,
        definition: {
          ...detail.funnel.definition,
          workFunding: {
            payer: "store-owner",
            currencyId: "currency",
            maxRunAmount: "2",
            maxTaskAmount: "10",
          },
          stages: detail.funnel.definition.stages.map((stage) => ({
            ...stage,
            provider: modelId ? { modelId } : undefined,
          })),
        },
      },
    });
    expect(screen.getByText(label)).toBeVisible();
    expect(screen.getByText(name)).toBeVisible();
  },
);

it("assigns an AI employee to an unassigned task and preserves the operation key on retry", async () => {
  const onAssign = openTask().mockRejectedValueOnce(
    new Error("Не удалось назначить исполнителя"),
  );
  expect(screen.getByText("Анна")).toBeInTheDocument();
  expect(screen.getByText("Подготовка")).toBeInTheDocument();
  expect(screen.getByText("Без исполнителя")).toBeInTheDocument();
  const submit = screen.getByRole("button", { name: "Назначить" });
  expect(submit).toBeDisabled();

  const group = within(
    screen.getByRole("radiogroup", { name: "Исполнитель задачи" }),
  );
  const radio = group.getByRole("radio", { name: employee.name });
  await userEvent.tab();
  await userEvent.click(radio);
  expect(radio).toBeChecked();
  expect(onAssign).not.toHaveBeenCalled();
  expect(submit).toBeEnabled();
  fireEvent.click(submit);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Не удалось назначить исполнителя",
  );
  expect(onAssign).toHaveBeenCalledTimes(1);
  const [assignment] = onAssign.mock.calls[0];
  expect(assignment).toEqual({
    storeId: "store-1",
    taskId: "task-1",
    expectedRevision: 7,
    assigneeId: employee.id,
    operationKey: expect.any(String),
  });
  expect(submit).toBeEnabled();
  fireEvent.click(submit);

  await waitFor(() => expect(submit).toBeDisabled());
  expect(onAssign).toHaveBeenCalledTimes(2);
  expect(onAssign).toHaveBeenNthCalledWith(2, assignment);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps the conversation visible when task management actions are unavailable", () => {
  openTask({ ...detail, canManageTasks: false });
  expect(screen.getByText("Переписка задачи")).toBeInTheDocument();
  expect(
    screen.queryByRole("radiogroup", { name: "Исполнитель задачи" }),
  ).not.toBeInTheDocument();
});

it("disables the selection and submit controls while an assignment is pending", async () => {
  let finish!: () => void;
  const onAssign = openTask().mockReturnValueOnce(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const target = screen.getByRole("radio", { name: employee.name });
  fireEvent.click(target);
  fireEvent.click(screen.getByRole("button", { name: "Назначить" }));
  expect(target).toBeDisabled();
  expect(screen.getByRole("button", { name: "Назначаем…" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Назначаем…" }));
  expect(onAssign).toHaveBeenCalledTimes(1);
  finish();
  await waitFor(() => expect(target).not.toBeDisabled());
});

it("shows a pending manager request in the CRM assignment section", () => {
  openTask({ ...detail, awaitingManager: true });
  const assignment = within(
    screen.getByRole("region", { name: "Исполнитель задачи" }),
  );
  expect(assignment.getByText("Ожидает менеджера")).toBeVisible();
});

const funnel: ICrmWorkspaceTaskDetail["funnel"] = {
  ...detail.funnel,
  definition: {
    ...detail.funnel.definition,
    stages: [
      ...detail.funnel.definition.stages,
      { id: "revision", name: "Правки", instruction: "", actions: [] },
      { id: "delivery", name: "Выдача", instruction: "", actions: [] },
      {
        id: "archived",
        name: "Старый этап",
        instruction: "",
        actions: [],
        archived: true,
      },
    ],
  },
};

it("shows recorded stage visits, keeps skipped branches unvisited and names a stage on hover, focus or tap", () => {
  openTask({ ...detail, funnel, visitedStageIds: ["intake", "delivery"] });
  const stages = within(screen.getByRole("list", { name: "Этапы воронки" }));
  const intake = stages.getByRole("button", {
    name: "Подготовка · Текущий этап",
  });
  const revision = stages.getByRole("button", {
    name: "Правки · Задача не была на этапе",
  });
  const delivery = stages.getByRole("button", {
    name: "Выдача · Задача была на этапе",
  });
  expect(intake).toHaveAttribute("aria-current", "step");
  expect(delivery).not.toHaveAttribute("aria-current");
  expect(stages.getAllByRole("button")).toHaveLength(3);
  expect(screen.getByText("Этап 1 из 3 ·")).toBeInTheDocument();

  fireEvent.mouseEnter(revision);
  expect(screen.getByText("Правки")).toBeVisible();
  expect(screen.getByText("Этап 2 из 3 ·")).toBeVisible();
  fireEvent.mouseLeave(revision);
  expect(screen.getByText("Подготовка")).toBeVisible();

  fireEvent.focus(delivery);
  expect(screen.getByText("Выдача")).toBeVisible();
  fireEvent.blur(delivery);
  expect(screen.getByText("Подготовка")).toBeVisible();

  fireEvent.click(delivery);
  expect(screen.getByText("Этап 3 из 3 ·")).toBeVisible();
  expect(screen.getByText("Выдача")).toBeVisible();
});

it("renders the persisted current, completed and required stages independently of the history page", () => {
  openTask({
    ...detail,
    funnel,
    stageStates: {
      intake: "completed",
      revision: "current",
      delivery: "required",
    },
    task: { ...detail.task, stageId: "revision" },
  });
  const stages = within(screen.getByRole("list", { name: "Этапы воронки" }));
  expect(
    stages.getByRole("button", { name: "Подготовка · Этап пройден" }),
  ).toBeVisible();
  expect(
    stages.getByRole("button", { name: "Правки · Текущий этап" }),
  ).toHaveAttribute("aria-current", "step");
  expect(
    stages.getByRole("button", { name: "Выдача · Ожидает выполнения" }),
  ).toBeVisible();
});

it("uses recorded transitions when the detail response has only the history page", () => {
  openTask({
    ...detail,
    funnel,
    history: {
      nextCursor: "5",
      items: [
        {
          id: "return-event",
          taskId: detail.task.id,
          kind: "transitioned",
          createdAt,
          revision: detail.task.revision,
          assignmentRevision: 0,
          actorId: null,
          actorKind: "system",
          causeId: null,
          operationKey: "return-to-intake",
          operationDigest: "digest",
          detail: { previousStageId: "delivery", stageId: "intake" },
        },
      ],
    },
  });
  const stages = within(screen.getByRole("list", { name: "Этапы воронки" }));
  expect(
    stages.getByRole("button", { name: "Выдача · Задача была на этапе" }),
  ).toBeVisible();
  expect(
    stages.getByRole("button", { name: "Правки · Задача не была на этапе" }),
  ).toBeVisible();
});

it.each([
  ["completed", "Завершена на этом этапе"],
  ["closed-without-result", "Закрыта на этом этапе"],
] as const)("stops a %s task at its actual last stage", (outcome, label) => {
  openTask({
    ...detail,
    funnel,
    visitedStageIds: ["intake", "revision"],
    task: { ...detail.task, stageId: "revision", status: "closed", outcome },
  });
  const stages = within(screen.getByRole("list", { name: "Этапы воронки" }));
  expect(
    stages.getByRole("button", { name: `Правки · ${label}` }),
  ).toHaveAttribute("aria-current", "step");
  expect(
    stages.getByRole("button", { name: "Выдача · Задача не была на этапе" }),
  ).not.toHaveAttribute("aria-current");
  expect(screen.getByText(label)).toBeVisible();
});

it("places assignment controls with the assignee and presents the order state without the event or expense lists", () => {
  openTask({
    ...detail,
    task: {
      ...detail.task,
      assigneeId: employee.id,
      assigneeName: employee.name,
      assigneeKind: "ai",
    },
    order: { id: "order-1", status: "canceled", paymentStatus: "paid" },
    costs: [
      {
        id: "transfer-1",
        title: "Перевод клиенту",
        amount: "25",
        status: "Posted",
      },
    ],
  });
  const assignee = within(
    screen.getByRole("region", { name: "Исполнитель задачи" }),
  );
  expect(
    assignee.getByRole("link", { name: `Профиль · ${employee.name}` }),
  ).toHaveAttribute(
    "href",
    `/ru/ecommerce/stores/shop/employees/${employee.id}`,
  );
  expect(assignee.getByRole("radio", { name: employee.name })).toBeChecked();
  expect(assignee.getAllByRole("button", { name: "Назначить" })).toHaveLength(
    1,
  );
  const order = within(document.getElementById("crm-order-order-1")!);
  expect(order.getByText("Отменён")).toBeVisible();
  expect(order.queryByText("Оплачен")).not.toBeInTheDocument();
  expect(screen.queryByText("История и назначения")).not.toBeInTheDocument();
  expect(screen.queryByText("Перевод клиенту")).not.toBeInTheDocument();
});

it.each([
  ["delivered", "Доставлен"],
  ["completed", "Завершён"],
])("shows the shared %s status after delivery", (status, label) => {
  openTask({
    ...detail,
    order: {
      id: "order-1",
      status,
      paymentStatus: "paid",
      originalDelivered: true,
      fulfillment: { state: "delivered", canFulfill: false },
    },
  });
  const order = within(document.getElementById("crm-order-order-1")!);
  expect(order.getByText(label)).toBeVisible();
  expect(order.queryByText("Оригинал выдан")).not.toBeInTheDocument();
});

it("uses the shared status label when a delivered order has no payment or original-delivery evidence", () => {
  openTask({
    ...detail,
    order: { id: "order-1", status: "delivered", paymentStatus: null },
  });
  const order = within(document.getElementById("crm-order-order-1")!);
  expect(order.getByText("Доставлен")).toBeVisible();
  expect(order.queryByText("Оплачен")).not.toBeInTheDocument();
  expect(order.queryByText("Оригинал выдан")).not.toBeInTheDocument();
});

it("assigns only on submit and selects the current participant after the task is updated", async () => {
  const active = {
    ...detail,
    task: {
      ...detail.task,
      assigneeId: employee.id,
      assigneeName: employee.name,
      assigneeKind: "ai" as const,
    },
    thread: {
      id: "thread-1",
      chatId: "chat-1",
      actorProfileId: "actor-profile",
      canSend: false,
      title: "Обсуждение",
    },
  };
  mockCommand.mockClear().mockResolvedValue(undefined);
  mockUseDetail.mockReturnValue({ data: active });
  const store = { id: "store-1", slug: "shop" } as ComponentProps<
    typeof ClientComponent
  >["ecommerceModuleStore"];
  const view = () => (
    <ClientComponent
      widgetId="store-widget"
      crmModuleTaskId={detail.task.id}
      ecommerceModuleStore={store}
      language="ru"
    />
  );
  const { rerender } = render(view());
  const assignee = () =>
    within(screen.getByRole("region", { name: "Исполнитель задачи" }));
  const viewRadios = () => assignee().getAllByRole("radio", { hidden: true });
  const chat = within(screen.getByRole("region", { name: "Переписка" }));
  expect(screen.getByRole("region", { name: "Переписка" })).toHaveAttribute(
    "data-variant",
    "me-social-module-profile-chat-overview-default",
  );
  expect(screen.getByRole("link", { name: "Анна" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/shop/customers/customer-1",
  );
  expect(
    document.getElementById(`crm-task-${detail.task.id}`),
  ).toContainElement(
    screen.getByRole("heading", { name: detail.task.label, level: 1 }),
  );
  expect(chat.queryByRole("link", { name: /Заказ/ })).toBeNull();
  expect(chat.queryByRole("radiogroup")).toBeNull();
  expect(assignee().queryByRole("combobox")).toBeNull();
  expect(assignee().queryByText("Взять в работу")).toBeNull();
  expect(assignee().queryByText("Вернуть исполнителю этапа")).toBeNull();
  expect(assignee().getByRole("radio", { name: "Алиса" })).toBeChecked();
  expect(viewRadios()).toHaveLength(2);
  expect(viewRadios()[0]).toHaveAccessibleName("Алиса");
  expect(assignee().getByRole("button", { name: "Назначить" })).toBeDisabled();

  const user = userEvent.setup();
  await user.click(assignee().getByRole("radio", { name: "Алиса" }));
  await user.keyboard("{ArrowDown>}");
  await waitFor(() =>
    expect(assignee().getByRole("radio", { name: "Мария" })).toBeChecked(),
  );
  await user.keyboard("{/ArrowDown}");
  expect(viewRadios()[0]).toHaveAccessibleName("Алиса");
  expect(mockCommand).not.toHaveBeenCalled();
  await user.click(assignee().getByRole("button", { name: "Назначить" }));
  expect(mockCommand).toHaveBeenCalledTimes(1);
  expect(mockCommand).toHaveBeenCalledWith({
    kind: "assign",
    assignment: {
      assigneeId: "manager-1",
      storeId: "store-1",
      taskId: detail.task.id,
      expectedRevision: 7,
      operationKey: expect.any(String),
    },
  });

  mockUseDetail.mockReturnValue({
    data: {
      ...active,
      order: { id: "order-1", status: "new", paymentStatus: null },
      task: {
        ...active.task,
        assigneeId: "manager-1",
        assigneeName: "Мария",
        assigneeKind: "human",
        revision: 8,
        assignmentRevision: 1,
      },
      thread: { ...active.thread, canSend: true },
    },
  });
  rerender(view());
  expect(screen.getByRole("link", { name: "order-1" })).toHaveAttribute(
    "href",
    "/ru/ecommerce/stores/shop/orders/order-1",
  );
  expect(chat.queryByRole("link", { name: "order-1" })).toBeNull();
  expect(assignee().getByRole("radio", { name: "Мария" })).toBeChecked();
  expect(viewRadios()).toHaveLength(2);
  expect(viewRadios()[0]).toHaveAccessibleName("Мария");
  expect(assignee().getByRole("button", { name: "Назначить" })).toBeDisabled();
  await user.click(assignee().getByRole("radio", { name: "Алиса" }));
  expect(mockCommand).toHaveBeenCalledTimes(1);
  await user.click(assignee().getByRole("button", { name: "Назначить" }));
  expect(mockCommand).toHaveBeenLastCalledWith({
    kind: "assign",
    assignment: {
      assigneeId: employee.id,
      storeId: "store-1",
      taskId: detail.task.id,
      expectedRevision: 8,
      operationKey: expect.any(String),
    },
  });
});

it("does not offer a former assignee or unrelated staff as candidates", () => {
  const onAssign = openTask({
    ...detail,
    assignmentCandidates: [],
    task: {
      ...detail.task,
      assigneeId: "former-employee",
      assigneeName: "Бывший сотрудник",
      assigneeKind: "human",
    },
    thread: {
      id: "thread-1",
      chatId: "chat-1",
      actorProfileId: "actor-profile",
      canSend: false,
      title: "Обсуждение",
    },
  });
  const section = within(
    screen.getByRole("region", { name: "Исполнитель задачи" }),
  );
  expect(section.getByRole("link", { name: "Бывший сотрудник" })).toBeVisible();
  expect(
    section.getByText(
      "В этой переписке нет доступных исполнителей со стороны магазина.",
    ),
  ).toBeVisible();
  expect(section.queryByRole("radiogroup")).toBeNull();
  expect(section.queryByRole("button", { name: "Назначить" })).toBeNull();
  expect(onAssign).not.toHaveBeenCalled();
});

it("keeps the same participant rows and profile links when a task closes", () => {
  const onAssign = openTask({
    ...detail,
    task: {
      ...detail.task,
      assigneeId: employee.id,
      assigneeName: employee.name,
      assigneeKind: "ai",
      status: "closed",
    },
  });
  const section = within(
    screen.getByRole("region", { name: "Исполнитель задачи" }),
  );
  for (const person of participants) {
    const radio = section.getByRole("radio", { name: person.name });
    expect(radio).toBeDisabled();
    expect(radio).toHaveAttribute(
      "aria-checked",
      String(person.id === employee.id),
    );
    expect(
      section.getByRole("link", { name: `Профиль · ${person.name}` }),
    ).toBeVisible();
    fireEvent.click(radio);
  }
  expect(section.queryByRole("button", { name: "Назначить" })).toBeNull();
  expect(onAssign).not.toHaveBeenCalled();
});
