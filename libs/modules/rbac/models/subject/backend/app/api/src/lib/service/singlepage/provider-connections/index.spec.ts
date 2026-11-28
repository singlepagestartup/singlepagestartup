import { ProviderConnections } from ".";

interface IFind {
  params: {
    filters: { and: { column: string; method: string; value: unknown }[] };
  };
}

const filter = ({ params }: IFind, column: string) =>
  params.filters.and.find((entry) => entry.column === column)?.value;

const previousKey = process.env.OPEN_AI_API_KEY;

beforeAll(() => {
  process.env.OPEN_AI_API_KEY = "offline-provider-unit-key";
});

afterAll(() => {
  if (previousKey === undefined) {
    delete process.env.OPEN_AI_API_KEY;
  } else {
    process.env.OPEN_AI_API_KEY = previousKey;
  }
});

it.each(["store", "customer", "employee", "fixed-model"])(
  "lists assigned models with shared favorite identities and actual capabilities for a %s-funded stage",
  async (payer) => {
    const model = "gpt-5.2-2025-12-11";
    const routerModel = `openai/${model}`;
    const terms = {
      maxInputTokens: 1024,
      maxOutputTokens: 128,
      maxCostUsd: "0.5",
      inputUsdPerMillion: "2",
      outputUsdPerMillion: "4",
      usdPerSps: "0.01",
      workMultiplier: "1",
      version: "v1",
    };
    const catalog = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        data: [
          {
            id: "openai/gpt-5.2",
            canonical_slug: routerModel,
            reasoning: { supported_efforts: ["high", "none"] },
          },
        ],
      }),
    );
    const vault = { read: jest.fn() };
    const scopeForChat = jest.fn().mockResolvedValue({
      actorProfileId: "profile",
      storeId: "store",
      subjectId: "agent",
    });
    const taskLinks = jest.fn().mockResolvedValue({ crmModuleTaskId: "task" });
    const service = new ProviderConnections(
      {
        findById: jest.fn().mockResolvedValue({ variant: "agent" }),
        crmWorkspace: { employees: { scopeForChat } },
        customerWork: {
          workFunding: async () => ({
            payer: payer === "customer" ? "customer" : "store-owner",
          }),
        },
        module: {
          subjectsToEcommerceModuleStores: {
            find: jest.fn().mockResolvedValue([{ id: "grant" }]),
          },
          subjectsToSocialModuleProfiles: {
            find: jest.fn().mockResolvedValue([{ id: "profile-link" }]),
          },
          subjectsToIdentities: {
            providerAssignments: jest.fn(
              async (_store: string, query: { subjectId: string | null }) => {
                const personal = query.subjectId;
                return [
                  {
                    identityId: personal ? "direct" : "routed",
                    executorId: "executor",
                    model: personal ? model : routerModel,
                    terms,
                  },
                ];
              },
            ),
            providerConnections: jest.fn(
              async (_store: string, query: { identityId: string }) => [
                {
                  identityId: query.identityId,
                  ownerId: "owner",
                },
              ],
            ),
          },
          identity: {
            outboundProvider: jest.fn(async (id: string) => ({
              usage: "outbound_api",
              provider: id === "direct" ? "openai" : "openrouter",
            })),
          },
        },
        modules: {
          social: {
            chat: {
              findById: jest.fn().mockResolvedValue({
                variant:
                  payer === "employee" ? "store-employee" : "customer-work",
              }),
            },
            profilesToChats: {
              find: jest.fn().mockResolvedValue([{ id: "member" }]),
            },
            chatsToThreads: {
              find: jest.fn().mockResolvedValue([{ threadId: "thread" }]),
            },
            chatsToCrmModuleTasks: {
              forThread: taskLinks,
            },
          },
          crm: {
            task: {
              findById: jest.fn().mockResolvedValue({
                id: "task",
                storeId: "store",
                customerId: "buyer",
                status: "active",
                assigneeKind: "ai",
                assigneeId: "agent",
                stageId: "stage",
              }),
              getFunnel: jest.fn().mockResolvedValue({
                definition: {
                  stages: [
                    {
                      id: "stage",
                      output: "text",
                      ...(payer === "fixed-model" && {
                        provider: {
                          modelId: "gpt-6.2-astra",
                          reasoning: "medium",
                        },
                      }),
                    },
                  ],
                  workFunding: {
                    payer: payer === "customer" ? "customer" : "store-owner",
                  },
                },
              }),
            },
          },
        },
      } as never,
      vault as never,
    );

    try {
      const { groups, stageModelFixed, stageModelId, stageModelReasoning } =
        await service.chatModels("buyer", "profile", "chat", "thread");
      if (payer === "fixed-model") {
        expect(stageModelFixed).toBe(true);
        expect(stageModelId).toBe("gpt-6.2-astra");
        expect(stageModelReasoning).toBe("medium");
        expect(groups).toEqual([]);
        expect(vault.read).not.toHaveBeenCalled();
        return;
      }
      expect(stageModelFixed).toBeUndefined();
      const [group] = groups;
      expect(group.id).toBe("text");
      const expected = payer === "customer" ? model : "gpt-6.2-astra";
      expect(group.models[0]).toMatchObject({
        id: expected,
        supportsReasoning: true,
        reasoning: {
          supportedEfforts:
            payer === "customer"
              ? ["xhigh", "high", "medium", "low", "none"]
              : ["medium", "high"],
        },
      });
      if (payer === "customer") {
        expect(group.models.map(({ id }) => id)).toEqual([model]);
      } else {
        expect(group.models.map(({ id }) => id)).toEqual([
          "gpt-6.2-astra",
          "gpt-5.4-mini-2026-03-17",
          "gpt-4.1-mini",
        ]);
      }
      if (payer === "employee") {
        expect(taskLinks).not.toHaveBeenCalled();
        expect(scopeForChat).toHaveBeenCalledWith(
          "buyer",
          expect.objectContaining({ variant: "store-employee" }),
          "thread",
        );
        await expect(
          service.chatModels("buyer", "other-profile", "chat", "thread"),
        ).rejects.toThrow("outside this employee conversation");
      }
      expect(vault.read).not.toHaveBeenCalled();
      if (payer !== "customer") {
        expect(catalog).not.toHaveBeenCalled();
      }
    } finally {
      catalog.mockRestore();
    }
  },
);

