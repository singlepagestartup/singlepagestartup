import {
  sendWork,
  supportsWorkReplyImage,
  estimateWork,
  estimateWorkWithFiles,
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

it.each(["openai", "openrouter"] as const)(
  "uses native tools with a separately billed %s completion",
  async (provider) => {
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "inventory",
          description: "Read stock",
          parameters: { type: "object", properties: {} },
        },
      },
    ];
    const call = {
      id: "one",
      type: "function",
      function: { name: "inventory", arguments: "{}" },
    };
    const api = network(
      provider === "openai"
        ? {
            id: "resp_1",
            status: "completed",
            output: [
              {
                id: "rs_1",
                type: "reasoning",
                encrypted_content: "opaque",
                summary: [],
              },
              {
                id: "fc_1",
                type: "function_call",
                call_id: "one",
                name: "inventory",
                arguments: "{}",
              },
            ],
            usage: {
              input_tokens: 8,
              output_tokens: 2,
              input_tokens_details: { cached_tokens: 4 },
            },
          }
        : {
            ...payload,
            choices: [{ message: { tool_calls: [call] } }],
          },
    );
    const withTools = {
      ...request,
      provider,
      reasoning: "high" as const,
      tools,
      stageClarification: "What next?",
      actions: [{ id: "next", instruction: "Advance" }],
    };
    expect(estimateWork(withTools).input).toBeGreaterThan(
      estimateWork(request).input,
    );
    const issued = await sendWork(withTools, "runtime-sentinel", api.fetch);
    expect(issued.toolCalls).toEqual([call]);
    expect(issued.usage.inputTokens).toBe(8);
    const body = JSON.parse(String(api.calls[0].init?.body));
    expect(body).toMatchObject({
      tools:
        provider === "openai"
          ? [{ type: "function", ...tools[0].function, strict: false }]
          : tools,
      tool_choice: "auto",
      parallel_tool_calls: false,
    });
    expect(body).not.toHaveProperty("response_format");
    if (provider === "openai") {
      expect(api.calls[0].url).toBe("https://api.openai.com/v1/responses");
      expect(body).toMatchObject({
        store: false,
        reasoning: { effort: "high" },
        include: ["reasoning.encrypted_content"],
      });
      const next = network({
        id: "resp_2",
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  decision: {
                    kind: "advance",
                    actionId: "next",
                    reply: "In stock",
                  },
                }),
              },
            ],
          },
        ],
        usage: {
          input_tokens: 20,
          input_tokens_details: { cached_tokens: 5 },
          output_tokens: 4,
        },
      });
      const final = await sendWork(
        {
          ...withTools,
          model: "gpt-6.2-astra",
          tools: undefined,
          cachedInputUsdPerMillion: "1",
          toolHistory: [
            { role: "assistant", content: "", tool_calls: issued.toolCalls },
            { role: "tool", tool_call_id: "one", content: "12 items" },
          ],
          responseStates: { one: issued.responseState! },
        },
        "runtime-sentinel",
        next.fetch,
      );
      const nextBody = JSON.parse(String(next.calls[0].init?.body));
      expect(nextBody).toMatchObject({
        text: {
          format: {
            type: "json_schema",
            strict: true,
            name: "crm_stage_decision",
          },
        },
        reasoning: { effort: "high" },
      });
      expect(nextBody.input.slice(-3)).toEqual([
        {
          type: "reasoning",
          id: "rs_1",
          encrypted_content: "opaque",
          summary: [],
        },
        {
          type: "function_call",
          id: "fc_1",
          call_id: "one",
          name: "inventory",
          arguments: "{}",
        },
        { type: "function_call_output", call_id: "one", output: "12 items" },
      ]);
      expect(nextBody).not.toHaveProperty("tools");
      expect(final).toMatchObject({
        text: "In stock",
        actionId: "next",
        usage: { inputTokens: 20, outputTokens: 4, usd: "0.000051" },
      });
    }
  },
);
it("bills cached Astra input at the cached rate and reasoning tokens within completion usage", async () => {
  const api = network({
    ...payload,
    usage: {
      prompt_tokens: 3000,
      prompt_tokens_details: { cached_tokens: 2000, cache_write_tokens: 500 },
      completion_tokens: 500,
    },
  });
  const result = await sendWork(
    {
      ...request,
      provider: "openai",
      model: "gpt-6.2-astra",
      inputUsdPerMillion: "8",
      cachedInputUsdPerMillion: "0.40",
      cacheWriteUsdPerMillion: "10",
      outputUsdPerMillion: "40",
    },
    "runtime-sentinel",
    api.fetch,
  );
  expect(Number(result.usage.usd)).toBe(0.0298);
});
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

