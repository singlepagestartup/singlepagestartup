import { Service } from "./index";

async function prepareStageReply(
  provider: "openai" | "openrouter",
  hasKnowledge: boolean,
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
    openingKey: "customer-work",
  };
  const stage = {
    id: "colors",
    name: "Colors",
    instruction:
      "Record the product colors. Keep wholesale prices confidential.",
    actions: [
      {
        id: "allowed",
        actors: ["ai"],
        evidence: ["model-result"],
        nextStageId: "font",
      },
      {
        id: "manager-only",
        actors: ["manager"],
        evidence: ["model-result"],
        nextStageId: "font",
      },
    ],
  };
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
        providerConnections: {
          resolve: jest.fn().mockResolvedValue(binding),
          credential: jest.fn().mockResolvedValue("test-credential"),
        },
        workLedger: { reserve: jest.fn(), changeProviderWork: jest.fn() },
      },
    },
  } as never);
  const result = await service["prepare"](input);
  const request = result.outgoing?.request;
  if (request?.capability !== "text") {
    throw new Error("Expected a text stage reply");
  }
  return request;
}

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
