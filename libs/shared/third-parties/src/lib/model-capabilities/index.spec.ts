import { providerModelFavoriteId } from "@sps/shared-utils";
import { providerModelReasoning } from ".";

it("identifies the same model across providers without merging separate snapshots or variants", () => {
  expect(providerModelFavoriteId("gpt-5.2")).toBe("openai/gpt-5.2");
  expect(providerModelFavoriteId("openai/gpt-5.2")).toBe("openai/gpt-5.2");
  expect(providerModelFavoriteId("gpt-5.2-2025-12-11")).toBe(
    "openai/gpt-5.2-2025-12-11",
  );
  expect(providerModelFavoriteId("openai/gpt-5.2:batch")).toBe(
    "openai/gpt-5.2:batch",
  );
  expect(providerModelFavoriteId("gpt-5.6")).toBe("openai/gpt-5.6-sol");
  expect(providerModelFavoriteId("gpt-4.1-mini-2025-04-14")).toBe(
    providerModelFavoriteId("openai/gpt-4.1-mini"),
  );
  expect(providerModelFavoriteId("gpt-image-2.5-flare-2026-09-08")).toBe(
    providerModelFavoriteId("openai/gpt-image-2.5-flare"),
  );
});

it("resolves documented direct OpenAI snapshots and rejects speculative IDs", async () => {
  await expect(
    providerModelReasoning("openai", "gpt-5.2-2025-12-11"),
  ).resolves.toEqual({
    defaultEffort: "none",
    defaultEnabled: false,
    mandatory: false,
    supportedEfforts: ["xhigh", "high", "medium", "low", "none"],
    supportsMaxTokens: false,
  });
  await expect(
    providerModelReasoning("openai", "gpt-6.1-sol"),
  ).resolves.toMatchObject({
    defaultEffort: "medium",
    mandatory: true,
    supportedEfforts: ["max", "xhigh", "high", "medium", "low"],
  });
  for (const modelId of [
    "gpt-5.2-2025-12-12",
    "gpt-5.2-pro",
    "gpt-4.1-mini-2025-04-14",
    "gpt-image-2.5-flare-2026-09-08",
  ]) {
    await expect(providerModelReasoning("openai", modelId)).resolves.toBeNull();
  }
});

it("uses advertised OpenRouter controls and shares a credential-free catalog request", async () => {
  const fetchModels = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      data: [
        {
          id: "openai/gpt-5.2",
          canonical_slug: "openai/gpt-5.2-2025-12-11",
          reasoning: {
            default_effort: "medium",
            mandatory: true,
            supported_efforts: ["medium", "low", "none", "unexpected"],
          },
        },
        { id: "test/token-budget", reasoning: { supports_max_tokens: true } },
        { id: "test/all-efforts", reasoning: { supported_efforts: null } },
        { id: "test/unavailable", supported_parameters: ["reasoning_effort"] },
      ],
    }),
  );

  try {
    const [snapshot, budget, all, unavailable, missing] = await Promise.all([
      providerModelReasoning("openrouter", "openai/gpt-5.2-2025-12-11"),
      providerModelReasoning("openrouter", "test/token-budget"),
      providerModelReasoning("openrouter", "test/all-efforts"),
      providerModelReasoning("openrouter", "test/unavailable"),
      providerModelReasoning("openrouter", "test/missing"),
    ]);

    expect(snapshot).toMatchObject({
      defaultEffort: "medium",
      mandatory: true,
      supportedEfforts: ["medium", "low"],
    });
    expect(budget).toMatchObject({
      supportedEfforts: [],
      supportsMaxTokens: true,
    });
    expect(all?.supportedEfforts).toEqual([
      "max",
      "xhigh",
      "high",
      "medium",
      "low",
      "minimal",
      "none",
    ]);
    expect(unavailable).toBeNull();
    expect(missing).toBeNull();
    expect(fetchModels).toHaveBeenCalledTimes(1);
    expect(fetchModels).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/models",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
  } finally {
    fetchModels.mockRestore();
  }
});
