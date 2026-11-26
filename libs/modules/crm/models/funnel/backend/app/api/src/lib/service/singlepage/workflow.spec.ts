import {
  funnelDefinitionSchema,
  linearFunnelDefinition,
  orderPaymentStagePatch,
  stageCompletionCondition,
  stageWorkCapabilities,
  stageWorkFunding,
  stageWorkModelSelection,
} from "@sps/crm/models/funnel/sdk/model";
import { randomUUID } from "node:crypto";
import { OPEN_AI_STAGE_TEXT_DEFAULT } from "@sps/shared-utils";
import { Service } from ".";
import { validateFunnelDefinition } from "./utils";

it("returns ordered stage and offer projections from the scoped funnel", async () => {
  const row = {
    id: randomUUID(),
    storeId: randomUUID(),
    slug: "cover-design",
    bindings: { offerIds: [randomUUID()], formIds: [], productIds: [] },
    definition: {
      initialStageId: "intake",
      stages: [{ id: "intake", name: "Intake", actions: [] }],
    },
  };
  const scopedBySlug = jest.fn().mockResolvedValue(row);
  const service: Service = Object.assign(Object.create(Service.prototype), {
    repository: { scopedBySlug },
  });
  const result = await service.getBySlug({
    storeId: row.storeId,
    funnelSlug: row.slug,
  });
  expect(result.bindings).toEqual(row.bindings);
  expect(result.definition).toEqual(row.definition);
  expect(result).not.toHaveProperty("publishedVersion");
});

it("reads legacy payment stages using the Ecommerce order payment behavior", () => {
  const definition = funnelDefinitionSchema.parse({
    initialStageId: "checkout",
    stages: [{ id: "checkout", name: "Checkout", behavior: "order-payment" }],
  });
  expect(definition.stages[0].behavior).toBe("ecommerce-module-order-payment");
});

it("defaults explicit Astra to High while preserving legacy stages and model boundaries", () => {
  const read = (options: object) =>
    funnelDefinitionSchema.parse({
      initialStageId: "draft",
      stages: [{ id: "draft", name: "Draft", actions: [], ...options }],
    }).stages[0];
  const legacyModel = {
    modelId: "gpt-5.4-mini-2026-03-17",
    reasoning: "low",
  } as const;
  const image = { modelId: "gpt-image-2.5-flare-2026-09-08" };
  const buyerModel = {
    modelId: OPEN_AI_STAGE_TEXT_DEFAULT.modelId,
    reasoning: "medium",
  } as const;

  expect(stageWorkModelSelection(read({}), "text")).toBeUndefined();
  expect(stageWorkModelSelection(read({}), "text", buyerModel)).toEqual(
    buyerModel,
  );
  const astra = read({
    provider: { modelId: OPEN_AI_STAGE_TEXT_DEFAULT.modelId },
  });
  expect(stageWorkModelSelection(astra, "text", buyerModel)).toEqual({
    ...OPEN_AI_STAGE_TEXT_DEFAULT,
    provider: "openai",
  });
  const pdf = read({ output: "pdf", provider: buyerModel });
  expect(stageWorkModelSelection(pdf, "text")).toEqual({
    ...buyerModel,
    provider: "openai",
  });
  expect(stageWorkModelSelection(pdf, "decision", buyerModel)).toBeUndefined();

  const legacy = read({ provider: legacyModel });
  expect(stageWorkModelSelection(legacy, "text", buyerModel)).toEqual({
    ...legacyModel,
    provider: "openai",
  });
  const oldWithoutEffort = read({ provider: { modelId: "gpt-4.1-mini" } });
  expect(stageWorkModelSelection(oldWithoutEffort, "text")).toEqual({
    modelId: "gpt-4.1-mini",
    provider: "openai",
  });

  const cover = read({ output: "image", provider: image });
  expect(stageWorkModelSelection(cover, "image", buyerModel)).toEqual({
    ...image,
    provider: "openai",
  });
  expect(
    stageWorkModelSelection(cover, "decision", buyerModel),
  ).toBeUndefined();
  for (const options of [
    { output: "image", provider: legacyModel },
    { output: "image", provider: OPEN_AI_STAGE_TEXT_DEFAULT },
    { output: "chat", provider: image },
    { output: "image", provider: { ...image, reasoning: "high" } },
    {
      output: "chat",
      provider: { modelId: "gpt-4.1-mini", reasoning: "high" },
    },
    { output: "chat", provider: { ...buyerModel, reasoning: "low" } },
    { output: "chat", provider: { ...buyerModel, reasoning: "xhigh" } },
    { output: "chat", provider: { modelId: "gpt-unknown" } },
  ]) {
    expect(() => read(options)).toThrow();
  }
});

