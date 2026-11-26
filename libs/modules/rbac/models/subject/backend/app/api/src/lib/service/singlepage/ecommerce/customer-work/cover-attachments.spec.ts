import { randomUUID } from "node:crypto";
import type { TCoverAttachmentRole } from "@sps/crm/models/funnel/sdk/model";
import { Service } from ".";

interface IFilter {
  column: string;
  method: string;
  value: string | number | string[];
}

interface IFind {
  params: { filters: { and: IFilter[] }; limit?: number };
}

function fixture(withDesignHistory = false) {
  const threadId = randomUUID();
  const buyerProfileId = randomUUID();
  const agentProfileId = randomUUID();
  const task = {
    id: randomUUID(),
    storeId: randomUUID(),
    orderId: randomUUID() as string | null,
    stageId: "render",
    publicationId: randomUUID(),
    customerId: randomUUID(),
    assignmentRevision: 2,
    assigneeId: randomUUID(),
  };
  function upload(
    revision: number,
    coverAttachmentRole?: TCoverAttachmentRole,
    placement = threadId,
    profileId = buyerProfileId,
    taskId = task.id,
  ) {
    const attachment = {
      id: randomUUID(),
      name: `input-${revision}.png`,
      digest: "a".repeat(64),
      mimeType: "image/png",
    };
    const message = {
      id: randomUUID(),
      variant: "customer-work",
      description: "",
      metadata: {
        customerWorkAttachments: [attachment],
        coverRole: "style-reference",
      },
    };
    return {
      attachment,
      message,
      placement,
      profileId,
      event: {
        id: randomUUID(),
        kind: "customer-message",
        taskId,
        actorId: task.customerId,
        revision,
        detail: { messageId: message.id, coverAttachmentRole },
      },
    };
  }
  const product = upload(2, "product-photo");
  const style = upload(5, "style-reference");
  const alternateStyle = {
    id: randomUUID(),
    name: "alternate.webp",
    digest: "b".repeat(64),
    mimeType: "image/webp",
  };
  style.message.metadata.customerWorkAttachments.push(alternateStyle);
  style.message.metadata.customerWorkAttachments.push({
    id: randomUUID(),
    name: "note.wav",
    digest: "c".repeat(64),
    mimeType: "audio/wav",
  });
  const legacy = upload(11);
  const trigger = upload(12);
  trigger.message.description = "Поменяй заголовок";
  trigger.message.metadata.customerWorkAttachments = [];
  const anotherThread = upload(6, "style-reference", randomUUID());
  const anotherTask = upload(
    7,
    "style-reference",
    threadId,
    buyerProfileId,
    randomUUID(),
  );
  const staff = upload(8, "style-reference", threadId, randomUUID());
  const future = upload(13, "style-reference");
  const employeeDesign = "Вынесем название по диагонали в верхний угол.";
  function reply(
    revision: number,
    description: string,
    metadata = {},
    key = "attempt",
  ) {
    const entry = upload(revision, undefined, threadId, agentProfileId);
    Object.assign(entry.message, {
      description,
      workReplyKey: `${key}:${entry.event.id}`,
      metadata: {
        ...metadata,
        customerWorkReplyEvent: {
          id: entry.event.id,
          taskId: task.id,
          revision,
        },
      },
    });
    return entry;
  }
  const staffReplies = withDesignHistory
    ? [
        reply(8, employeeDesign),
        reply(9, "Проверьте последнее обращение.", {}, "reminder"),
        reply(10, "Подтвердите бриф.", { customerWorkImageDraft: {} }),
        reply(11, "Предпросмотр готов.", { customerWorkResultVersionId: "id" }),
        reply(14, "Позднее предложение."),
      ]
    : [];
  const history = [
    product,
    style,
    legacy,
    trigger,
    anotherThread,
    anotherTask,
    staff,
    future,
    ...staffReplies,
  ];
  const event = {
    id: randomUUID(),
    kind: "customer-work-resumed",
    taskId: task.id,
    revision: 15,
    operationKey: "resume-work:revision",
    assignmentRevision: task.assignmentRevision,
    detail: {
      messageId: trigger.message.id,
      sourceRevision: trigger.event.revision,
      stageId: task.stageId,
      publicationId: task.publicationId,
      assigneeId: task.assigneeId,
    },
  };
  const buyerInputs = [legacy, trigger, future];
  const current = [...buyerInputs, ...staffReplies];
  const findThreadMessages = jest.fn(async ({ params }: IFind) => {
    const scopedThread = params.filters.and.find(
      ({ column }) => column === "threadId",
    )?.value;
    const ids = params.filters.and.find(
      ({ column }) => column === "messageId",
    )?.value;
    const uploads = Array.isArray(ids)
      ? history.filter(({ message }) => ids.includes(message.id))
      : current;
    return uploads
      .filter(({ placement }) => placement === scopedThread)
      .map(({ event: record, message }) => ({
        messageId: message.id,
        createdAt: new Date(record.revision * 1000),
      }));
  });
  const findEvents = jest.fn(async ({ params }: IFind) => {
    const role = params.filters.and.find(
      ({ column }) => column === "detail->>coverAttachmentRole",
    )?.value;
    if (role) {
      const selectedTask = params.filters.and.find(
        ({ column }) => column === "taskId",
      )?.value;
      const ceiling = params.filters.and.find(
        ({ column }) => column === "revision",
      )?.value;
      return history
        .map(({ event }) => event)
        .filter(
          (record) =>
            record.taskId === selectedTask &&
            record.revision <= Number(ceiling) &&
            record.detail.coverAttachmentRole === role,
        );
    }
    return buyerInputs.map(({ event }) => event);
  });
  const findOrderWork = jest.fn().mockResolvedValue(null);
  const getWork = jest.fn().mockResolvedValue({
    task,
    stage: { imageBrief: "marketplace-cover", actions: [] },
  });
  const readFullTextDraft = jest.fn();
  const findEvent = jest.fn().mockResolvedValue(event);
  const service = new Service({
    authenticationMe: jest.fn().mockResolvedValue({ authenticated: true }),
    orderWork: { readFullTextDraft },
    module: {
      subjectsToSocialModuleProfiles: { find: jest.fn().mockResolvedValue([]) },
    },
    modules: {
      ecommerce: {
        order: { work: { findByOrder: findOrderWork } },
      },
      crm: {
        task: {
          getWork,
        },
        tasksToStages: {
          find: findEvents,
          forMessages: jest.fn(async (taskId: string, messageIds: string[]) =>
            buyerInputs
              .filter(
                ({ event, message }) =>
                  event.taskId === taskId && messageIds.includes(message.id),
              )
              .map(({ event }) => event),
          ),
          findById: findEvent,
        },
      },
      social: {
        chatsToCrmModuleTasks: {
          channels: jest
            .fn()
            .mockResolvedValue([{ threadId, chatId: randomUUID() }]),
        },
        threadsToMessages: { find: findThreadMessages },
        message: {
          findById: jest.fn(
            async ({ id }) =>
              history.find(({ message }) => message.id === id)?.message,
          ),
        },
        profilesToMessages: {
          find: jest.fn(async ({ params }: IFind) => {
            const id = params.filters.and.find(
              ({ column }) => column === "messageId",
            )?.value;
            const upload = history.find(({ message }) => message.id === id);
            return upload ? [{ profileId: upload.profileId }] : [];
          }),
        },
        profile: { findById: jest.fn().mockResolvedValue(null) },
      },
    },
  } as unknown as ConstructorParameters<typeof Service>[0]);
  const internals = service as unknown as {
    storeWorker: () => Promise<boolean>;
    customerProfiles: () => Promise<Set<string>>;
    profileForSubject: () => Promise<null>;
    assignedAgentProfile: () => Promise<{ id: string }>;
    knowledge: { context: () => Promise<{ sourceVersions: [] }> };
  };
  jest.spyOn(internals, "storeWorker").mockResolvedValue(true);
  jest
    .spyOn(internals, "customerProfiles")
    .mockResolvedValue(new Set([buyerProfileId]));
  jest.spyOn(internals, "profileForSubject").mockResolvedValue(null);
  jest
    .spyOn(internals, "assignedAgentProfile")
    .mockResolvedValue({ id: agentProfileId });
  jest.spyOn(internals, "knowledge", "get").mockReturnValue({
    context: jest.fn().mockResolvedValue({ sourceVersions: [] }),
  });

  return {
    service,
    task,
    event,
    threadId,
    product,
    style,
    alternateStyle,
    legacy,
    trigger,
    future,
    findEvents,
    findThreadMessages,
    employeeDesign,
    findOrderWork,
    getWork,
    staffReplies,
    readFullTextDraft,
    findEvent,
    input: {
      eventId: event.id,
      taskId: task.id,
      storeId: task.storeId,
      assigneeId: task.assigneeId,
      assignmentRevision: task.assignmentRevision,
    },
  };
}

