import {
  sendWork,
  estimateWork,
  ProviderOutcomeUnknown,
  type IWorkRequest,
} from "./work-request";
const request: IWorkRequest = {
  provider: "openrouter",
  model: "test/chat",
  capability: "text",
  messages: [{ role: "user", content: "Привет" }],
  maxOutputTokens: 64,
  inputUsdPerMillion: "2",
  outputUsdPerMillion: "4",
};
function network(body: unknown, status = 200) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  return {
    calls,
    fetch: (async (input, init) => {
      calls.push({ url: String(input), init });
      return Response.json(body, { status });
    }) as typeof fetch,
  };
}
const usage = {
  prompt_tokens: 8,
  completion_tokens: 2,
  cost: 0.006,
  cost_details: { upstream_inference_cost: 5 },
};
const payload = {
  id: "generation-418",
  usage,
  choices: [{ message: { content: "Ответ" } }],
};
it.each(["openrouter", "openai"] as const)(
  "sends explicit reasoning effort in the %s chat format",
  async (provider) => {
    const api = network(payload);
    await sendWork(
      { ...request, provider, reasoning: "high" },
      "runtime-sentinel",
      api.fetch,
    );
    const body = JSON.parse(String(api.calls[0].init?.body));
    if (provider === "openrouter") {
      expect(body.reasoning).toEqual({ effort: "high" });
      expect(body).not.toHaveProperty("reasoning_effort");
    } else {
      expect(body.reasoning_effort).toBe("high");
      expect(body).not.toHaveProperty("reasoning");
    }
  },
);
it.each([
  { provider: "openrouter", capability: "text" },
  { provider: "openai", capability: "text" },
  { provider: "openrouter", capability: "decision", reasoning: "high" },
  { provider: "openai", capability: "compression", reasoning: "high" },
] as const)(
  "uses the provider's default for $provider $capability without an explicit reply effort",
  async (options) => {
    const api = network(payload);
    await sendWork({ ...request, ...options }, "runtime-sentinel", api.fetch);
    const body = JSON.parse(String(api.calls[0].init?.body));
    expect(body).not.toHaveProperty("reasoning");
    expect(body).not.toHaveProperty("reasoning_effort");
  },
);
it("returns only a scoped cart proposal and waits for buyer confirmation before a transition", async () => {
  const offerId = "7eb8b248-6354-4fb0-befe-3a4fd8904f96";
  const currencyId = "09a5d52e-b82a-4f72-a50b-804e6217a50d";
  const selection = { offerId, currencyId, quantity: 3 };
  const run = async (cartSelection: unknown) => {
    const api = network({
      ...payload,
      choices: [
        {
          message: {
            content: JSON.stringify({
              reply: "Подготовить корзину?",
              actionId: "next",
              cartSelection,
            }),
          },
        },
      ],
    });
    const result = await sendWork(
      {
        ...request,
        actions: [{ id: "next", instruction: "Continue" }],
        cartOffers: [{ offerId, prices: [{ currencyId }] }],
      },
      "runtime-sentinel",
      api.fetch,
    );
    expect(
      JSON.parse(String(api.calls[0].init?.body)).response_format.type,
    ).toBe("json_object");
    return result;
  };
  expect((await run(selection)).cartSelection).toEqual(selection);
  for (const invalid of [
    { ...selection, currencyId: offerId },
    { ...selection, offerId: currencyId },
    { ...selection, quantity: 0 },
  ]) {
    const result = await run(invalid);
    expect(result.cartSelection).toBeUndefined();
    expect(result.actionId).toBeUndefined();
  }
  expect((await run(selection)).actionId).toBeUndefined();
  expect((await run(null)).actionId).toBe("next");
});
it("uses the selected OpenRouter key, caps generation and records billed credits", async () => {
  const api = network(payload);
  const work = await sendWork(request, "runtime-sentinel", api.fetch);
  expect(api.calls).toHaveLength(1);
  expect(new Headers(api.calls[0].init?.headers).get("Authorization")).toBe(
    "Bearer runtime-sentinel",
  );
  expect(JSON.parse(String(api.calls[0].init?.body))).toMatchObject({
    max_tokens: 64,
    provider: {
      allow_fallbacks: false,
      max_price: { prompt: 2, completion: 4 },
    },
  });
  expect(work.usage).toMatchObject({ usd: "0.006", basis: "provider" });
});
it("records the OpenAI estimate against its own price snapshot", async () => {
  const api = network(payload);
  const result = await sendWork(
    { ...request, provider: "openai", clientRequestId: "attempt-418" },
    "runtime-sentinel",
    api.fetch,
  );
  expect(api.calls[0].url).toBe("https://api.openai.com/v1/chat/completions");
  expect(
    new Headers(api.calls[0].init?.headers).get("X-Client-Request-Id"),
  ).toBe("attempt-418");
  expect(JSON.parse(String(api.calls[0].init?.body))).toMatchObject({
    max_completion_tokens: 64,
    service_tier: "default",
    store: false,
  });
  expect(result.usage).toEqual({
    usd: "0.000024",
    inputTokens: 8,
    outputTokens: 2,
    basis: "rate-card",
  });
  expect(estimateWork(request).input).toBeGreaterThanOrEqual(
    Buffer.byteLength("Привет"),
  );
});
it("uses a current-stage clarification when the model did not apply a transition", async () => {
  const run = async (actionId: string | null, clarification?: string) => {
    const api = network({
      ...payload,
      choices: [
        {
          message: {
            content: JSON.stringify({
              reply: "Please upload the brand font.",
              actionId,
              clarification,
            }),
          },
        },
      ],
    });
    return sendWork(
      {
        ...request,
        actions: [{ id: "next", instruction: "Colors were supplied" }],
        stageClarification:
          "Please clarify the missing details for the colors stage.",
      },
      "runtime-sentinel",
      api.fetch,
    );
  };
  await expect(run(null)).resolves.toMatchObject({
    text: "Please clarify the missing details for the colors stage.",
    actionId: undefined,
  });
  await expect(run(null, "What is the accent color?")).resolves.toMatchObject({
    text: "What is the accent color?",
    actionId: undefined,
  });
  await expect(run("next", "")).resolves.toMatchObject({
    text: "Please upload the brand font.",
    actionId: "next",
  });
});
it("constrains an OpenAI stage decision to the published action or a clarification", async () => {
  const run = async (decision: object) => {
    const api = network({
      ...payload,
      choices: [{ message: { content: JSON.stringify({ decision }) } }],
    });
    const work = await sendWork(
      {
        ...request,
        provider: "openai",
        model: "gpt-4.1-mini-2025-04-14",
        actions: [
          { id: "ready", instruction: "One coherent image size was supplied" },
        ],
        stageClarification: "What size should the image be?",
        stageAccepted: "Details received.",
      },
      "runtime-sentinel",
      api.fetch,
    );
    const format = JSON.parse(String(api.calls[0].init?.body)).response_format;
    expect(format.type).toBe("json_schema");
    expect(format.json_schema.strict).toBe(true);
    expect(
      format.json_schema.schema.properties.decision.anyOf[0].properties.actionId
        .enum,
    ).toEqual(["ready"]);
    return work;
  };
  await expect(
    run({ kind: "advance", actionId: "ready", reply: "" }),
  ).resolves.toMatchObject({
    text: "Details received.",
    actionId: "ready",
  });
  await expect(
    run({ kind: "clarify", clarification: "One size or aspect ratio?" }),
  ).resolves.toMatchObject({
    text: "One size or aspect ratio?",
    actionId: undefined,
  });
  await expect(
    run({
      kind: "advance",
      actionId: "unpublished",
      reply: "Please generate now.",
    }),
  ).resolves.toMatchObject({
    text: "What size should the image be?",
    actionId: undefined,
  });
});
it("retains evidence of an unknown generation and never retries it", async () => {
  const api = network(
    { id: "provider-ref", error: { message: "unavailable" } },
    502,
  );
  await expect(
    sendWork(request, "runtime-sentinel", api.fetch),
  ).rejects.toMatchObject({ requestId: "provider-ref" });
  expect(api.calls).toHaveLength(1);
  const incomplete = network({
    ...payload,
    usage: { prompt_tokens: 8, completion_tokens: 2 },
  });
  await expect(
    sendWork(request, "runtime-sentinel", incomplete.fetch),
  ).rejects.toBeInstanceOf(ProviderOutcomeUnknown);
});
