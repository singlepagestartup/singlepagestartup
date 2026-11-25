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

function imageHeader(width = 1024, height = 1024) {
  const png = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a0000000d49484452", "hex").copy(png);
  png.writeUInt32BE(width, 16);
  png.writeUInt32BE(height, 20);
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

it("sends source bytes to OpenAI image edits and reserves for the image input", async () => {
  const source = new Uint8Array([0xff, 0xd8, 0xff]);
  const request = { ...direct, sourceImages: [source] };
  const network = jest.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        data: [{ b64_json: imageHeader().toString("base64") }],
        usage: {
          input_tokens: 150,
          input_tokens_details: { text_tokens: 100, image_tokens: 50 },
          output_tokens: 200,
        },
      },
      { headers: { "x-request-id": "req_edit" } },
    ),
  );
  const response = await sendImageWork(
    request,
    "test-secret",
    "attempt",
    network,
  );
  const [url, init] = network.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/images/edits");
  expect(new Headers(init?.headers).get("content-type")).toBeNull();
  const form = init?.body as FormData;
  expect(form.get("model")).toBe(direct.model);
  expect(form.get("quality")).toBe("low");
  expect(form.get("n")).toBe("1");
  const input = form.get("image[]") as Blob;
  expect(input.type).toBe("image/jpeg");
  expect(new Uint8Array(await input.arrayBuffer())).toEqual(source);
  expect(estimateImageWork(request).input).toBeGreaterThan(
    estimateImageWork(direct).input,
  );
  expect(response.result.usage.usd).toBe("0.0069");
  await expect(
    sendImageWork(
      { ...router, sourceImages: [source] },
      "test-secret",
      "attempt",
      network,
    ),
  ).rejects.toThrow("Unsupported image source inputs");
  expect(network).toHaveBeenCalledTimes(1);
});

it("requests a native portrait cover edit with medium quality within the existing reserve", async () => {
  const bytes = imageHeader(864, 1152);
  const network = jest.fn<typeof fetch>().mockResolvedValue(
    Response.json(
      {
        data: [{ b64_json: bytes.toString("base64") }],
        usage: {
          input_tokens: 100,
          input_tokens_details: { text_tokens: 40, image_tokens: 60 },
          output_tokens: 2000,
        },
      },
      { headers: { "x-request-id": "req_portrait_cover" } },
    ),
  );
  const request: IImageWorkRequest = {
    ...direct,
    sourceImages: [new Uint8Array([0xff, 0xd8, 0xff])],
    coverBackground: {
      width: 900,
      height: 1200,
      captionSpace: true,
      captionTopPercent: 80,
      description: "Continuous warm white backdrop with graphite accents",
      skillGuidance:
        "Use a colored strip and decorative symbols for the caption.",
      referenceGuidance: "The lamp has a solid walnut base.",
      roleGuidance: "Studio guidance. ".repeat(300) + "Final role sentence.",
      suppressIcons: true,
      suppressBands: true,
    },
  };
  const result = await sendImageWork(
    request,
    "test-secret",
    "attempt",
    network,
  );
  const [url, init] = network.mock.calls[0];
  const form = init?.body as FormData;
  const prompt = String(form.get("prompt"));
  expect(url).toBe("https://api.openai.com/v1/images/edits");
  expect(form.get("size")).toBe("864x1152");
  expect(form.get("quality")).toBe("medium");
  expect(prompt).toContain("lower 20%");
  expect(prompt).toContain("No decorative icons");
  expect(prompt).toContain("No separate strips");
  expect(prompt).toContain(request.coverBackground!.roleGuidance!);
  expect(prompt).toContain(request.coverBackground!.skillGuidance!);
  expect(prompt).toContain(request.coverBackground!.referenceGuidance!);
  expect(prompt.indexOf("Explicit buyer constraints")).toBeGreaterThan(
    prompt.indexOf(request.coverBackground!.skillGuidance!),
  );
  expect(result.bytes).toEqual(bytes);
  expect(result.result.usage).toMatchObject({
    outputTokens: 2000,
    usd: "0.06068",
    basis: "rate-card",
  });
  expect(estimateImageWork(request).usd.gt(result.result.usage.usd)).toBe(true);
});

