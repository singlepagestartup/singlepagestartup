/**
 * BDD Suite: OpenRouter completion, tool-calling, and billing contracts.
 *
 * Given: callers can request text, multimodal, or function-tool completions.
 * When: the shared wrapper serializes requests and parses provider responses.
 * Then: protocol fields and billing survive without changing existing no-tool behavior.
 */

jest.mock(
  "@sps/shared-utils",
  () => {
    return {
      OPEN_ROUTER_API_KEY: "test-open-router-api-key",
      OPEN_ROUTER_JEV_DECISION_MODEL: "typesafe/jev-1.13",
    };
  },
  {
    virtual: true,
  },
);

import { Service } from "./index";

describe("OpenRouter completion, tool-calling, and billing contracts", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("converts SVG image input to PNG while retaining image content in the request", async () => {
    const service = new Service();
    jest.spyOn(service, "getModels").mockResolvedValue([]);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="violet"/></svg>';
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(svg, { headers: { "content-type": "image/svg+xml" } }),
      )
      .mockResolvedValueOnce({
        json: async () => ({
          choices: [{ message: { content: "Image understood" } }],
        }),
      }) as any;
    await service.generate({
      model: "test/vision",
      context: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
              },
            },
          ],
        },
      ],
    });
    const request = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[1][1].body,
    );
    expect(request.messages[0].content[0].image_url.url).toMatch(
      /^data:image\/png;base64,/,
    );
    expect(
      Buffer.from(
        request.messages[0].content[0].image_url.url.split(",")[1],
        "base64",
      )
        .subarray(1, 4)
        .toString(),
    ).toBe("PNG");
  });

  it("uses the OpenRouter Decisions endpoint and records its token usage and cost", async () => {
    const service = new Service();
    const getModels = jest.spyOn(service, "getModels");
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        model: "typesafe/jev-1.13-20260917",
        answers: { save: { type: "noul", noul: 0.95 } },
        usage: { input_tokens: 100, output_tokens: 8, cost: 0.0000042 },
      }),
    })) as any;
    const result = await service.decide({
      state: { text: "Save this" },
      questions: {
        save: {
          type: "noul",
          instructions: "Save?",
          criteria: { true: "Save", false: "Do not save" },
        },
      },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/alpha/decisions",
      expect.anything(),
    );
    expect(getModels).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      answers: { save: { noul: 0.95 } },
      billing: {
        requestModelId: "typesafe/jev-1.13",
        responseModelId: "typesafe/jev-1.13-20260917",
        totalUsd: 0.0000042,
        usage: { prompt_tokens: 100, completion_tokens: 8, total_tokens: 108 },
      },
    });
  });

  it("rejects invalid Decisions answers while retaining reported billing", async () => {
    const service = new Service();
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        answers: {
          action: {
            type: "choice",
            choice: "other-profile",
            confidence: 1,
            probabilities: { read: 1 },
          },
        },
        usage: { input_tokens: 10, output_tokens: 2, cost: 0.000001 },
      }),
    })) as any;
    const result = await service.decide({
      state: {},
      questions: {
        action: {
          type: "choice",
          instructions: "Choose",
          criteria: { read: "Read" },
        },
      },
    });
    expect(result).toMatchObject({
      error: { message: expect.stringContaining("Invalid") },
      billing: { totalUsd: 0.000001 },
    });
  });

  it("sends the selected model without a routing plugin and records its cost", async () => {
    const service = new Service();
    jest.spyOn(service, "getModels").mockResolvedValue([
      {
        id: "test/answer",
        pricing: { prompt: "0.01", completion: "0.01" },
      } as any,
    ]);
    global.fetch = jest.fn(async () => ({
      json: async () => ({
        model: "test/answer",
        choices: [{ message: { content: "Answer" } }],
        usage: { prompt_tokens: 100, completion_tokens: 2, cost: 0.0002 },
      }),
    })) as any;
    const result = await service.generate({
      model: "test/answer",
      context: [{ role: "user", content: "Question" }],
    });
    const request = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(request.plugins).toBeUndefined();
    expect(request.model).toBe("test/answer");
    expect(result.billing).toMatchObject({
      responseModelId: "test/answer",
      usageCostCredits: 0.0002,
      totalUsd: 1.02,
    });
  });

  /**
   * BDD Scenario
   * Given: an image generation response reports upstream inference cost but the selected model has no pricing payload.
   * When: billing metadata is built for the successful response.
   * Then: the provider-reported cost is used as the request total and as imageUsd for the generated image.
   */
  it("uses upstream inference cost for image generations without pricing metadata", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([
      {
        id: "black-forest-labs/flux.2-pro",
        canonical_slug: "black-forest-labs/flux.2-pro",
      } as any,
    ]);

    const billing = await (service as any).buildBilling({
      data: {
        model: "black-forest-labs/flux.2-pro",
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost: 0.0297,
          cost_details: {
            upstream_inference_cost: 0.03,
          },
        },
      },
      requestModelId: "black-forest-labs/flux.2-pro",
      messages: [
        {
          role: "user",
          content: "Draw a cat working at a laptop.",
        },
      ],
      images: [
        {
          url: "https://example.com/cat.png",
        },
      ],
    });

    expect(billing).toMatchObject({
      pricing: null,
      totalUsd: 0.03,
      usageCostCredits: 0.0297,
      upstreamInferenceCostCredits: 0.03,
      breakdown: {
        imageUsd: 0.03,
        totalUsd: 0.03,
        outputImageCount: 1,
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the runtime cannot verify the upstream TLS certificate.
   * When: OpenRouter generation performs the HTTPS request.
   * Then: the wrapper returns a structured generation error instead of throwing.
   */
  it("returns an error result for certificate verification failures", async () => {
    const service = new Service();

    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error("unknown certificate verification error"));

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [
        {
          role: "user",
          content: "Hello",
        },
      ],
    });

    expect("error" in result).toBe(true);
    expect(result).toMatchObject({
      error: {
        message:
          "OpenRouter request failed: unknown certificate verification error",
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the caller selected a concrete OpenRouter reasoning effort.
   * When: generation sends the chat completion request.
   * Then: the reasoning object is forwarded and reasoning text is excluded by default.
   */
  it("forwards reasoning effort payloads to OpenRouter", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.2",
        choices: [
          {
            message: {
              content: "Reasoned answer",
            },
          },
        ],
      }),
    } as any);

    await service.generate({
      model: "openai/gpt-5.2",
      context: [
        {
          role: "user",
          content: "Hello",
        },
      ],
      reasoning: {
        effort: "high",
        exclude: true,
      },
    });

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );

    expect(requestBody.reasoning).toEqual({
      effort: "high",
      exclude: true,
    });
  });

  /**
   * BDD Scenario
   * Given: a user message contains two local text files and one local image.
   * When: generation normalizes the multimodal request for OpenRouter.
   * Then: the exact bytes of both files and the image are present in the outbound payload as data URLs.
   */
  it("inlines every local attachment without replacing text files by extracted text", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const attachmentByUrl: Record<
        string,
        { bytes: string; mimeType: string }
      > = {
        "http://localhost:4000/part-1.txt": {
          bytes: "Кота зовут Барсик.",
          mimeType: "text/plain;charset=utf-8",
        },
        "http://localhost:4000/part-2.txt": {
          bytes: "Любимая игрушка — зелёный мяч.",
          mimeType: "text/plain; charset=utf-8",
        },
        "http://localhost:4000/cat.jpeg": {
          bytes: "exact-jpeg-bytes",
          mimeType: "image/jpeg",
        },
      };
      const attachment = attachmentByUrl[url];

      if (attachment) {
        return {
          ok: true,
          arrayBuffer: async () => Buffer.from(attachment.bytes),
          headers: {
            get: (name: string) => {
              return name.toLowerCase() === "content-type"
                ? attachment.mimeType
                : null;
            },
          },
        } as any;
      }

      return {
        json: async () => ({
          model: "openai/gpt-5.2",
          choices: [{ message: { content: "Барсик любит зелёный мяч." } }],
        }),
      } as any;
    }) as jest.Mock;

    const result = await service.generate({
      model: "openai/gpt-5.2",
      stripNonTextOnRetry: false,
      context: [
        {
          role: "user",
          content: [
            { type: "text", text: "Сопоставь все вложения." },
            {
              type: "file_url",
              file_url: { url: "http://localhost:4000/part-1.txt" },
            },
            {
              type: "file_url",
              file_url: { url: "http://localhost:4000/part-2.txt" },
            },
            {
              type: "image_url",
              image_url: { url: "http://localhost:4000/cat.jpeg" },
            },
          ],
        },
      ],
    });
    const completionCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => String(url).endsWith("/chat/completions"),
    );
    const requestBody = JSON.parse(completionCall?.[1]?.body);

    expect(result).toMatchObject({ text: "Барсик любит зелёный мяч." });
    expect(requestBody.messages[0].content).toEqual([
      { type: "text", text: "Сопоставь все вложения." },
      {
        type: "file",
        file: {
          file_data: `data:text/plain;base64,${Buffer.from(
            "Кота зовут Барсик.",
          ).toString("base64")}`,
          mime_type: "text/plain",
          filename: "part-1.txt",
        },
      },
      {
        type: "file",
        file: {
          file_data: `data:text/plain;base64,${Buffer.from(
            "Любимая игрушка — зелёный мяч.",
          ).toString("base64")}`,
          mime_type: "text/plain",
          filename: "part-2.txt",
        },
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${Buffer.from(
            "exact-jpeg-bytes",
          ).toString("base64")}`,
        },
      },
    ]);
  });

  /**
   * BDD Scenario
   * Given: a caller exposes one function tool and requires sequential tool calls.
   * When: generation sends the chat completion request.
   * Then: tools, tool_choice, and parallel_tool_calls are serialized exactly in OpenAI-compatible form.
   */
  it("serializes function tool request options", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.2",
        choices: [
          {
            message: {
              content: "",
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "find_project",
                    arguments: '{"id":"project-1"}',
                  },
                },
              ],
            },
          },
        ],
      }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [{ role: "user", content: "Find the project" }],
      tools: [
        {
          type: "function",
          function: {
            name: "find_project",
            description: "Find a project by id",
            parameters: {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id"],
            },
          },
        },
      ],
      toolChoice: {
        type: "function",
        function: { name: "find_project" },
      },
      parallelToolCalls: false,
    });

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );

    expect(requestBody).toMatchObject({
      tools: [
        {
          type: "function",
          function: {
            name: "find_project",
            description: "Find a project by id",
            parameters: {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id"],
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: { name: "find_project" },
      },
      parallel_tool_calls: false,
    });
    expect(result).toMatchObject({
      text: "",
      toolCalls: [
        {
          id: "call_1",
          type: "function",
          function: {
            name: "find_project",
            arguments: '{"id":"project-1"}',
          },
        },
      ],
    });
  });

  /**
   * BDD Scenario
   * Given: OpenRouter returns multiple function calls, including malformed argument JSON, with usage metadata and no assistant text.
   * When: generation parses the completion.
   * Then: every valid call keeps its id, name, raw argument string, and request billing without parsing or executing arguments.
   */
  it("preserves multiple tool calls and billing on empty assistant text", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.2",
        usage: {
          prompt_tokens: 20,
          completion_tokens: 8,
          total_tokens: 28,
          cost: 0.004,
        },
        choices: [
          {
            message: {
              content: "",
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "find_project",
                    arguments: '{"id":"project-1"}',
                  },
                },
                {
                  id: "call_2",
                  type: "function",
                  function: {
                    name: "search_knowledge",
                    arguments: '{"query":',
                  },
                },
              ],
            },
          },
        ],
      }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [{ role: "user", content: "Find and explain the project" }],
    });

    expect(result).toMatchObject({
      text: "",
      toolCalls: [
        {
          id: "call_1",
          type: "function",
          function: {
            name: "find_project",
            arguments: '{"id":"project-1"}',
          },
        },
        {
          id: "call_2",
          type: "function",
          function: {
            name: "search_knowledge",
            arguments: '{"query":',
          },
        },
      ],
      billing: {
        usage: {
          prompt_tokens: 20,
          completion_tokens: 8,
          total_tokens: 28,
          cost: 0.004,
        },
        totalUsd: 0.004,
      },
    });
  });

  /**
   * BDD Scenario
   * Given: a prior assistant tool call and its tool result are part of the conversation.
   * When: the caller requests the final completion.
   * Then: tool_calls and tool_call_id are replayed without protocol loss and final assistant text remains a normal success.
   */
  it("serializes a tool result conversation before final assistant text", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.2",
        choices: [{ message: { content: "Project Alpha is active." } }],
      }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [
        { role: "user", content: "Find project Alpha" },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "find_project",
                arguments: '{"id":"alpha"}',
              },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_1",
          content: '{"id":"alpha","status":"active"}',
        },
      ],
    });

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(requestBody.messages).toEqual([
      { role: "user", content: "Find project Alpha" },
      {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call_1",
            type: "function",
            function: {
              name: "find_project",
              arguments: '{"id":"alpha"}',
            },
          },
        ],
      },
      {
        role: "tool",
        tool_call_id: "call_1",
        content: '{"id":"alpha","status":"active"}',
      },
    ]);
    expect(result).toMatchObject({ text: "Project Alpha is active." });
  });

  /**
   * BDD Scenario
   * Given: a caller makes a text-only completion without tool options.
   * When: generation serializes the request and parses the response.
   * Then: no tool fields are added and the existing text result stays unchanged.
   */
  it("keeps no-tool text requests compatible", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.2",
        choices: [{ message: { content: "Hello" } }],
      }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [{ role: "user", content: "Hello" }],
    });

    const requestBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body,
    );
    expect(requestBody).not.toHaveProperty("tools");
    expect(requestBody).not.toHaveProperty("tool_choice");
    expect(requestBody).not.toHaveProperty("parallel_tool_calls");
    expect(result).toMatchObject({ text: "Hello" });
  });

  /**
   * BDD Scenario
   * Given: an OpenRouter provider returns a supported nested text value.
   * When: generation parses the structured response content.
   * Then: the nested value becomes readable text without object coercion.
   */
  it("unwraps supported nested response text", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.5",
        choices: [
          {
            message: {
              content: [
                {
                  type: "text",
                  text: { value: "Readable answer", annotations: [] },
                },
              ],
            },
          },
        ],
      }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.5",
      context: [{ role: "user", content: "Hello" }],
    });

    expect(result).toMatchObject({ text: "Readable answer" });
    expect(JSON.stringify(result)).not.toContain("[object Object]");
  });

  /**
   * BDD Scenario
   * Given: an OpenRouter provider returns an unknown object as response text.
   * When: generation parses the structured response content.
   * Then: it returns a typed provider error instead of a JavaScript coercion artifact.
   */
  it("rejects unsupported response text objects", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "openai/gpt-5.5",
        choices: [
          {
            message: {
              content: [
                {
                  type: "text",
                  text: { unexpected: "answer" },
                },
              ],
            },
          },
        ],
      }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.5",
      context: [{ role: "user", content: "Hello" }],
    });

    expect(result).toMatchObject({
      error: {
        code: "unsupported_response_content",
        message: "The model returned a response in an unsupported format.",
      },
    });
    expect(JSON.stringify(result)).not.toContain("[object Object]");
  });

  /**
   * BDD Scenario
   * Given: a no-tool image response uses the existing OpenRouter image envelope.
   * When: generation parses the response.
   * Then: image extraction remains unchanged and no tool calls are added.
   */
  it("keeps no-tool image responses compatible", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        model: "black-forest-labs/flux.2-pro",
        choices: [
          {
            message: {
              content: "Generated image",
              images: [{ image_url: { url: "https://example.com/cat.png" } }],
            },
          },
        ],
      }),
    } as any);

    const result = await service.generate({
      model: "black-forest-labs/flux.2-pro",
      context: [{ role: "user", content: "Draw a cat" }],
    });

    expect(result).toMatchObject({
      text: "Generated image",
      images: [{ url: "https://example.com/cat.png" }],
    });
    expect(result).not.toHaveProperty("toolCalls");
  });

  /**
   * BDD Scenario
   * Given: a multimodal follow-up already contains an assistant tool call and its result.
   * When: OpenRouter rejects the request.
   * Then: the non-text fallback does not replay the tool protocol conversation a second time.
   */
  it("does not retry a conversation that already contains tool calls", async () => {
    const service = new Service();

    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ error: { message: "context length exceeded" } }),
    } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [
        {
          role: "user",
          content: [
            { type: "text", text: "Use this screenshot" },
            {
              type: "image_url",
              image_url: { url: "https://example.com/project.png" },
            },
          ],
        },
        {
          role: "assistant",
          content: "",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "find_project", arguments: "{}" },
            },
          ],
        },
        {
          role: "tool",
          tool_call_id: "call_1",
          content: '{"status":"active"}',
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      error: { message: "context length exceeded" },
    });
  });

  /**
   * BDD Scenario
   * Given: OpenRouter rejects a multimodal request before generation.
   * When: non-text retry is enabled for generation.
   * Then: the wrapper strips non-text content once and returns the retry success result.
   */
  it("strips non-text content once after a multimodal provider error", async () => {
    const service = new Service();

    jest.spyOn(service, "getModels").mockResolvedValue([]);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          error: {
            message: "context length exceeded",
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        json: async () => ({
          model: "openai/gpt-5.2",
          choices: [
            {
              message: {
                content: "Recovered without images",
              },
            },
          ],
        }),
      } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Summarize this page.",
            },
            {
              type: "image_url",
              image_url: {
                url: "https://example.com/page.png",
              },
            },
          ],
        },
      ],
    });

    expect("error" in result).toBe(false);
    expect(result).toMatchObject({
      text: "Recovered without images",
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const retryBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[1][1].body,
    );
    expect(retryBody.messages).toEqual([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Summarize this page.",
          },
        ],
      },
    ]);
  });

  /**
   * BDD Scenario
   * Given: OpenRouter rejects both the original multimodal request and the stripped retry.
   * When: generation handles the retry result.
   * Then: the wrapper returns a structured error from the retry attempt.
   */
  it("returns the retry error when stripped non-text fallback also fails", async () => {
    const service = new Service();

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          error: {
            message: "context length exceeded",
          },
        }),
      } as any)
      .mockResolvedValueOnce({
        json: async () => ({
          error: {
            message: "retry context still failed",
          },
        }),
      } as any);

    const result = await service.generate({
      model: "openai/gpt-5.2",
      context: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Summarize this page.",
            },
            {
              type: "image_url",
              image_url: {
                url: "https://example.com/page.png",
              },
            },
          ],
        },
      ],
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      error: {
        message: "retry context still failed",
      },
    });
  });
});

it("keeps the thread session across decisions, generation and a retry", async () => {
  const originalFetch = global.fetch;
  const service = new Service({ sessionId: "thread-profile" });
  jest.spyOn(service, "getModels").mockResolvedValue([]);
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({ json: async () => ({ answers: {} }) })
    .mockResolvedValueOnce({
      json: async () => ({ error: { message: "unsupported media" } }),
    })
    .mockResolvedValueOnce({
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    });
  global.fetch = fetchMock as any;
  try {
    await service.decide({ state: {}, questions: {} });
    await service.generate({
      model: "test/text",
      context: [
        {
          role: "user",
          content: [
            { type: "text", text: "question" },
            {
              type: "image_url",
              image_url: { url: "https://example.test/image.png" },
            },
          ],
        },
      ],
    });
    expect(fetchMock.mock.calls[0][1].headers["x-session-id"]).toBe(
      "thread-profile",
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).session_id).toBe(
      "thread-profile",
    );
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).session_id).toBe(
      "thread-profile",
    );
  } finally {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  }
});