it("requires an explicit payer when owner grants are ambiguous and rejects a revoked payer", async () => {
  const owners = new Set(["owner-a", "owner-b"]);
  const find = jest.fn(async (query: IFind) => {
    if (filter(query, "variant") !== "owner") {
      return [{ subjectId: "worker" }];
    }
    const subjectId = filter(query, "subjectId");
    return [...owners]
      .filter((id) => !subjectId || id === subjectId)
      .map((id) => ({ subjectId: id }));
  });
  const vault = { read: jest.fn() };
  const service = new ProviderConnections(
    {
      findById: jest.fn().mockResolvedValue({ variant: "agent" }),
      module: { subjectsToEcommerceModuleStores: { find } },
    } as never,
    vault as never,
  );
  await expect(
    service.resolveWork("store", "worker", "text", {
      payer: "store-owner",
    }),
  ).rejects.toThrow("Select the store owner");
  const scope = { payer: "store-owner" as const, preferredOwnerId: "owner-b" };
  await expect(
    service.resolveWork("store", "worker", "text", scope),
  ).resolves.toMatchObject({
    mode: "server",
    ownerId: "owner-b",
    provider: "openai",
    model: "gpt-6.2-astra",
    reasoning: "high",
    terms: {
      inputUsdPerMillion: "8",
      cachedInputUsdPerMillion: "0.40",
      outputUsdPerMillion: "40",
    },
  });
  const { terms } = await service.resolveWork("store", "worker", "text", scope);
  const topup = {
    topupProductId: "pack",
    topupUsd: "3",
    topupTokens: "1000",
    usdPerSps: "0.003",
    workMultiplier: "1.5",
  };
  const quotes = service.selectableServerRates("text", { ...terms, ...topup });
  expect(quotes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        model: "gpt-5.4-mini-2026-03-17",
        cachedInputUsdPerMillion: "0.075",
      }),
      expect.objectContaining({
        model: "gpt-4.1-mini",
        cachedInputUsdPerMillion: "0.10",
      }),
    ]),
  );
  for (const { model, capability, provider, ...quoted } of quotes) {
    const actual = await service.resolveWork(
      "store",
      "worker",
      capability,
      scope,
      {
        provider,
        modelId: model,
      },
    );
    expect(quoted).toEqual({ ...actual.terms, ...topup });
  }
  await expect(
    service.resolveWork("store", "worker", "text", scope, {
      modelId: "gpt-6.2-astra",
      reasoning: "low",
    }),
  ).rejects.toThrow("reasoning effort is unavailable");
  owners.delete("owner-b");
  await expect(
    service.resolveWork("store", "worker", "text", scope),
  ).rejects.toThrow("Store ownership required");
  expect(vault.read).not.toHaveBeenCalled();
});