it("reserves the low-detail image input and rejects unsupported models before transmission", async () => {
  const withImage: IWorkRequest = {
    ...request,
    provider: "openai",
    model: "gpt-6.2-astra",
    replyImage: Uint8Array.of(0xff, 0xd8, 0xff),
  };
  const plain = estimateWork({ ...withImage, replyImage: undefined });
  expect(estimateWork(withImage).input - plain.input).toBe(4096);
  expect(estimateWork(withImage).usd.gt(plain.usd)).toBe(true);
  expect(
    supportsWorkReplyImage({
      ...withImage,
      provider: "openrouter",
      model: "openai/gpt-4.1-mini",
    }),
  ).toBe(true);
  const api = network(payload);
  const unsupported = { ...withImage, model: "text-only" };
  expect(supportsWorkReplyImage(unsupported)).toBe(false);
  await expect(sendWork(unsupported, "test", api.fetch)).rejects.toThrow(
    "Invalid text reply image",
  );
  expect(api.calls).toHaveLength(0);
});

const imageData =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAH+XbeQAAAAASUVORK5CYII=";
const uploads = [
  {
    name: "photo.png",
    mimeType: "image/png",
    bytes: Uint8Array.from(Buffer.from(imageData, "base64")),
  },
  {
    name: "terms.pdf",
    mimeType: "application/pdf",
    bytes: Uint8Array.of(3, 4),
  },
  {
    name: "notes.TXT",
    mimeType: "application/octet-stream",
    bytes: new TextEncoder().encode("Клиент"),
  },
];
const bounded = { maxCostUsd: "1.5", maxInputTokens: 10000 };

it.each(["text", "decision"] as const)(
  "sends all original inputs in a single OpenAI Responses %s request and bills returned usage",
  async (capability) => {
    const api = network({
      id: "resp-uploads",
      status: "completed",
      output: [
        { type: "message", content: [{ type: "output_text", text: "ready" }] },
      ],
      usage: { input_tokens: 2000, output_tokens: 100 },
    });
    const withFiles = {
      ...request,
      ...bounded,
      provider: "openai" as const,
      model: "gpt-4.1-mini",
      capability,
      inputFiles: uploads,
    };
    const count = network({
      object: "response.input_tokens",
      input_tokens: 2000,
    });
    const reserve = await estimateWorkWithFiles(withFiles, "key", count.fetch);
    expect(reserve.input).toBe(2000);
    expect(reserve.usd.toFixed()).toBe("0.004256");
    expect(count.calls).toHaveLength(1);
    expect(count.calls[0].url).toBe(
      "https://api.openai.com/v1/responses/input_tokens",
    );
    const result = await sendWork(withFiles, "key", api.fetch);
    expect(api.calls).toHaveLength(1);
    expect(api.calls[0].url).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(String(api.calls[0].init?.body));
    expect(JSON.parse(String(count.calls[0].init?.body)).input).toEqual(
      body.input,
    );
    expect(body.input[0].content).toEqual([
      { type: "input_text", text: "Привет" },
      {
        type: "input_image",
        detail: "auto",
        image_url: "data:image/png;base64," + imageData,
      },
      {
        type: "input_file",
        filename: "terms.pdf",
        file_data: "data:application/pdf;base64,AwQ=",
      },
      {
        type: "input_file",
        filename: "notes.TXT",
        file_data:
          "data:text/plain;base64," + Buffer.from("Клиент").toString("base64"),
      },
    ]);
    expect(result.usage).toEqual({
      inputTokens: 2000,
      outputTokens: 100,
      usd: "0.0044",
      basis: "rate-card",
    });
  },
);

