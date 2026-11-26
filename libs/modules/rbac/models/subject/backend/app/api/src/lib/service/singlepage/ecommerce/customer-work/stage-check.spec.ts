import { randomUUID } from "node:crypto";
import {
  funnelDefinitionSchema,
  linearFunnelDefinition,
} from "@sps/crm/models/funnel/sdk/model";
import { Service } from ".";

it("checks the actual order, message and paid file before reporting original delivery and progressing a converted stage", async () => {
  const task = {
    id: randomUUID(),
    storeId: randomUUID(),
    customerId: randomUUID(),
    orderId: randomUUID(),
    assigneeId: randomUUID(),
    revision: 8,
  };
  const original = randomUUID();
  const preview = randomUUID();
  const file = randomUUID();
  const funding = {
    payer: "customer" as const,
    currencyId: randomUUID(),
    multiplier: "0",
    maxTaskAmount: "0",
    maxRunAmount: "0",
  };
  const definition = linearFunnelDefinition(
    funnelDefinitionSchema.parse({
      progression: "linear",
      initialStageId: "send",
      stages: [
        { id: "send", name: "Файл", behavior: "order-file-delivery" },
        { id: "next", name: "Отзыв" },
      ],
    }),
  );
  const [stage, next] = definition.stages;
  const event = {
    id: randomUUID(),
    pending: true,
    kind: "stage-check",
    detail: { messageId: "sent" },
  };
  const input: Parameters<Service["stageCheckContext"]>[0] = {
    taskId: task.id,
    storeId: task.storeId,
    assigneeId: task.assigneeId,
    assignmentRevision: 3,
    eventId: event.id,
    purpose: "stage-check",
  };
  const order = {
    kind: "individual-service",
    orderId: task.orderId,
    storeId: task.storeId,
    taskId: task.id,
    customerId: task.customerId,
    resultFileId: original,
    deliveredAt: "2026-11-25T12:00:00Z",
    acceptedFileId: file,
    paid: { fileId: file },
    files: [{ id: file, originalFileId: original }],
  };
  const findByOrder = jest.fn().mockResolvedValue(order);
  const transition = jest
    .fn()
    .mockResolvedValue({ ...task, stageId: next.id, status: "active" });
  const service = new Service({
    modules: {
      crm: {
        task: {
          getWork: jest
            .fn()
            .mockResolvedValue({ task, stage, funding, progression: "linear" }),
          withTask: (_: unknown, run: () => Promise<void>) => run(),
          transition,
          getFunnel: jest.fn().mockResolvedValue({ definition }),
        },
        tasksToStages: {
          byOperation: jest.fn().mockResolvedValue(null),
          find: jest.fn().mockResolvedValue([]),
        },
      },
      social: {
        threadsToMessages: {
          find: jest.fn().mockResolvedValue([{ createdAt: new Date() }]),
        },
      },
      ecommerce: { order: { work: { findByOrder } } },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const history = [
    {
      profileId: "buyer",
      message: {
        id: "claim",
        description: "Я уже получил оригинал.",
        workReplyKey: "unverified",
        metadata: { orderResultFileId: original },
      },
    },
    {
      profileId: "worker",
      message: {
        id: "proof",
        description: "Предпросмотр",
        workReplyKey: "attempt-1",
        metadata: { orderResultFileId: preview },
      },
    },
    {
      profileId: "worker",
      message: {
        id: "sent",
        description: "Ваш файл готов.",
        workReplyKey: "attempt-2",
        metadata: { orderResultFileId: original },
      },
    },
  ];
  const internals = service as unknown as {
    requireInputEvent: () => Promise<typeof event>;
    storeWorker: () => Promise<boolean>;
    customerProfiles: () => Promise<Set<string>>;
    replyChannel: () => Promise<{ threadId: string }>;
    messages: () => Promise<typeof history>;
  };
  jest.spyOn(internals, "requireInputEvent").mockResolvedValue(event);
  jest.spyOn(internals, "storeWorker").mockResolvedValue(true);
  jest
    .spyOn(internals, "replyChannel")
    .mockResolvedValue({ threadId: "thread" });
  jest
    .spyOn(internals, "customerProfiles")
    .mockResolvedValue(new Set(["buyer"]));
  jest.spyOn(internals, "messages").mockResolvedValue(history);
  const assign = jest
    .spyOn(service, "assignStageEmployee")
    .mockImplementation(async (task) => task);
  async function observations() {
    const { messages } = await service.stageCheckContext(input);
    return JSON.parse(messages[1].content) as {
      speaker: string;
      paidOriginalAttached: boolean;
      resultPreview: boolean;
    }[];
  }

  findByOrder.mockResolvedValueOnce({ ...order, paid: null });
  expect((await observations()).some((turn) => turn.paidOriginalAttached)).toBe(
    false,
  );
  findByOrder.mockResolvedValueOnce({ ...order, taskId: randomUUID() });
  expect((await observations()).some((turn) => turn.paidOriginalAttached)).toBe(
    false,
  );
  findByOrder.mockResolvedValueOnce({ ...order, deliveredAt: null });
  expect((await observations()).some((turn) => turn.paidOriginalAttached)).toBe(
    false,
  );
  expect(await observations()).toMatchObject([
    { speaker: "customer", paidOriginalAttached: false, resultPreview: false },
    { speaker: "employee", paidOriginalAttached: false, resultPreview: true },
    { speaker: "employee", paidOriginalAttached: true, resultPreview: false },
  ]);
  for (const unrelated of [
    { ...order, kind: "physical-order" },
    { ...order, storeId: randomUUID() },
  ]) {
    findByOrder.mockResolvedValueOnce(unrelated);
    const { messages } = await service.stageCheckContext(input);
    expect(messages[0].content).not.toContain("paidOriginalAttached");
    expect(messages[1].content).not.toContain("paidOriginalAttached");
  }
  const verdictId = randomUUID();
  await service.completeStageCheck(input, verdictId);
  expect(transition).toHaveBeenCalledWith(
    expect.objectContaining({
      taskId: task.id,
      actionId: "advance",
      actorKind: "ai",
      expectedRevision: 8,
      evidence: { kind: "model-result", resultId: verdictId },
    }),
  );
  expect(assign).toHaveBeenCalledWith(
    expect.objectContaining({ stageId: "next" }),
    next,
  );
});