it.each(["assistant", "crm-agent"])(
  "resolves the chosen stage model for a store %s and rejects unavailable selections before reading credentials",
  async (grant) => {
    const terms = {
      maxInputTokens: 1000,
      maxOutputTokens: 128,
      maxCostUsd: "0.5",
      inputUsdPerMillion: "2",
      outputUsdPerMillion: "4",
      usdPerSps: "0.01",
      workMultiplier: "1",
      version: "v1",
    };
    const personal = {
      identityId: "personal-key",
      executorId: "personal-subject",
      model: "gpt-4.1-mini",
      terms,
    };
    const fallback = {
      identityId: "store-key",
      executorId: "store-provider-subject",
      model: "gpt-5.2",
      terms,
    };
    const module = {
      subjectsToEcommerceModuleStores: {
        find: jest.fn(async (query: IFind) => {
          expect(filter(query, "ecommerceModuleStoreId")).toBe("store");
          const variants = filter(query, "variant");
          if (variants === "owner") {
            expect(filter(query, "subjectId")).toBe("owner");
            return [{ variant: "owner" }];
          }
          expect(filter(query, "subjectId")).toBe("agent");
          return Array.isArray(variants) && variants.includes(grant)
            ? [{ variant: grant }]
            : [];
        }),
      },
      subjectsToIdentities: {
        providerAssignments: jest.fn(
          async (
            _store: string,
            query: { capability: string; subjectId: string | null },
          ) => {
            if (query.capability !== "text") {
              return [];
            }
            return query.subjectId ? [personal] : [fallback];
          },
        ),
        providerConnections: jest.fn(
          async (
            _store: string,
            query: { identityId: string; subjectId: string },
          ) => [
            {
              id: query.identityId,
              identityId: query.identityId,
              subjectId: query.subjectId,
              ownerId: "owner",
              version: "rotated-version",
            },
          ],
        ),
      },
      identity: {
        outboundProvider: jest
          .fn()
          .mockResolvedValue({ usage: "outbound_api", provider: "openai" }),
      },
    };
    const vault = { read: jest.fn().mockResolvedValue("private-key") };
    const service = new ProviderConnections(
      {
        module,
        findById: jest.fn().mockResolvedValue({ variant: "agent" }),
      } as never,
      vault as never,
    );
    const dispatch = ["store", "agent", "text"] as const;
    await expect(
      service.resolve(...dispatch, { modelId: "auto" }),
    ).resolves.toMatchObject({
      model: personal.model,
      identityId: personal.identityId,
    });
    const selection = { modelId: fallback.model, reasoning: "high" } as const;
    const binding = await service.resolve(...dispatch, selection);
    expect(binding).toMatchObject({
      model: fallback.model,
      identityId: fallback.identityId,
    });
    await expect(
      service.resolveWork(...dispatch, { payer: "customer" }, selection),
    ).rejects.toThrow("unavailable for this stage");
    const workBinding = await service.resolveWork(
      ...dispatch,
      { payer: "customer", stage: { output: "chat", provider: selection } },
      selection,
    );
    expect(workBinding).toMatchObject({
      model: fallback.model,
      identityId: fallback.identityId,
      reasoning: "high",
    });
    await expect(
      service.resolve(...dispatch, { ...selection, defaultOnly: true }),
    ).rejects.toThrow("unavailable for this stage");
    await expect(
      service.resolve("store", "agent", "image", { modelId: fallback.model }),
    ).rejects.toThrow("unavailable for this stage");
    await expect(
      service.resolve("store", "agent", "image", selection),
    ).rejects.toThrow("Reasoning effort requires a selected text model");
    await expect(
      service.resolve(...dispatch, { modelId: "auto", reasoning: "high" }),
    ).rejects.toThrow("Reasoning effort requires a selected text model");
    await expect(
      service.resolve(...dispatch, {
        modelId: personal.model,
        reasoning: "high",
      }),
    ).rejects.toThrow("reasoning effort is unavailable for this model");
    await expect(
      service.credential(...dispatch, binding, {
        ...selection,
        reasoning: "max",
      }),
    ).rejects.toThrow("reasoning effort is unavailable for this model");
    await expect(
      service.credential(
        ...dispatch,
        { ...binding, version: "revoked-version" },
        selection,
      ),
    ).rejects.toThrow("credential changed");
    expect(vault.read).not.toHaveBeenCalled();
    await expect(
      service.credential(...dispatch, binding, selection),
    ).resolves.toBe("private-key");
    await expect(
      service.workCredential(...dispatch, workBinding, selection),
    ).resolves.toBe("private-key");
    expect(vault.read).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "store",
        identityId: fallback.identityId,
        version: "rotated-version",
      }),
    );
  },
);