it("sends native OpenRouter files, audio and video to the selected model without an OCR fallback", async () => {
  const api = network(payload);
  const inputFiles = [
    ...uploads,
    { name: "question.wav", mimeType: "audio/wav", bytes: Uint8Array.of(5) },
    { name: "example.mp4", mimeType: "video/mp4", bytes: Uint8Array.of(6) },
    {
      name: "notes-utf16.txt",
      mimeType: "text/plain",
      bytes: Uint8Array.of(0xff, 0xfe, 65, 0),
    },
  ];
  const result = await sendWork(
    { ...request, ...bounded, inputFiles },
    "key",
    api.fetch,
  );
  expect(api.calls).toHaveLength(1);
  const body = JSON.parse(String(api.calls[0].init?.body));
  expect(body.plugins).toEqual([
    { id: "file-parser", pdf: { engine: "native" } },
  ]);
  expect(body.messages[0].content).toEqual([
    { type: "text", text: "Привет" },
    {
      type: "image_url",
      image_url: { detail: "auto", url: "data:image/png;base64," + imageData },
    },
    {
      type: "file",
      file: {
        filename: "terms.pdf",
        file_data: "data:application/pdf;base64,AwQ=",
      },
    },
    { type: "text", text: "notes.TXT\nКлиент" },
    { type: "input_audio", input_audio: { format: "wav", data: "BQ==" } },
    { type: "video_url", video_url: { url: "data:video/mp4;base64,Bg==" } },
    {
      type: "file",
      file: {
        filename: "notes-utf16.txt",
        file_data: "data:text/plain;base64,//5BAA==",
      },
    },
  ]);
  expect(result.usage.usd).toBe("0.006");
});

it("preserves a direct OpenAI audio rate separately from text and rejects an unpriced modality before network", async () => {
  const file = {
    name: "message.wav",
    mimeType: "audio/wav",
    bytes: Uint8Array.of(1),
  };
  const api = network({
    ...payload,
    usage: {
      prompt_tokens: 100,
      completion_tokens: 2,
      prompt_tokens_details: { audio_tokens: 80 },
    },
  });
  const withAudio = {
    ...request,
    ...bounded,
    provider: "openai" as const,
    model: "audio-model",
    inputFiles: [file],
  };
  await expect(sendWork(withAudio, "key", api.fetch)).rejects.toMatchObject({
    model: "audio-model",
    filename: "message.wav",
  });
  expect(api.calls).toHaveLength(0);
  const result = await sendWork(
    { ...withAudio, inputAudioUsdPerMillion: "10" },
    "key",
    api.fetch,
  );
  expect(result.usage.usd).toBe("0.000848");
  expect(api.calls).toHaveLength(1);
});

it("returns the affected file and model for rejected native content without exposing provider messages", async () => {
  const api = network(
    {
      error: {
        message: "Unsupported file format; confidential credential",
        param: "messages[0].content[2]",
      },
    },
    400,
  );
  await expect(
    sendWork({ ...request, ...bounded, inputFiles: uploads }, "key", api.fetch),
  ).rejects.toMatchObject({
    filename: "terms.pdf",
    model: "test/chat",
    message: "Model test/chat cannot process attachment terms.pdf",
  });
  expect(api.calls).toHaveLength(1);
});

it("estimates documented image patch pricing locally and stops when document counting is unavailable", async () => {
  const direct: IWorkRequest = {
    ...request,
    provider: "openai",
    model: "gpt-4.1-mini",
    ...bounded,
  };
  const api = network({ error: { message: "Service unavailable" } }, 503);
  const base = estimateWork(direct);
  const photo = await estimateWorkWithFiles(
    { ...direct, inputFiles: [uploads[0]] },
    "key",
    api.fetch,
  );
  expect(photo.input - base.input).toBe(64 + "photo.png".length + 2);
  expect(api.calls).toHaveLength(0);
  await expect(
    estimateWorkWithFiles(
      { ...direct, inputFiles: [uploads[1]] },
      "key",
      api.fetch,
    ),
  ).rejects.toThrow("token count unavailable");
  expect(api.calls).toHaveLength(1);
  expect(api.calls[0].url).toBe(
    "https://api.openai.com/v1/responses/input_tokens",
  );
});