it.each([true, false])(
  "sends product and style with separate roles and optional approved copy (%s)",
  async (hasCopy) => {
    const productPhoto = new Uint8Array([255, 216, 255, 1]);
    const styleImage = new Uint8Array([255, 216, 255, 2]);
    const fontSample = new Uint8Array([255, 216, 255, 3]);
    const work: IImageWorkRequest = {
      ...direct,
      coverBackground: {
        width: 900,
        height: 1200,
        description: "Use the customer's brand palette of sage and warm cream.",
        skillGuidance: "Use a fixed bottom caption strip.",
        referenceGuidance:
          "Earlier designs used a stone podium and a red background.",
        styleReference: {
          productPhoto,
          styleImage,
          copy: hasCopy
            ? {
                title: "Лён",
                details: ["Свет 4000–6000 К", "Экологичные материалы"],
                background: "transparent",
                color: "#183C32",
                fontSample,
              }
            : undefined,
        },
      },
    };
    const network = jest.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          data: [{ b64_json: imageHeader(864, 1152).toString("base64") }],
          usage: {
            input_tokens: 170,
            input_tokens_details: { text_tokens: 70, image_tokens: 100 },
            output_tokens: 210,
          },
        },
        { headers: { "x-request-id": "req_reference" } },
      ),
    );

    const result = await sendImageWork(work, "test-secret", "attempt", network);
    const [url, init] = network.mock.calls[0];
    const form = init?.body as FormData;
    const prompt = String(form.get("prompt"));
    const inputs = form.getAll("image[]") as File[];
    expect(url).toBe("https://api.openai.com/v1/images/edits");
    expect(form.get("quality")).toBe("medium");
    expect(inputs.map(({ name }) => name)).toEqual([
      "product-photo.jpg",
      "style-reference.jpg",
      ...(hasCopy ? ["caption-font.jpg"] : []),
    ]);
    const bytes = await Promise.all(
      inputs.map(async (file) => new Uint8Array(await file.arrayBuffer())),
    );
    expect(bytes).toEqual([
      productPhoto,
      styleImage,
      ...(hasCopy ? [fontSample] : []),
    ]);
    expect(prompt).toContain("sole visual source for the product");
    expect(prompt).toContain(
      "Do not copy its product, words, numbers, logos, claims or watermarks",
    );
    expect(prompt).toContain("Before rendering, study the example");
    expect(prompt).toContain("as relative bounds within the artwork");
    expect(prompt).toContain("same relative zones and on the same visual grid");
    expect(prompt).toContain("sage and warm cream");
    expect(prompt).toContain("Ignore interface chrome");
    expect(prompt).not.toContain(work.coverBackground!.skillGuidance!);
    expect(prompt).not.toContain(work.coverBackground!.referenceGuidance!);
    expect(prompt).not.toContain("quiet continuation");
    if (hasCopy) {
      expect(prompt).toContain(
        "Distribute the approved feature lines across the example's corresponding callout zones",
      );
      expect(prompt).toContain('"title":"Лён"');
      expect(prompt).toContain(
        '"details":["Свет 4000–6000 К","Экологичные материалы"]',
      );
      expect(prompt).toContain("no added caption panel");
      expect(prompt).toContain("Use the requested caption color #183C32");
    } else {
      expect(prompt).toContain("Leave out all added text");
    }
    expect(estimateImageWork(work).input).toBeGreaterThanOrEqual(
      inputs.length * 4096,
    );
    expect(estimateImageWork(work).usd.gt(result.result.usage.usd)).toBe(true);
    expect(() =>
      estimateImageWork({ ...work, sourceImages: [productPhoto] }),
    ).toThrow("Unsupported image source inputs");
    await expect(
      sendImageWork(
        { ...work, ...router, coverBackground: work.coverBackground },
        "test-secret",
        "attempt",
        network,
      ),
    ).rejects.toThrow("Unsupported image source inputs");
    expect(network).toHaveBeenCalledTimes(1);
  },
);

