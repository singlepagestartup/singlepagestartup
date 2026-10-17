import { response as renderTelegram } from "../../../../../../../../../../../../../../apps/host/app/api/telegram-generator/response/singlepage/generate-telegram-crm-form-request-created-admin";
import { randomUUID } from "node:crypto";
import { Service } from "./request";
const mockNotify = jest.fn();
jest.mock("@sps/shared-utils", () => ({ RBAC_SECRET_KEY: "test-secret" }));
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { notify: (...args: any[]) => mockNotify(...args) },
}));

function fixture() {
  const [
    subjectId,
    formId,
    stepA,
    stepB,
    textId,
    noteId,
    optionId,
    selectId,
    numberId,
    submissionId,
  ] = Array.from({ length: 10 }, () => randomUUID());
  const form = { id: formId, title: { en: "Live support title" } };
  const records = new Map<string, any>();
  const input = [
    {
      id: textId,
      variant: "text-default",
      isRequired: true,
      title: { en: "Live text label" },
    },
    {
      id: noteId,
      variant: "textarea-default",
      isRequired: true,
      title: { en: "Live notes" },
    },
    {
      id: selectId,
      variant: "select-option-default",
      isRequired: true,
      title: { en: "Live option" },
    },
    {
      id: numberId,
      variant: "number-default",
      isRequired: false,
      title: { en: "Live amount" },
    },
  ];
  const repository = {
    findSubmission: jest.fn(async ({ key, digest }: any) => {
      const record = records.get(key);
      if (record && record.payload.submissionDigest !== digest)
        throw new Error("different values");
      return record;
    }),
    submit: jest.fn(async ({ key, digest, payload }: any) => {
      if (records.has(key))
        return { request: records.get(key), created: false };
      const request = {
        id: randomUUID(),
        payload: {
          ...payload,
          submissionDigest: digest,
          notificationStatus: "queued",
        },
      };
      records.set(key, request);
      return { request, created: true };
    }),
    setSubmissionNotificationStatus: jest.fn(async ({ key, status }: any) => {
      const record = records.get(key);
      record.payload.notificationStatus = status;
      return record;
    }),
  };
  const find = (rows: any[]) => jest.fn(async () => rows);
  const deps = {
    findById: jest.fn(async () => ({ id: subjectId })),
    crmModule: {
      form: { findById: jest.fn(async () => form) },
      formsToSteps: { find: find([{ stepId: stepA }, { stepId: stepB }]) },
      step: {
        find: find([
          { id: stepA, title: { en: "First step" } },
          { id: stepB, title: { en: "Second step" } },
        ]),
      },
      stepsToInputs: {
        find: find([
          { stepId: stepA, inputId: textId },
          { stepId: stepA, inputId: selectId },
          { stepId: stepB, inputId: noteId },
          { stepId: stepB, inputId: numberId },
        ]),
      },
      input: { find: find(input) },
      inputsToOptions: { find: find([{ inputId: selectId, optionId }]) },
      option: {
        findById: jest.fn(async () => ({
          id: optionId,
          title: { en: "Live chosen option" },
        })),
      },
      request: repository,
    },
    notificationModule: {
      topic: { find: find([{ id: "information" }]) },
      template: {
        find: find([
          {
            id: "template",
            title: "Request",
            variant: "generate-telegram-crm-form-request-created-admin",
          },
        ]),
      },
    },
    role: { find: find([{ id: "admin" }]) },
    subjectsToRoles: { find: find([{ subjectId: "admin-subject" }]) },
  };
  const data = {
    submissionId,
    steps: [
      {
        id: stepA,
        inputs: [
          { id: textId, string: "User text" },
          { id: selectId, option: optionId },
        ],
      },
      {
        id: stepB,
        inputs: [
          { id: noteId, string: "Second step notes" },
          { id: numberId, number: 42 },
        ],
      },
    ],
  };
  return {
    deps,
    repository,
    props: { subjectId, crmModuleFormId: formId, data },
    service: new Service(deps as any),
    form,
    input,
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockNotify.mockResolvedValue({
    notificationService: {
      notifications: [{ id: "delivered", status: "sent" }],
    },
  });
});

