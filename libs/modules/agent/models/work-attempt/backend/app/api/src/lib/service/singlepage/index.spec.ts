import { Service } from "./index";
import type { ICustomerWorkRunAttachment } from "@sps/rbac/models/subject/sdk/model";
import { funnelDefinitionSchema } from "@sps/crm/models/funnel/sdk/model";
import { ProviderConnections } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/provider-connections";
import { sendWork } from "@sps/shared-third-parties";
import { CoverWork, type IConfirmedCover } from "./image";
import type { IWorkStep } from "./operations";
import { McpWork, type IMcpAdvice } from "./mcp";

it.each(["generate", "wait"] as const)(
  "uses the paid cover JEV decision %s before image dispatch",
  async (decision) => {
    const service = new Service({} as never);
    const internals = service as unknown as {
      previous: () => Promise<unknown>;
      executeStep: (input: unknown, step: IWorkStep) => Promise<unknown>;
      execute: (...args: unknown[]) => Promise<unknown>;
      runPending: (input: unknown) => Promise<unknown>;
    };
    const input = { eventId: "event" };
    const reply = "Какой текст оставить на обложке?";
    const deliverReply = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(service, "modules", "get").mockReturnValue({
      rbac: { subject: { customerWork: { deliverReply } } },
    } as unknown as typeof service.modules);
    const review = {
      operation: "request-routing",
      input: { capability: "decision", messages: [] },
    } satisfies IWorkStep;
    const cover = { review } as unknown as IConfirmedCover;
    const prepare = jest
      .spyOn(CoverWork.prototype, "prepare")
      .mockResolvedValueOnce(cover);
    const advice: IMcpAdvice = {
      stageId: "art",
      publicationId: "publication",
      history: [],
      evidence: "The requested SKU is available.",
    };
    const mcp = jest
      .spyOn(McpWork.prototype, "plan")
      .mockResolvedValue({ advice });
    jest.spyOn(internals, "previous").mockResolvedValue(undefined);
    const step = jest.spyOn(internals, "executeStep").mockResolvedValue({
      id: "review",
      state: "delivered",
      result: {
        text: JSON.stringify({
          decision,
          ...(decision === "wait" && { reply }),
        }),
      },
    });
    const image = jest
      .spyOn(internals, "execute")
      .mockResolvedValue({ id: "image", state: "delivered" });
    try {
      await expect(internals.runPending(input)).resolves.toMatchObject({
        id: decision === "generate" ? "image" : "review",
      });
      expect(step).toHaveBeenCalledWith(input, review);
      expect(review.input.messages).toContainEqual({
        role: "user",
        content: expect.stringContaining(advice.evidence),
      });
      if (decision === "generate") {
        expect(image).toHaveBeenCalledWith(
          input,
          undefined,
          { mcpAdvice: advice },
          cover,
        );
        expect(step.mock.invocationCallOrder[0]).toBeLessThan(
          image.mock.invocationCallOrder[0],
        );
      } else {
        expect(image).not.toHaveBeenCalled();
        expect(deliverReply).toHaveBeenCalledWith({
          ...input,
          attemptId: "review",
          text: reply,
        });
      }
    } finally {
      prepare.mockRestore();
      mcp.mockRestore();
    }
  },
);

