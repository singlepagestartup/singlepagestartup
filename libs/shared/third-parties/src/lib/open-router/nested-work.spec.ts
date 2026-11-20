import {
  estimateNestedWork,
  sendNestedWork,
  type IEmbeddingWork,
} from "./nested-work";

const native = {
  provider: "openai" as const,
  model: "text-embedding-3-small",
  maxOutputTokens: 128,
  inputUsdPerMillion: "2",
  outputUsdPerMillion: "4",
};

it.each(["openrouter", "openai"] as const)(
  "uses the %s key once and records fixed-size embedding usage",
  async (provider) => {
    const router = provider === "openrouter";
    const request: IEmbeddingWork = {
      ...native,
      provider,
      model: router ? "openai/text-embedding-3-small" : native.model,
      capability: "embedding",
      inputs: ["scope phrase"],
      dimensions: 768,
    };
    const vector = Array<number>(768).fill(0.25);
    const network = jest.fn(async () =>
      Response.json(
        {
          ...(router ? { id: "gen-fixture" } : {}),
          data: [{ index: 0, embedding: vector }],
          usage: { prompt_tokens: 15, ...(router ? { cost: 0.002 } : {}) },
        },
        { headers: { "x-request-id": "req-fixture" } },
      ),
    );
    const result = await sendNestedWork(request, "scoped-fixture-key", network);
    expect(network).toHaveBeenCalledTimes(1);
    const [url, init] = (
      network.mock.calls as unknown as [string, RequestInit][]
    )[0];
    expect(url).toBe(
      router
        ? "https://openrouter.ai/api/v1/embeddings"
        : "https://api.openai.com/v1/embeddings",
    );
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer scoped-fixture-key",
    );
    expect(JSON.parse(String(init.body))).toMatchObject({
      input: ["scope phrase"],
      dimensions: 768,
      encoding_format: "float",
    });
    expect(String(init.body)).not.toContain("scoped-fixture-key");
    expect(result).toEqual({
      providerRequestId: router ? "gen-fixture" : "req-fixture",
      text: "",
      usage: {
        inputTokens: 15,
        outputTokens: 0,
        usd: router ? "0.002" : "0.00003",
        basis: router ? "provider" : "rate-card",
      },
      embeddings: { dimensions: 768, values: [vector] },
    });
  },
);

it("rejects an incompatible model or vector shape before contacting its provider", async () => {
  const network = jest.fn();
  const input = {
    ...native,
    capability: "embedding",
    inputs: ["one"],
    dimensions: 768,
  } as const;
  const request = { ...input, inputs: [...input.inputs] };
  await expect(
    sendNestedWork({ ...request, model: "gpt-4.1-mini" }, "test-key", network),
  ).rejects.toThrow("does not support");
  await expect(
    sendNestedWork({ ...request, dimensions: 128 }, "test-key", network),
  ).rejects.toThrow("dimensions");
  expect(network).not.toHaveBeenCalled();
});

it("keeps the billed usage when a provider returns the wrong vector dimensionality", async () => {
  const network = jest.fn(async () =>
    Response.json(
      {
        data: [{ index: 0, embedding: [0.5] }],
        usage: { prompt_tokens: 10 },
      },
      { headers: { "x-request-id": "embedding-request" } },
    ),
  );
  const result = await sendNestedWork(
    {
      ...native,
      capability: "embedding",
      inputs: ["search"],
      dimensions: 768,
    },
    "test-key",
    network,
  );
  expect(result.embeddings).toBeUndefined();
  expect(result.usage).toMatchObject({ inputTokens: 10, usd: "0.00002" });
});

it("sends normalized image bytes directly and forbids automatic provider fallback", async () => {
  const network = jest.fn(async () =>
    Response.json({
      id: "vision-generation",
      choices: [{ message: { content: "A blue cap" } }],
      usage: { prompt_tokens: 50, completion_tokens: 3, cost: 0.01 },
    }),
  );
  const result = await sendNestedWork(
    {
      ...native,
      provider: "openrouter",
      model: "openai/gpt-4.1-mini",
      capability: "vision",
      prompt: "Describe the cap",
      image: new Uint8Array([1, 2, 3]),
    },
    "test-vision-key",
    network,
  );
  const [, init] = (
    network.mock.calls as unknown as [string, RequestInit][]
  )[0];
  expect(JSON.parse(String(init.body))).toMatchObject({
    provider: { allow_fallbacks: false, require_parameters: true },
    messages: [
      {
        content: [
          { type: "text", text: "Describe the cap" },
          {
            type: "image_url",
            image_url: { detail: "low", url: "data:image/jpeg;base64,AQID" },
          },
        ],
      },
    ],
  });
  expect(result.text).toBe("A blue cap");
});

it("transcribes bounded OpenAI audio and marks the charge as an estimate", async () => {
  const network = jest.fn(async () =>
    Response.json(
      {
        text: "Ask about a battery",
        usage: { type: "tokens", input_tokens: 22, output_tokens: 6 },
      },
      { headers: { "x-request-id": "transcript-request" } },
    ),
  );
  const request = {
    ...native,
    capability: "transcription" as const,
    model: "gpt-transcribe",
    audio: new Uint8Array([2, 8, 3]),
    seconds: 2,
    maxOutputTokens: 1024,
  };
  expect(estimateNestedWork(request).input).toBeGreaterThan(22);
  const result = await sendNestedWork(request, "test-audio-key", network);
  const [url, init] = (
    network.mock.calls as unknown as [string, RequestInit][]
  )[0];
  expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
  const form = init.body as FormData;
  expect(form.get("model")).toBe("gpt-transcribe");
  expect(form.get("file")).toBeInstanceOf(Blob);
  expect(result).toMatchObject({
    providerRequestId: "transcript-request",
    text: "Ask about a battery",
    usage: { usd: "0.00015", audioSeconds: "2", basis: "rate-card" },
  });
  await expect(
    sendNestedWork({ ...request, seconds: 21 }, "test-audio-key", network),
  ).rejects.toThrow("bounded WAV");
  expect(network).toHaveBeenCalledTimes(1);
});
