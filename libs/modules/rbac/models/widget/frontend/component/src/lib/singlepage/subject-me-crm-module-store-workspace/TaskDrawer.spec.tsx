/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type {
  ICrmWorkspaceOptions,
  ICrmWorkspaceTaskDetail,
} from "@sps/rbac/models/subject/sdk/model";
import { TaskDrawer } from "./TaskDrawer";

const employee = { id: "employee-1", name: "Алиса", profileId: "profile-1" };
const options: ICrmWorkspaceOptions = {
  participants: [
    { id: employee.id, name: employee.name, kind: "ai" },
    { id: "manager-1", name: "Мария", kind: "human" },
  ],
  employees: [employee],
  canManageEmployees: true,
  payers: [],
  currencies: [],
  skillsByAssignee: {},
};
const createdAt = "2026-11-20T10:00:00.000Z";
const detail: ICrmWorkspaceTaskDetail = {
  task: {
    id: "task-1",
    storeId: "store-1",
    funnelId: "funnel-1",
    publicationId: "publication-1",
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
  publication: {
    id: "publication-1",
    createdAt,
    funnelId: "funnel-1",
    version: 2,
    draftRevision: 5,
    name: "Обложки",
    kind: "individual-service",
    actorId: "owner-1",
    operationKey: "publish-1",
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

function openDrawer(test = false) {
  const onAssign = jest.fn().mockResolvedValue(undefined);
  render(
    <TaskDrawer
      taskId={detail.task.id}
      detail={{ ...detail, task: { ...detail.task, test } }}
      href="/ru/ecommerce/stores/shop/crm/tasks/task-1"
      language="ru"
      options={options}
      onClose={jest.fn()}
      onRestoreFocus={jest.fn()}
      onNextHistory={jest.fn()}
      onAssign={onAssign}
      onFulfill={jest.fn()}
    />,
  );
  return onAssign;
}

async function openAssigneeList() {
  fireEvent.keyDown(
    screen.getByRole("combobox", { name: "Исполнитель задачи" }),
    { key: "Enter" },
  );
  return within(await screen.findByRole("listbox"));
}

it("assigns an AI employee to an unassigned task and preserves the operation key on retry", async () => {
  const onAssign = openDrawer().mockRejectedValueOnce(
    new Error("Не удалось назначить исполнителя"),
  );
  expect(screen.getByText("Без исполнителя")).toBeInTheDocument();
  const submit = screen.getByRole("button", { name: "Назначить" });
  expect(submit).toBeDisabled();

  const list = await openAssigneeList();
  expect(
    list.getByRole("group", { name: "Другие исполнители" }),
  ).toBeInTheDocument();
  const ai = list.getByRole("group", { name: "ИИ-сотрудники" });
  fireEvent.keyDown(within(ai).getByRole("option", { name: employee.name }), {
    key: "Enter",
  });
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

it("offers only AI employees as assignees for a test task", async () => {
  openDrawer(true);
  const list = await openAssigneeList();
  expect(
    list.getByRole("group", { name: "ИИ-сотрудники" }),
  ).toBeInTheDocument();
  expect(list.getAllByRole("option")).toHaveLength(1);
  expect(list.getByRole("option", { name: employee.name })).toBeInTheDocument();
  expect(list.queryByRole("option", { name: "Мария" })).not.toBeInTheDocument();
  expect(
    list.queryByRole("group", { name: "Другие исполнители" }),
  ).not.toBeInTheDocument();
});