it("rejects unknown targets and stage IDs that cannot identify a single stage", () => {
  const action = {
    id: "reply",
    name: "Reply",
    actors: ["manager"],
    evidence: ["manual"],
    nextStageId: "missing",
  };
  const stage = { id: "intake", name: "Intake", actions: [action] };
  const definition = funnelDefinitionSchema.parse({
    initialStageId: stage.id,
    stages: [stage],
  });
  expect(() => validateFunnelDefinition(definition, "consultation")).toThrow(
    "unknown stage",
  );
  const duplicate = {
    ...definition,
    stages: [...definition.stages, ...definition.stages],
  };
  expect(() => validateFunnelDefinition(duplicate, "consultation")).toThrow(
    "must be unique",
  );
});

it("rejects buyer confirmation or payment evidence for an action attributed only to the manager", () => {
  const definition = funnelDefinitionSchema.parse({
    initialStageId: "payment",
    stages: [
      {
        id: "payment",
        name: "Awaiting payment",
        actions: [
          {
            id: "pay",
            name: "Mark paid",
            actors: ["manager"],
            evidence: ["payment"],
            outcome: "completed",
          },
        ],
      },
    ],
  });
  expect(() => validateFunnelDefinition(definition, "physical-order")).toThrow(
    "requires a system action",
  );
});

it("converts a legacy acceptance and combined payment stage without weakening either gate", () => {
  const legacy = funnelDefinitionSchema.parse({
    initialStageId: "review",
    stages: [
      {
        id: "brief",
        name: "Бриф",
        actions: [
          {
            id: "choose",
            name: "Выбрать",
            actors: ["ai"],
            evidence: ["model-result"],
            instruction: "Заказчик указал размер",
            nextStageId: "pay",
          },
        ],
      },
      {
        id: "review",
        name: "Проверить",
        actions: [
          {
            id: "accept",
            name: "Принять",
            actors: ["system"],
            evidence: ["result-accepted"],
            nextStageId: "pay",
          },
          {
            id: "skip",
            name: "Пропустить",
            actors: ["manager"],
            evidence: ["manual"],
            nextStageId: "pay",
          },
        ],
      },
      {
        id: "pay",
        name: "Оплата и выдача оригинала",
        actions: [
          {
            id: "paid",
            name: "Оплачено",
            actors: ["system"],
            evidence: ["payment"],
            outcome: "completed",
          },
          {
            id: "received-original",
            name: "Original received",
            actors: ["system"],
            evidence: ["file-access"],
            outcome: "completed",
          },
        ],
      },
    ],
  });
  const result = linearFunnelDefinition(legacy);
  expect(result.initialStageId).toBe("brief");
  expect(result.stages[0]).toMatchObject({
    evidenceInstruction: "Заказчик указал размер",
    actions: [
      { actors: ["ai"], evidence: ["model-result"], nextStageId: "review" },
      {
        actors: ["manager", "human"],
        evidence: ["manual"],
        nextStageId: "review",
      },
    ],
  });
  expect(result.stages[1].actions).toHaveLength(1);
  expect(result.stages[1].actions[0]).toMatchObject({
    actors: ["system"],
    evidence: ["result-accepted"],
  });
  expect(result.stages.map(({ id }) => id)).toEqual(["brief", "review", "pay"]);
  expect(result.stages[2]).toMatchObject({
    id: "pay",
    name: legacy.stages[2].name,
    behavior: "ecommerce-module-order-payment",
    actions: [
      { actors: ["system"], evidence: ["payment"], outcome: "completed" },
    ],
  });
  expect(linearFunnelDefinition(result)).toEqual(result);
  expect(() =>
    validateFunnelDefinition(result, "individual-service"),
  ).not.toThrow();
});