it("lists each eligible agent for the owner and denies ineligible subjects before looking up provider assignments", async () => {
  const storeId = "store";
  const agent = { id: "agent", slug: "store-agent", variant: "agent" };
  const assistant = {
    id: "assistant",
    slug: "personal-assistant",
    variant: "agent",
  };
  const manager = { id: "manager", variant: "default" };
  const foreign = { id: "foreign", variant: "agent" };
  const human = { id: "human", variant: "default" };
  const subjects = [agent, assistant, manager, foreign, human];
  const grants = [
    { subjectId: "owner", storeId, variant: "owner" },
    { subjectId: manager.id, storeId, variant: "crm-manager" },
    { subjectId: agent.id, storeId, variant: "crm-agent" },
    { subjectId: agent.id, storeId, variant: "assistant" },
    { subjectId: assistant.id, storeId, variant: "assistant" },
    { subjectId: human.id, storeId, variant: "crm-agent" },
    { subjectId: foreign.id, storeId: "another-store", variant: "crm-agent" },
  ];
  const assignments = jest.fn().mockResolvedValue([]);
  const connections = jest.fn().mockResolvedValue([]);
  const employeeName = "Редактор каталога";
  const profile = { id: "employee-profile", adminTitle: employeeName };
  const agentProfile = jest.fn(async (id: string) =>
    id === agent.id ? profile : undefined,
  );
  const vault = { read: jest.fn() };
  const service = new ProviderConnections(
    {
      crmWorkspace: {
        employees: {
          agentProfile,
          name: (profile: { adminTitle: string }) => profile.adminTitle,
        },
      },
      module: {
        subjectsToEcommerceModuleStores: {
          find: jest.fn(async (query: IFind) => {
            const store = filter(query, "ecommerceModuleStoreId");
            const subject = filter(query, "subjectId");
            const variants = filter(query, "variant");
            return grants.filter(
              (grant) =>
                grant.storeId === store &&
                (!subject || grant.subjectId === subject) &&
                (Array.isArray(variants)
                  ? variants.includes(grant.variant)
                  : variants === grant.variant),
            );
          }),
        },
        subjectsToIdentities: {
          providerAssignments: assignments,
          providerConnections: connections,
        },
      },
      modules: {
        billing: {
          transaction: {
            history: jest
              .fn()
              .mockResolvedValue({ items: [], nextCursor: null }),
          },
        },
      },
      findById: jest.fn(async ({ id }: { id: string }) =>
        subjects.find((subject) => subject.id === id),
      ),
    } as never,
    vault as never,
  );
  await expect(service.list(manager.id, storeId)).rejects.toThrow(
    "Store ownership required",
  );
  expect(connections).not.toHaveBeenCalled();
  for (const { id } of [manager, foreign, human]) {
    await expect(service.resolve(storeId, id, "text")).rejects.toThrow(
      "does not belong to the store",
    );
  }
  expect(assignments).not.toHaveBeenCalled();
  expect(vault.read).not.toHaveBeenCalled();
  const settings = await service.list("owner", storeId);
  expect(settings.assistants).toEqual([
    { id: agent.id, label: employeeName },
    { id: assistant.id, label: assistant.slug },
  ]);
  expect(agentProfile.mock.calls).toEqual([[agent.id], [assistant.id]]);
});