it("persists two Steps with server metadata, then sends their complete notification payload", async () => {
  const { service, props, repository } = fixture();
  const result = await service.execute(props);
  expect(result.submissionResult).toMatchObject({
    saved: true,
    notificationStatus: "sent",
    replayed: false,
  });
  expect(repository.submit).toHaveBeenCalledTimes(1);
  const savedForm = repository.submit.mock.calls[0][0].payload.form;
  expect(savedForm.steps).toHaveLength(2);
  expect(savedForm.steps[0].inputs[0]).toMatchObject({
    title: { en: "Live text label" },
    string: "User text",
  });
  expect(savedForm.steps[0].inputs[1].option.title.en).toBe(
    "Live chosen option",
  );
  expect(savedForm.steps[1].inputs[0].string).toBe("Second step notes");
  expect(savedForm.steps[1].inputs[1].number).toBe(42);
  expect(
    mockNotify.mock.calls[0][0].data.notification.notification.data.crm.form,
  ).toEqual(savedForm);
  expect(repository.submit.mock.invocationCallOrder[0]).toBeLessThan(
    mockNotify.mock.invocationCallOrder[0],
  );
});

it.each(["step", "input", "option", "missing", "type", "duplicate"])(
  "rejects %s violations before Request creation or notifications",
  async (kind) => {
    const { service, props, repository } = fixture();
    const data = props.data as any;
    if (kind === "step") data.steps[0].id = randomUUID();
    if (kind === "input") data.steps[0].inputs[0].id = randomUUID();
    if (kind === "option") data.steps[0].inputs[1].option = randomUUID();
    if (kind === "missing") data.steps.pop();
    if (kind === "type")
      data.steps[0].inputs[0] = { id: data.steps[0].inputs[0].id, number: 1 };
    if (kind === "duplicate")
      data.steps[0].inputs.push(data.steps[0].inputs[0]);
    await expect(service.execute(props)).rejects.toThrow("Validation error");
    expect(repository.submit).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  },
);

it("ignores client labels and uses only the linked Option's stored metadata", async () => {
  const { service, props, repository } = fixture();
  (props.data as any).steps[0].inputs[0].title = { en: "FORGED LABEL" };
  (props.data as any).steps[0].inputs[1].option = {
    id: props.data.steps[0].inputs[1].option,
    title: { en: "FORGED OPTION" },
  };
  await service.execute(props);
  expect(JSON.stringify(repository.submit.mock.calls[0][0])).not.toContain(
    "FORGED",
  );
});

it("preflights notification configuration before writing anything", async () => {
  const { service, props, deps, repository } = fixture();
  deps.notificationModule.template.find.mockResolvedValue([]);
  await expect(service.execute(props)).rejects.toThrow("templates not found");
  expect(repository.submit).not.toHaveBeenCalled();
});

it("reports saved state after delivery failure and replays without another Request or notification", async () => {
  const { service, props, repository } = fixture();
  mockNotify.mockRejectedValueOnce(new Error("Test sink unavailable"));
  const first = await service.execute(props);
  expect(first.submissionResult).toMatchObject({
    saved: true,
    notificationStatus: "failed",
  });
  const second = await service.execute(props);
  expect(second.submissionResult).toMatchObject({
    saved: true,
    notificationStatus: "failed",
    replayed: true,
    requestId: first.submissionResult.requestId,
  });
  expect(repository.submit).toHaveBeenCalledTimes(1);
  expect(mockNotify).toHaveBeenCalledTimes(1);
  props.data.steps[0].inputs[0].string = "Different value";
  await expect(service.execute(props)).rejects.toThrow("different values");
});

