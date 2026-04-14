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
});