it("keeps the earlier buyer photos by original event order when a cover reply resumes", async () => {
  const f = fixture();
  const context = await f.service.contextForRun(f.input);
  expect(context.attachments).toEqual([
    {
      ...f.product.attachment,
      messageId: f.product.message.id,
      coverRole: "product-photo",
    },
    {
      ...f.style.attachment,
      messageId: f.style.message.id,
      coverRole: "style-reference",
    },
    {
      ...f.alternateStyle,
      messageId: f.style.message.id,
      coverRole: "style-reference",
    },
    { ...f.legacy.attachment, messageId: f.legacy.message.id },
  ]);
  expect(f.findEvents).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        filters: {
          and: expect.arrayContaining([
            { column: "taskId", method: "eq", value: f.task.id },
            {
              column: "kind",
              method: "inArray",
              value: ["customer-message", "staff-message"],
            },
            {
              column: "revision",
              method: "lte",
              value: f.event.detail.sourceRevision,
            },
            {
              column: "detail->>coverAttachmentRole",
              method: "eq",
              value: "style-reference",
            },
          ]),
        },
      }),
    }),
  );
  expect(f.findThreadMessages).toHaveBeenCalledWith(
    expect.objectContaining({
      params: expect.objectContaining({
        filters: {
          and: expect.arrayContaining([
            { column: "threadId", method: "eq", value: f.threadId },
            {
              column: "messageId",
              method: "inArray",
              value: expect.arrayContaining([
                f.product.message.id,
                f.style.message.id,
              ]),
            },
          ]),
        },
      }),
    }),
  );
});

