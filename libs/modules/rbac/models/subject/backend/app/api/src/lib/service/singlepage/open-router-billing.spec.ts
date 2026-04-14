/**
 * BDD Suite: OpenRouter billing summary helpers.
 *
 * Given: OpenRouter request billing is settled from aggregated USD totals.
 * When: the helper converts USD totals into internal tokens and settlement deltas.
 * Then: rounding, refunds, and additional debits follow the approved issue-158 rules.
 */

import {
  calculateOpenRouterExactTokens,
  calculateSettlementDeltaTokens,
  summarizeOpenRouterBilling,
} from "./open-router-billing";

describe("OpenRouter billing summary helpers", () => {
  /**
   * BDD Scenario
   * Given: aggregated provider usage lands on and around internal-token boundaries.
   * When: exact tokens are computed from USD totals.
   * Then: the helper rounds up to the next whole internal token.
   */
  it("rounds aggregated USD totals up to whole internal tokens", () => {
    expect(calculateOpenRouterExactTokens(0)).toBe(0);
    expect(calculateOpenRouterExactTokens(0.0001)).toBe(1);
    expect(calculateOpenRouterExactTokens(0.001)).toBe(1);
    expect(calculateOpenRouterExactTokens(0.0010001)).toBe(2);
    expect(calculateOpenRouterExactTokens(0.0019)).toBe(2);
  });

  /**
   * BDD Scenario
   * Given: the route precharges one internal token before provider usage is known.
   * When: the exact usage settles below or above that precharge.
   * Then: the computed delta is negative for refunds and positive for additional debits.
   */
  it("computes settlement deltas against the fixed one-token precharge", () => {
    expect(
      calculateSettlementDeltaTokens({
        prechargeTokens: 1,
        exactTokens: 0,
      }),
    ).toBe(-1);
    expect(
      calculateSettlementDeltaTokens({
        prechargeTokens: 1,
        exactTokens: 1,
      }),
    ).toBe(0);
    expect(
      calculateSettlementDeltaTokens({
        prechargeTokens: 1,
        exactTokens: 3,
      }),
    ).toBe(2);
  });

  /**
   * BDD Scenario
   * Given: a request ledger contains multiple OpenRouter sub-calls from one generation.
   * When: the ledger is summarized for persistence and settlement.
   * Then: the total USD, exact token charge, and per-call details are preserved together.
   */
  it("summarizes multi-call request ledgers into one settlement payload", () => {
    const summary = summarizeOpenRouterBilling({
      selectedModelId: "openai/gpt-5.2",
      calls: [
        {
          purpose: "classification",
          modelId: "openai/gpt-5.2",
          status: "success",
          billing: {
            requestModelId: "openai/gpt-5.2",
            responseModelId: "openai/gpt-5.2",
            usage: {
              prompt_tokens: 100,
              completion_tokens: 20,
              total_tokens: 120,
            },
            pricing: null,
            usageCostCredits: null,
            upstreamInferenceCostCredits: null,
            breakdown: {
              promptUsd: 0.0002,
              completionUsd: 0.0003,
              requestUsd: 0,
              imageUsd: 0,
              webSearchUsd: 0,
              reasoningUsd: 0,
              cacheReadUsd: 0,
              cacheWriteUsd: 0,
              totalUsd: 0.0005,
              inputImageCount: 0,
              outputImageCount: 0,
            },
            totalUsd: 0.0005,
          },
        },
        {
          purpose: "generation",
          modelId: "openai/gpt-5.2",
          status: "success",
          billing: {
            requestModelId: "openai/gpt-5.2",
            responseModelId: "openai/gpt-5.2",
            usage: {
              prompt_tokens: 500,
              completion_tokens: 600,
              total_tokens: 1100,
            },
            pricing: null,
            usageCostCredits: null,
            upstreamInferenceCostCredits: null,
            breakdown: {
              promptUsd: 0.0006,
              completionUsd: 0.0014,
              requestUsd: 0,
              imageUsd: 0,
              webSearchUsd: 0,
              reasoningUsd: 0,
              cacheReadUsd: 0,
              cacheWriteUsd: 0,
              totalUsd: 0.002,
              inputImageCount: 0,
              outputImageCount: 0,
            },
            totalUsd: 0.002,
          },
          fallbackReason: "first candidate succeeded",
        },
      ],
    });

    expect(summary.totalUsd).toBeCloseTo(0.0025);
    expect(summary.exactTokens).toBe(3);
    expect(summary.deltaTokens).toBe(2);
    expect(summary.calls).toHaveLength(2);
    expect(summary.calls[1]).toMatchObject({
      purpose: "generation",
      totalUsd: 0.002,
      fallbackReason: "first candidate succeeded",
    });
  });
});
