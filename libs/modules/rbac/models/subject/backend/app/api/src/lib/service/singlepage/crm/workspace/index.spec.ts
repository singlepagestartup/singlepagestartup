import { randomUUID } from "node:crypto";
import { STORE_EMPLOYEE_TRAINING_KEY_PREFIX } from "@sps/crm/models/task/sdk/model";
import { Service } from "./index";

function fixture() {
  const actorId = randomUUID();
  const assigneeId = randomUUID();
  const taskId = randomUUID();
  const storeId = randomUUID();
  const task = {
    id: taskId,
    storeId,
    revision: 3,
    assigneeKind: null,
    assigneeId: null,
    customerId: randomUUID(),
    openingKey: "customer-task",
  };
  const assigned = { ...task, assigneeId, assigneeKind: "ai", revision: 4 };
  const get = jest.fn(async () => task);
  const assign = jest.fn(async () => assigned);
  const getPublication = jest.fn();
  const history = jest.fn();
  const ensureAssignedAgentInThread = jest.fn();
  const service = new Service({
    isAdmin: jest.fn(async () => true),
    findById: jest.fn(async ({ id }: { id: string }) => ({ id, slug: id })),
    module: {
      subjectsToEcommerceModuleStores: { find: jest.fn(async () => []) },
    },
    modules: {
      crm: {
        task: {
          get,
          getPublication,
          history,
          assign,
          withTask: jest.fn(
            async (
              _: unknown,
              action: (current: typeof task) => Promise<unknown>,
            ) => action(task),
          ),
        },
      },
    },
    customerWork: { ensureAssignedAgentInThread },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  jest.spyOn(service, "options").mockResolvedValue({
    canManageEmployees: true,
    participants: [{ id: assigneeId, name: "Редактор", kind: "ai" }],
    employees: [],
    payers: [],
    currencies: [],
    skillsByAssignee: {},
  });
  const assignment = {
    storeId,
    taskId,
    assigneeId,
    expectedRevision: task.revision,
    operationKey: randomUUID(),
  };
  return {
    service,
    actorId,
    assignment,
    task,
    assigned,
    assign,
    getPublication,
    history,
    ensureAssignedAgentInThread,
  };
}

it("assigns the employee to a task without an assignee and connects its conversation", async () => {
  const f = fixture();
  await expect(
    f.service.execute(f.actorId, { kind: "assign", assignment: f.assignment }),
  ).resolves.toMatchObject({
    kind: "assign",
    data: {
      id: f.task.id,
      assigneeId: f.assignment.assigneeId,
      assigneeKind: "ai",
    },
  });
  expect(f.assign).toHaveBeenCalledWith({
    ...f.assignment,
    actorId: f.actorId,
    assigneeKind: "ai",
  });
  expect(f.ensureAssignedAgentInThread).toHaveBeenCalledWith(f.assigned);
});

it("withholds training tasks from CRM detail and assignments", async () => {
  const f = fixture();
  f.task.openingKey = `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}private`;
  const { storeId, taskId } = f.assignment;
  await expect(
    f.service.detail(f.actorId, { storeId, taskId }),
  ).rejects.toThrow("Not Found error");
  await expect(
    f.service.execute(f.actorId, { kind: "assign", assignment: f.assignment }),
  ).rejects.toThrow("Not Found error");
  expect(f.getPublication).not.toHaveBeenCalled();
  expect(f.history).not.toHaveBeenCalled();
  expect(f.assign).not.toHaveBeenCalled();
});