it("returns the committed queued receipt if notification-status persistence fails", async () => {
  const { service, props, repository } = fixture();
  repository.setSubmissionNotificationStatus.mockRejectedValueOnce(
    new Error("DB unavailable after delivery"),
  );
  const first = await service.execute(props);
  expect(first.submissionResult).toMatchObject({
    saved: true,
    notificationStatus: "queued",
  });
  expect((await service.execute(props)).submissionResult.requestId).toBe(
    first.submissionResult.requestId,
  );
  expect(mockNotify).toHaveBeenCalledTimes(1);
});

it("renders the completed two-Step notification into a test delivery sink", async () => {
  const sink: string[] = [];
  mockNotify.mockImplementation(async ({ data }: any) => {
    const rendered = renderTelegram({
      variant: "generate-telegram-crm-form-request-created-admin",
      language: "en",
      data: data.notification.notification.data,
    });
    sink.push(String(rendered.props[0]));
    return {
      notificationService: {
        notifications: [{ id: "sink-delivery", status: "sent" }],
      },
    };
  });
  const { service, props } = fixture();
  await service.execute(props);
  expect(sink).toHaveLength(1);
  for (const value of [
    "Live support title",
    "First step",
    "Second step",
    "Live text label",
    "Live chosen option",
    "User text",
    "Second step notes",
    "42",
  ])
    expect(sink[0]).toContain(value);
});

it("accepts a supplied false boolean as a typed required value", async () => {
  const { service, props, input, repository } = fixture();
  input[3].variant = "boolean-default";
  Object.assign(input[3], { type: "boolean", isRequired: true });
  (props.data.steps[1].inputs as any[])[1] = {
    id: input[3].id,
    boolean: false,
  };
  await service.execute(props);
  expect(
    repository.submit.mock.calls[0][0].payload.form.steps[1].inputs[1].boolean,
  ).toBe(false);
});

it("lets concurrent identical submissions share one Request and one notification attempt", async () => {
  const { service, props, repository } = fixture();
  const [first, second] = await Promise.all([
    service.execute(props),
    service.execute(props),
  ]);
  expect(first.submissionResult.requestId).toBe(
    second.submissionResult.requestId,
  );
  expect(mockNotify).toHaveBeenCalledTimes(1);
  expect(repository.setSubmissionNotificationStatus).toHaveBeenCalledTimes(1);
});

it.each([
  [["sent"], "sent"],
  [["error"], "failed"],
  [["failed"], "failed"],
  [["new"], "queued"],
  [[undefined], "queued"],
  [["sent", "new"], "queued"],
  [["sent", "error"], "failed"],
  [["new", "error"], "failed"],
  [[], "failed"],
] as const)(
  "uses returned Notification statuses %j for the saved receipt %s",
  async (statuses, expected) => {
    const { service, props, repository } = fixture();
    mockNotify.mockResolvedValue({
      notificationService: {
        notifications: statuses.map((status, index) => ({
          id: `delivery-${index}`,
          status,
        })),
      },
    });
    const result = await service.execute(props);
    expect(result.submissionResult).toMatchObject({
      saved: true,
      notificationStatus: expected,
    });
    expect(repository.setSubmissionNotificationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: expected }),
    );
  },
);

it.each([
  [["error", "new"], "failed"],
  [["new", "error"], "failed"],
  [["new", "sent"], "queued"],
  [["sent", "new"], "queued"],
] as const)(
  "preserves mixed delivery priority across recipient calls %j",
  async (statuses, expected) => {
    const { service, props, deps } = fixture();
    deps.subjectsToRoles.find.mockResolvedValue([
      { subjectId: "admin-first" },
      { subjectId: "admin-second" },
    ]);
    for (const status of statuses)
      mockNotify.mockResolvedValueOnce({
        notificationService: {
          notifications: [{ id: `delivery-${status}`, status }],
        },
      });
    const result = await service.execute(props);
    expect(mockNotify).toHaveBeenCalledTimes(2);
    expect(result.submissionResult).toMatchObject({
      saved: true,
      notificationStatus: expected,
    });
  },
);
