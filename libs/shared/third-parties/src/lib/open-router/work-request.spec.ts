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
    { ...request, provider: "openai" },
    "runtime-sentinel",
    api.fetch,
  );
  expect(api.calls[0].url).toBe("https://api.openai.com/v1/chat/completions");
  expect(
    JSON.parse(String(api.calls[0].init?.body)).max_completion_tokens,
  ).toBe(64);
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