it("forwards the design conversation and original images for direct cover artwork", async () => {
  const productPhoto = Uint8Array.from([137, 80, 78, 71]);
  const styleImage = Uint8Array.from([82, 73, 70, 70]);
  const providerResult = imageHeader(768, 1024);
  const work: IImageWorkRequest = {
    ...direct,
    messages: [{ role: "system", content: "Internal stage rules" }],
    coverArtwork: {
      width: 768,
      height: 1024,
      conversation: [
        { role: "user", content: "Use the example's bold lettering." },
        { role: "assistant", content: "We can arrange the copy diagonally." },
        { role: "user", content: "Set «Долгий свет» across the upper corner." },
      ],
      productPhoto: { bytes: productPhoto, mimeType: "image/png" },
      styleImage: { bytes: styleImage, mimeType: "image/webp" },
    },
  };
  const network = jest.fn<typeof fetch>().mockResolvedValue(
    Response.json({
      id: "req_cover_artwork",
      data: [{ b64_json: providerResult.toString("base64") }],
      usage: {
        input_tokens: 170,
        input_tokens_details: { text_tokens: 70, image_tokens: 100 },
        output_tokens: 210,
      },
    }),
  );
  const result = await sendImageWork(work, "test-secret", "attempt", network);
  const [url, init] = network.mock.calls[0];
  expect(url).toBe("https://api.openai.com/v1/images/edits");
  const form = init?.body as FormData;
  expect(form.get("size")).toBe("768x1024");
  const prompt = String(form.get("prompt"));
  expect(prompt).toContain("Use the example's bold lettering.");
  expect(prompt).toContain("We can arrange the copy diagonally.");
  expect(prompt).toContain("Set «Долгий свет» across the upper corner.");
  expect(prompt).not.toMatch(
    /Internal stage rules|studio|podium|caption panel|font|safe margins/iu,
  );
  const inputFiles = form.getAll("image[]") as File[];
  expect(inputFiles.map(({ name, type }) => ({ name, type }))).toEqual([
    { name: "product-photo.png", type: "image/png" },
    { name: "style-reference.webp", type: "image/webp" },
  ]);
  expect(
    await Promise.all(
      inputFiles.map(async (file) => new Uint8Array(await file.arrayBuffer())),
    ),
  ).toEqual([productPhoto, styleImage]);
  expect(result.bytes).toEqual(providerResult);
});

it.each([
  {
    name: "OpenAI image edit",
    request: { ...direct, sourceImages: [new Uint8Array([0xff, 0xd8, 0xff])] },
  },
  { name: "OpenRouter background", request: router },
])(
  "sends and meters only the approved cover prompt for $name",
  async ({ request }) => {
    const network = jest.fn<typeof fetch>().mockResolvedValue(
      Response.json(
        {
          data: [{ b64_json: imageHeader().toString("base64") }],
          usage: {
            input_tokens: 100,
            input_tokens_details: { text_tokens: 100, image_tokens: 0 },
            output_tokens: 200,
            prompt_tokens: 100,
            completion_tokens: 200,
            cost: 0.002,
          },
        },
        {
          headers: {
            "x-request-id": "req_cover",
            "x-generation-id": "gen_cover",
          },
        },
      ),
    );
    const withoutSkill: IImageWorkRequest = {
      ...request,
      messages: [{ role: "system", content: "Unrelated private references" }],
      coverBackground: {
        width: 800,
        height: 1000,
        description: "Cream studio background",
      },
    };
    const skillGuidance =
      "Studio styling\nUse a subtle, embossed linen texture.";
    const withSkill = {
      ...withoutSkill,
      coverBackground: { ...withoutSkill.coverBackground!, skillGuidance },
    };
    await sendImageWork(withSkill, "test-secret", "attempt", network);
    const [, init] = network.mock.calls[0];
    const prompt =
      init?.body instanceof FormData
        ? init.body.get("prompt")
        : JSON.parse(String(init?.body)).prompt;
    expect(prompt).toContain(skillGuidance);
    expect(prompt).toContain("Cream studio background");
    expect(prompt).not.toContain("Unrelated private references");
    expect(estimateImageWork(withSkill).input).toBeGreaterThan(
      estimateImageWork(withoutSkill).input,
    );
  },
);

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
