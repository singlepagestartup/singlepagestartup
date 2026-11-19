import {
  estimateImageWork,
  sendImageWork,
  type IImageWorkRequest,
} from "./image-work";
import { ProviderOutcomeUnknown, ProviderRejected } from "./work-request";

const direct: IImageWorkRequest = {
  capability: "image",
  provider: "openai",
  model: "gpt-image-2.5-flare-2026-09-08",
  messages: [{ role: "user", content: "Draw a bright circle." }],
  maxOutputTokens: 16_384,
  inputUsdPerMillion: "8",
  outputUsdPerMillion: "30",
};
const router: IImageWorkRequest = {
  ...direct,
  provider: "openrouter",
  model: "openai/gpt-image-2.5-flare",
  outputUsdPerMillion: "40",
};

function imageHeader() {
  const png = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a0000000d49484452", "hex").copy(png);
  png.writeUInt32BE(1024, 16);
  png.writeUInt32BE(1024, 20);
  return png;
}

it("meters direct image usage at the pinned rates with a bounded generation request", async () => {
  const bytes = imageHeader();
  const network = jest.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        data: [{ b64_json: bytes.toString("base64") }],
        usage: {
          input_tokens: 100,
          input_tokens_details: { text_tokens: 100, image_tokens: 0 },
          output_tokens: 200,
        },
      },
      { headers: { "x-request-id": "req_image" } },
    ),
  );
  const response = await sendImageWork(
    direct,
    "test-secret",
    "attempt",
    network,
  );
  expect(response).toEqual({
    bytes,
    result: {
      providerRequestId: "req_image",
      text: "",
      usage: {
        inputTokens: 100,
        outputTokens: 200,
        usd: "0.0065",
        basis: "rate-card",
      },
    },
  });
  expect(network).toHaveBeenCalledTimes(1);
  const [url, init] = network.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/images/generations");
  expect(init?.redirect).toBe("error");
  expect(JSON.parse(String(init?.body))).toMatchObject({
    n: 1,
    size: "1024x1024",
    quality: "low",
    stream: false,
    output_format: "png",
  });
  expect(estimateImageWork(direct).usd.gt(response.result.usage.usd)).toBe(
    true,
  );
});

it("preserves OpenRouter usage even when a returned URL cannot become an artifact", async () => {
  const network = jest.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        data: [{ url: "https://provider.example/result.png" }],
        usage: { prompt_tokens: 10, completion_tokens: 20, cost: 0.002 },
      },
      { headers: { "x-generation-id": "gen-image" } },
    ),
  );
  const response = await sendImageWork(
    router,
    "test-secret",
    "attempt",
    network,
  );
  expect(response.bytes).toBeUndefined();
  expect(response.result.usage).toEqual({
    inputTokens: 10,
    outputTokens: 20,
    usd: "0.002",
    basis: "provider",
  });
  expect(network).toHaveBeenCalledTimes(1);
  const [url, init] = network.mock.calls[0];
  expect(url).toBe("https://openrouter.ai/api/v1/images");
  expect(JSON.parse(String(init?.body))).toMatchObject({
    response_format: "b64_json",
    provider: { only: ["openai"], allow_fallbacks: false },
  });
});

it("refuses an unpriced request before sending and never repeats a request with unknown usage", async () => {
  const network = jest.fn<typeof fetch>();
  await expect(
    sendImageWork(
      { ...router, outputUsdPerMillion: "1" },
      "test-secret",
      "attempt",
      network,
    ),
  ).rejects.toThrow("ceilings are too low");
  await expect(
    sendImageWork(
      { ...router, model: "other-model" },
      "test-secret",
      "attempt",
      network,
    ),
  ).rejects.toThrow("does not support metered image work");
  expect(network).not.toHaveBeenCalled();

  network.mockResolvedValueOnce(
    Response.json(
      { data: [{ b64_json: imageHeader().toString("base64") }] },
      { headers: { "x-generation-id": "gen-unknown" } },
    ),
  );
  await expect(
    sendImageWork(router, "test-secret", "attempt", network),
  ).rejects.toMatchObject({
    requestId: "gen-unknown",
    constructor: ProviderOutcomeUnknown,
  });
  expect(network).toHaveBeenCalledTimes(1);

  network.mockResolvedValueOnce(new Response(null, { status: 429 }));
  await expect(
    sendImageWork(router, "test-secret", "attempt", network),
  ).rejects.toBeInstanceOf(ProviderRejected);
  expect(network).toHaveBeenCalledTimes(2);
});