it.each([undefined, "linear"] as const)(
  "keeps the ID, employee and instruction of an old delivery stage in a %s funnel",
  (progression) => {
    const assignee = randomUUID();
    const provider = { modelId: "gpt-6.2-astra", reasoning: "medium" } as const;
    const tariff = {
      payer: "customer",
      currencyId: randomUUID(),
      multiplier: "0",
      maxStageAmount: "0",
      maxRunAmount: "0",
    } as const;
    const legacy = funnelDefinitionSchema.parse({
      initialStageId: "pay",
      progression,
      stages: [
        {
          id: "pay",
          name: "Оплата",
          behavior: "ecommerce-module-order-payment",
          defaultAssigneeSubjectId: assignee,
          provider,
          actions: [
            {
              id: "pay",
              name: "Оплата",
              actors: ["system"],
              evidence: ["payment"],
              nextStageId: "deliver",
            },
          ],
        },
        {
          id: "deliver",
          name: "Выдача",
          behavior: "order-file-delivery",
          workFunding: tariff,
          actions: [
            {
              id: "deliver",
              name: "Оригинал",
              actors: ["system"],
              evidence: ["delivery"],
              deliveryStage: "delivered",
              outcome: "completed",
            },
          ],
        },
      ],
    });
    const normalized = linearFunnelDefinition(legacy);
    const [payment, delivery] = normalized.stages;
    expect(normalized.stages.map((stage) => stage.id)).toEqual([
      "pay",
      "deliver",
    ]);
    expect(payment.actions[0]).toMatchObject({
      actors: ["system"],
      evidence: ["payment"],
      nextStageId: "deliver",
    });
    expect(stageCompletionCondition(delivery)).toBe(
      "Оплаченный оригинал прикреплён к сообщению покупателю в чате заказа.",
    );
    expect(delivery.behavior).toBeUndefined();
    expect(delivery).toMatchObject({
      name: "Выдача",
      instruction: "Отправь покупателю оплаченный оригинал заказа.",
      defaultAssigneeSubjectId: assignee,
      output: "chat",
      provider,
      actions: [
        { actors: ["ai"], evidence: ["model-result"], outcome: "completed" },
        {
          actors: ["manager", "human"],
          evidence: ["manual"],
          outcome: "completed",
        },
      ],
    });
    expect(stageWorkFunding(legacy, legacy.stages[1])).toEqual(
      stageWorkFunding(normalized, delivery),
    );
    expect(stageWorkFunding(normalized, delivery)).toMatchObject({
      currencyId: tariff.currencyId,
      multiplier: "0",
      payer: "customer",
    });
    expect(linearFunnelDefinition(normalized)).toEqual(normalized);
    expect(() =>
      validateFunnelDefinition(normalized, "individual-service"),
    ).not.toThrow();
    const assigned = randomUUID();
    legacy.stages[1] = {
      ...legacy.stages[1],
      defaultAssigneeSubjectId: assigned,
      instruction: "Приложи файл с подписью.",
      provider: { ...provider, reasoning: "high" },
    };
    expect(linearFunnelDefinition(legacy).stages[1]).toMatchObject({
      instruction: "Приложи файл с подписью.",
      defaultAssigneeSubjectId: assigned,
      provider: { ...provider, reasoning: "high" },
    });
  },
);

it("keeps the existing task's funding for its assigned payment-stage employee", () => {
  const workFunding = {
    payer: "store-owner" as const,
    currencyId: randomUUID(),
    maxTaskAmount: "15",
    maxRunAmount: "5",
  };
  expect(
    stageWorkFunding(
      { workFunding },
      {
        behavior: "ecommerce-module-order-payment",
        defaultAssigneeSubjectId: randomUUID(),
      },
    ),
  ).toEqual(workFunding);
  expect(
    stageWorkFunding(
      { workFunding },
      { behavior: "ecommerce-module-order-payment" },
    ),
  ).toBeUndefined();
  expect(
    stageWorkFunding(
      {},
      {
        behavior: "ecommerce-module-order-payment",
        defaultAssigneeSubjectId: randomUUID(),
      },
    ),
  ).toBeUndefined();
});

it.each(["image", "pdf"] as const)(
  "resets stale %s output and keeps a compatible text model on payment",
  (output) => {
    const provider =
      output === "image"
        ? { modelId: "gpt-image-2.5-flare-2026-09-08" }
        : { modelId: "gpt-6.2-astra", reasoning: "medium" as const };
    const [source] = funnelDefinitionSchema.parse({
      initialStageId: "pay",
      stages: [
        {
          id: "pay",
          name: "Payment",
          output,
          provider,
          behavior: "ecommerce-module-order-payment",
          instruction: "Answer questions about the invoice.",
          waiting: { expectedEvent: "delivery", deadlineSeconds: 300 },
          ...(output === "image" && {
            imageBrief: "marketplace-cover",
            imageBriefAutoGenerate: true,
          }),
        },
      ],
    }).stages;
    const [normalized] = linearFunnelDefinition({
      progression: "linear",
      initialStageId: "pay",
      stages: [source],
    }).stages;
    expect(normalized).toMatchObject({
      behavior: "ecommerce-module-order-payment",
      output: "chat",
      instruction: source.instruction,
      actions: [
        { actors: ["system"], evidence: ["payment"], outcome: "completed" },
      ],
    });
    expect(normalized.provider).toEqual(
      output === "image" ? undefined : provider,
    );
    expect(normalized.waiting).toBeUndefined();
    expect(normalized.imageBrief).toBeUndefined();
    expect(normalized.imageBriefAutoGenerate).toBeUndefined();
    expect(
      orderPaymentStagePatch({
        ...source,
        waiting: { ...source.waiting!, expectedEvent: "payment" },
      }),
    ).not.toHaveProperty("waiting");
  },
);