function stageEntryFixture() {
  const f = fixture();
  const visit = {
    id: randomUUID(),
    taskId: f.task.id,
    variant: "current",
    revision: 13,
  };
  const entry = {
    ...f.event,
    kind: "stage-entry",
    causeId: visit.id,
    revision: 14,
    operationKey: `stage-entry:${visit.id}:${visit.revision}`,
    createdAt: new Date(14_000),
    detail: {
      stageId: f.task.stageId,
      publicationId: f.task.publicationId,
      assigneeId: f.task.assigneeId,
    },
  };
  f.future.event.revision = 15;
  f.getWork.mockResolvedValue({
    task: f.task,
    stage: { operations: ["knowledge-search"], actions: [] },
  });
  f.findOrderWork.mockResolvedValue({
    orderId: f.task.orderId,
    taskId: f.task.id,
    storeId: f.task.storeId,
    customerId: f.task.customerId,
  });
  f.findEvent.mockImplementation(async ({ id }) =>
    id === visit.id ? visit : entry,
  );
  return f;
}

it("offers no knowledge query for a greeting before the buyer sends text", async () => {
  const f = stageEntryFixture();
  f.trigger.message.description = "";
  const context = await f.service.contextForRun(f.input);
  expect(context.stageEntryKnowledgeQuery).toBeUndefined();
});

it("keeps the latest eligible buyer text from the same order for stage entry", async () => {
  const f = stageEntryFixture();
  f.legacy.message.description = "Earlier buyer message.";
  f.trigger.message.description = "The brief is for a catalogue studio.";
  f.future.message.description = "A message sent after stage entry.";

  const context = await f.service.contextForRun(f.input);
  expect(context.messages.at(-1)?.role).toBe("system");
  expect(context.stageEntryKnowledgeQuery).toBe(f.trigger.message.description);

  f.trigger.event.actorId = randomUUID();
  const afterTransfer = await f.service.contextForRun(f.input);
  expect(afterTransfer.stageEntryKnowledgeQuery).toBe(
    f.legacy.message.description,
  );

  f.findOrderWork.mockResolvedValue({
    orderId: f.task.orderId,
    taskId: randomUUID(),
    storeId: f.task.storeId,
    customerId: f.task.customerId,
  });
  const otherTask = await f.service.contextForRun(f.input);
  expect(otherTask.stageEntryKnowledgeQuery).toBeUndefined();
});

