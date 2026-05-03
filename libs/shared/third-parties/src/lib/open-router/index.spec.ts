/**
 * BDD Suite: OpenRouter billing fallback for provider-reported costs.
 *
 * Given: some OpenRouter models do not expose usable pricing metadata in the cached model list.
 * When: the provider still returns usage cost details for a successful generation.
 * Then: billing falls back to the provider-reported total so settlement does not undercharge the request.
 */

jest.mock(
  "@sps/shared-utils",
  () => {
    return {
      OPEN_ROUTER_API_KEY: "test-open-router-api-key",
    };
  },
  {
    virtual: true,
  },
);

import { Service } from "./index";

describe("OpenRouter billing fallback for provider-reported costs", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
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