it("keeps physical delivery milestones and completes payment for an order with no subsequent stage", () => {
  const source = funnelDefinitionSchema.parse({
    initialStageId: "pay",
    stages: [
      {
        id: "pay",
        name: "Pay",
        actions: [
          {
            id: "payment",
            name: "Paid",
            actors: ["system"],
            evidence: ["payment"],
            nextStageId: "ship",
          },
        ],
      },
      {
        id: "ship",
        name: "Dispatch",
        actions: [
          {
            id: "ship",
            name: "Ship",
            actors: ["system"],
            evidence: ["delivery"],
            deliveryStage: "in-transit",
            outcome: "completed",
          },
        ],
      },
    ],
  });
  const physical = linearFunnelDefinition(source);
  expect(physical.stages[0].behavior).toBe("ecommerce-module-order-payment");
  expect(physical.stages[1].actions).toEqual(source.stages[1].actions);
  expect(() =>
    validateFunnelDefinition(physical, "physical-order"),
  ).not.toThrow();
  const terminal = linearFunnelDefinition({
    ...source,
    stages: source.stages.slice(0, 1),
  });
  expect(terminal.stages).toHaveLength(1);
  expect(terminal.stages[0].actions).toEqual([
    expect.objectContaining({
      actors: ["system"],
      evidence: ["payment"],
      outcome: "completed",
    }),
  ]);
});
it("preserves old definitions and restricts file output to funded individual services", () => {
  const stage = { id: "make", name: "Production", actions: [] };
  const build = (output?: "pdf" | "image") =>
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [{ ...stage, output }],
    });

  expect(() => validateFunnelDefinition(build(), "consultation")).not.toThrow();
  expect(() =>
    validateFunnelDefinition(build("image"), "individual-service"),
  ).toThrow("funded individual-service");

  const funded = {
    ...build("pdf"),
    workFunding: {
      payer: "store-owner" as const,
      currencyId: "5bd2af60-e3f0-4494-a8b1-c645c2369129",
      maxTaskAmount: "10",
      maxRunAmount: "5",
    },
  };
  expect(() => validateFunnelDefinition(funded, "physical-order")).toThrow(
    "individual-service",
  );
  expect(() =>
    validateFunnelDefinition(funded, "individual-service"),
  ).not.toThrow();
});

it("keeps the marketplace cover brief on image stages only", () => {
  const stage = {
    id: "cover",
    name: "Marketplace cover",
    actions: [],
    operations: ["vision"],
    imageBrief: "marketplace-cover",
  };
  const parse = (output?: string) =>
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [{ ...stage, output }],
    });

  const [image] = parse("image").stages;
  expect(image.imageBrief).toBe("marketplace-cover");
  expect(stageWorkCapabilities(image)).toEqual(["image"]);
  const automatic = funnelDefinitionSchema.parse({
    initialStageId: image.id,
    stages: [{ ...image, imageBriefAutoGenerate: true }],
  }).stages[0];
  expect(stageWorkCapabilities(automatic)).toEqual(["image", "decision"]);
  expect(() =>
    funnelDefinitionSchema.parse({
      initialStageId: image.id,
      stages: [{ ...automatic, imageBrief: undefined }],
    }),
  ).toThrow("Automatic cover generation requires a marketplace cover brief");
  expect(stageWorkCapabilities({ ...image, imageBrief: undefined })).toEqual([
    "image",
  ]);
  expect(() => parse()).toThrow(
    "Marketplace cover brief requires image output",
  );
  expect(() => parse("pdf")).toThrow(
    "Marketplace cover brief requires image output",
  );
});

it("preserves explicit skill selections on the assigned stage", () => {
  const skillId = "5bd2af60-e3f0-4494-a8b1-c645c2369129";
  const assigneeId = "5bd2af60-e3f0-4494-a8b1-c645c2369130";
  const stage = {
    id: "cover",
    name: "Cover",
    actions: [],
    skillIds: [skillId],
  };
  expect(() =>
    funnelDefinitionSchema.parse({ initialStageId: stage.id, stages: [stage] }),
  ).toThrow("Stage skills require an assigned agent");
  const assigned = { ...stage, defaultAssigneeSubjectId: assigneeId };
  expect(
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [assigned],
    }).stages[0].skillIds,
  ).toEqual([skillId]);
  expect(() =>
    funnelDefinitionSchema.parse({
      initialStageId: stage.id,
      stages: [{ ...assigned, skillIds: [skillId, skillId] }],
    }),
  ).toThrow();
});