async function prepareStageReply(
  provider: "openai" | "openrouter",
  hasKnowledge: boolean,
  configured?: {
    stageModel?: { modelId: string; reasoning?: "medium" | "high" };
    requestedModelId?: string;
    providers: ProviderConnections;
  },
  mcpAdvice?: IMcpAdvice,
  attachments?: { sources: ICustomerWorkRunAttachment[]; findById: jest.Mock },
) {
  const input = {
    storeId: "store",
    taskId: "task",
    eventId: "event",
    assigneeId: "employee",
    assignmentRevision: 1,
    capability: "text" as const,
  };
  const task = {
    customerId: "customer",
    assigneeKind: "ai",
    publicationId: "publication",
    stageId: "colors",
    openingKey: "customer-work",
  };
  const draftStage = {
    id: "colors",
    name: "Colors",
    instruction:
      "Record the product colors. Keep wholesale prices confidential.",
    ...(configured?.stageModel && {
      provider: configured.stageModel,
    }),
    actions: [
      {
        id: "allowed",
        name: "Allowed",
        actors: ["ai"],
        evidence: ["model-result"],
        nextStageId: "font",
      },
      {
        id: "manager-only",
        name: "Manager only",
        actors: ["manager"],
        evidence: ["model-result"],
        nextStageId: "font",
      },
    ],
  };
  const [stage] = funnelDefinitionSchema.parse({
    initialStageId: draftStage.id,
    stages: [draftStage],
  }).stages;
  const funding = {
    payer: "store-owner",
    currencyId: "currency",
    maxTaskAmount: "30",
    maxRunAmount: "10",
  };
  const customerMessage = {
    role: "user",
    content:
      "What collection is this chair from? Cream, green and ochre are confirmed.",
  };
  const context = {
    inputAttachments: attachments?.sources,
    requestedModelId: configured?.requestedModelId,
    messages: hasKnowledge
      ? [
          {
            role: "system",
            content: "Current references\nCollection: Line A17",
          },
          customerMessage,
        ]
      : [customerMessage],
    knowledgeSourceIds: hasKnowledge ? ["catalogue"] : [],
    sourceVersions: hasKnowledge
      ? [{ id: "catalogue", version: "version" }]
      : [],
  };
  const model = provider === "openai" ? "gpt-4.1-mini" : "openai/gpt-4.1-mini";
  const binding = {
    mode: "server",
    provider,
    model,
    ownerId: "owner",
    terms: {
      maxInputTokens: 32000,
      maxOutputTokens: 1100,
      maxCostUsd: "1",
      inputUsdPerMillion: "0.4",
      outputUsdPerMillion: "1.6",
      usdPerSps: "0.05",
      workMultiplier: "1",
    },
  };
  const service = new Service({
    atomic: async (_key: string, operation: () => Promise<unknown>) =>
      operation(),
  } as never);
  jest.spyOn(service, "find").mockResolvedValue([]);
  jest
    .spyOn(service, "create")
    .mockImplementation(async ({ data }) => ({ ...data, id: "attempt" }));
  jest.spyOn(service, "modules", "get").mockReturnValue({
    fileStorage: {
      file: { privateContent: { findById: attachments?.findById } },
    },
    crm: {
      task: {
        withWork: async (
          _scope: unknown,
          operation: (work: unknown) => Promise<unknown>,
        ) => operation({ task, stage, funding }),
      },
    },
    rbac: {
      subject: {
        customerWork: { contextForRun: jest.fn().mockResolvedValue(context) },
        providerConnections: configured?.providers ?? {
          workScope: jest.fn(),
          resolveWork: jest.fn().mockResolvedValue(binding),
          workCredential: jest.fn().mockResolvedValue("test-credential"),
        },
        workLedger: { reserve: jest.fn(), changeProviderWork: jest.fn() },
      },
    },
  } as never);
  const result = await service["prepare"](
    input,
    undefined,
    mcpAdvice ? { mcpAdvice } : undefined,
  );
  const request = result.outgoing?.request;
  if (request?.capability !== "text") {
    throw new Error("Expected a text stage reply");
  }
  return request;
}

it("sends every original file from the triggering message to the reply model and rejects a changed digest", async () => {
  const sources = [
    {
      id: "first",
      messageId: "message",
      digest: "txt-digest",
      name: "brief.txt",
      mimeType: "application/octet-stream",
    },
    {
      id: "second",
      messageId: "message",
      digest: "image-digest",
      name: "reference.png",
      mimeType: "image/png",
    },
  ];
  const bytes = [
    Buffer.from("brief"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM+0AAAAASUVORK5CYII=",
      "base64",
    ),
  ];
  const findById = jest
    .fn()
    .mockResolvedValueOnce({ digest: sources[0].digest, bytes: bytes[0] })
    .mockResolvedValueOnce({ digest: sources[1].digest, bytes: bytes[1] });
  const request = await prepareStageReply(
    "openai",
    false,
    undefined,
    undefined,
    { sources, findById },
  );
  expect(request.inputFiles).toEqual(
    sources.map(({ name, mimeType }, index) => ({
      name,
      mimeType,
      bytes: bytes[index],
    })),
  );
  expect(findById.mock.calls.map(([lookup]) => lookup)).toEqual(
    sources.map(({ id, digest }) => ({ id, digest })),
  );
  findById.mockResolvedValueOnce(null);
  await expect(
    prepareStageReply("openai", false, undefined, undefined, {
      sources,
      findById,
    }),
  ).rejects.toThrow("message attachment is unavailable");
});

it("uses MCP results as tool messages before allowing the published stage action", async () => {
  const call = {
    id: "stock-1",
    type: "function" as const,
    function: { name: "read_stock", arguments: "{}" },
  };
  const history = [
    { role: "assistant" as const, content: "", tool_calls: [call] },
    {
      role: "tool" as const,
      tool_call_id: call.id,
      content: '{"inStock":true}',
    },
  ];
  const request = await prepareStageReply("openai", false, undefined, {
    stageId: "colors",
    publicationId: "publication",
    evidence: "",
    history,
  });
  const network = jest.fn(async () =>
    Response.json({
      id: "completion",
      status: "completed",
      usage: { input_tokens: 100, output_tokens: 20 },
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                decision: {
                  kind: "advance",
                  actionId: "allowed",
                  reply: "Confirmed",
                },
              }),
            },
          ],
        },
      ],
    }),
  );
  await expect(sendWork(request, "fixture", network)).resolves.toMatchObject({
    actionId: "allowed",
    text: "Confirmed",
  });
  const [, init] = network.mock.calls[0] as unknown as [string, RequestInit];
  const body = JSON.parse(String(init.body));
  expect(body.input.slice(-2)).toEqual([
    { type: "function_call", call_id: call.id, ...call.function },
    {
      type: "function_call_output",
      call_id: call.id,
      output: history[1].content,
    },
  ]);
  expect(body.text.format.name).toBe("crm_stage_decision");
  expect(JSON.stringify(body.text.format)).not.toContain("manager-only");
});