it("continues from the text and attachments that the customer sent before metered work started", async () => {
  const f = stageEntryFixture();
  f.trigger.message.description = "The briefing concerns a catalogue studio.";
  f.findOrderWork.mockResolvedValue({
    orderId: f.task.orderId,
    taskId: f.task.id,
    storeId: f.task.storeId,
    customerId: f.task.customerId,
    paymentMode: "work-tokens",
  });

  const context = await f.service.contextForRun(f.input);

  expect(context.messages).toContainEqual({
    role: "user",
    content: f.trigger.message.description,
  });
  expect(context.messages.at(-1)?.content).toContain(
    "Continue from the request and materials that the customer already sent.",
  );
  expect(context.attachments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: f.legacy.attachment.id }),
    ]),
  );
});

it("carries the visible employee design reply and excludes draft, reminder, result, and later replies", async () => {
  const f = fixture(true);
  const context = await f.service.contextForRun(f.input);
  expect(
    context.imageBrief?.designMessages?.map(({ role, content }) => ({
      role,
      content,
    })),
  ).toEqual([
    { role: "assistant", content: f.employeeDesign },
    { role: "user", content: "Поменяй заголовок" },
  ]);
});

it("loads the exact declined draft when its message is outside the history window", async () => {
  const f = fixture();
  const previewFileId = randomUUID();
  const decisionKey = randomUUID();
  const causeId = randomUUID();
  Object.assign(f.event, { causeId });
  f.findEvent.mockImplementation(async ({ id }) => {
    if (id === causeId) {
      return {
        id: causeId,
        kind: "customer-message",
        taskId: f.task.id,
        revision: f.event.detail.sourceRevision,
        detail: { messageId: f.event.detail.messageId },
        operationKey: `store-work:${f.task.customerId}:file-feedback:${previewFileId}:${decisionKey}`,
      };
    }
    return f.event;
  });
  const draft = "Цель проекта.\nТекущие ограничения.\nНеизвестный бюджет.";
  f.getWork.mockResolvedValue({
    task: f.task,
    stage: {
      output: "pdf",
      resultPricing: { kind: "work-tokens" },
      actions: [],
    },
  });
  const order = {
    orderId: f.task.orderId,
    taskId: f.task.id,
    storeId: f.task.storeId,
    customerId: f.task.customerId,
    paymentMode: "work-tokens",
    files: [
      { id: previewFileId, previewFileId, previewMimeType: "text/plain" },
      { id: "newer", previewFileId: "newer", previewMimeType: "text/plain" },
    ],
    decisions: [
      { kind: "declined", fileId: previewFileId, operationKey: decisionKey },
    ],
  };
  f.findOrderWork.mockResolvedValue(order);
  f.readFullTextDraft.mockResolvedValue(Buffer.from(draft));
  const context = await f.service.contextForRun(f.input);
  expect(context.messages).toContainEqual({
    role: "assistant",
    content: `Previous brief draft:\n${draft}`,
  });
  expect(f.readFullTextDraft).toHaveBeenCalledWith(order, previewFileId);
  expect(f.readFullTextDraft).toHaveBeenCalledTimes(1);

  f.readFullTextDraft.mockClear();
  f.findOrderWork.mockResolvedValue({ ...order, taskId: randomUUID() });
  await f.service.contextForRun(f.input);
  expect(f.readFullTextDraft).not.toHaveBeenCalled();
});

it("keeps the legacy upload unmarked when the order has no recorded design reference", async () => {
  const f = fixture();
  f.style.event.detail.coverAttachmentRole = undefined;
  const withoutStyle = await f.service.contextForRun(f.input);
  expect(withoutStyle.attachments).toEqual([
    {
      ...f.product.attachment,
      messageId: f.product.message.id,
      coverRole: "product-photo",
    },
    { ...f.legacy.attachment, messageId: f.legacy.message.id },
  ]);

  f.product.event.detail.coverAttachmentRole = undefined;
  const context = await f.service.contextForRun(f.input);
  expect(context.attachments).toEqual([
    { ...f.legacy.attachment, messageId: f.legacy.message.id },
  ]);
});

it("does not load the cover attachment history for a task without an order", async () => {
  const f = fixture();
  f.task.orderId = null;
  const context = await f.service.contextForRun(f.input);
  expect(context.attachments).toEqual([
    { ...f.legacy.attachment, messageId: f.legacy.message.id },
  ]);
  expect(
    f.findEvents.mock.calls.some(([query]) =>
      query.params.filters.and.some(
        ({ column }) => column === "detail->>coverAttachmentRole",
      ),
    ),
  ).toBe(false);
});