it.each([
  {
    stageModel: { modelId: "gpt-6.2-astra", reasoning: "medium" },
    requestedModelId: "gpt-4.1-mini",
    model: "gpt-6.2-astra",
    reasoning: "medium",
  },
  {
    stageModel: { modelId: "gpt-6.2-astra", reasoning: "high" },
    model: "gpt-6.2-astra",
    reasoning: "high",
  },
  { model: "gpt-6.2-astra", reasoning: "high" },
  {
    stageModel: { modelId: "gpt-5.4-mini-2026-03-17", reasoning: "high" },
    model: "gpt-5.4-mini-2026-03-17",
    reasoning: "high",
  },
  {
    requestedModelId: "gpt-4.1-mini",
    model: "gpt-4.1-mini",
    reasoning: undefined,
  },
] satisfies Array<{
  stageModel?: { modelId: string; reasoning?: "medium" | "high" };
  requestedModelId?: string;
  model: string;
  reasoning?: string;
}>)(
  "sends OpenAI model $model from persisted stage settings or the existing buyer selection",
  async ({ stageModel, requestedModelId, model, reasoning }) => {
    const env = jest.replaceProperty(process, "env", {
      ...process.env,
      OPEN_AI_API_KEY: "offline-stage-model-test",
    });
    try {
      const providers = new ProviderConnections(
        {
          findById: jest.fn().mockResolvedValue({ variant: "agent" }),
          module: {
            subjectsToEcommerceModuleStores: {
              find: jest.fn().mockResolvedValue([{ subjectId: "owner" }]),
            },
          },
        } as never,
        {} as never,
      );
      const request = await prepareStageReply("openai", false, {
        stageModel,
        requestedModelId,
        providers,
      });
      const post = jest
        .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
        .mockResolvedValue(
          Response.json({
            id: "offline-completion",
            usage: { prompt_tokens: 8, completion_tokens: 2 },
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    decision: {
                      kind: "clarify",
                      clarification: "Confirm the colors",
                    },
                  }),
                },
              },
            ],
          }),
        );
      await sendWork(request, "offline-stage-model-test", post);
      const [route, init] = post.mock.calls[0];
      expect(route).toBe("https://api.openai.com/v1/chat/completions");
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe(model);
      expect(body.response_format.type).toBe("json_schema");
      if (reasoning) {
        expect(body.reasoning_effort).toBe(reasoning);
      } else {
        expect(body).not.toHaveProperty("reasoning_effort");
      }
    } finally {
      env.restore();
    }
  },
);

it.each([
  {
    provider: "openai" as const,
    reply: "decision.reply",
    clarification: "decision.clarification",
  },
  {
    provider: "openrouter" as const,
    reply: "reply",
    clarification: "field clarification",
  },
])(
  "asks $provider to answer a catalog question alongside stage evidence",
  async ({ provider, reply, clarification }) => {
    const request = await prepareStageReply(provider, true);
    const [instructions, reference, question] = request.messages;

    expect(instructions.content).toContain(
      "direct questions about this product or service first",
    );
    expect(instructions.content).toContain(
      "even when the same customer message also supplies stage evidence",
    );
    expect(instructions.content).toContain(
      "Respect any explicit stage restrictions",
    );
    expect(instructions.content).toContain(
      "Use the evidence alone to decide whether the stage can advance",
    );
    expect(instructions.content).toContain(
      "Keep wholesale prices confidential",
    );
    expect(instructions.content).toContain(reply);
    expect(instructions.content).toContain(clarification);
    expect(question.content).toContain("What collection is this chair from?");
    expect(reference.content).toContain("Collection: Line A17");
    expect(request.actions?.map(({ id }) => id)).toEqual(["allowed"]);
  },
);

it("uses the ordinary evidence instructions when the stage has no permitted references", async () => {
  const request = await prepareStageReply("openai", false);

  expect(request.messages[0].content).not.toContain(
    "using the supplied Current references",
  );
  expect(request.messages[0].content).toContain(
    "Choose based on the current stage's evidence only",
  );
});
