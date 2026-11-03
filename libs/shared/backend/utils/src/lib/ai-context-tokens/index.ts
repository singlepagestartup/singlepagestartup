import { getEncoding } from "js-tiktoken";
import { AI_CONTEXT_POLICY } from "@sps/shared-utils";

let encoder: ReturnType<typeof getEncoding> | undefined;

/** Text estimate only; provider-reported usage includes its media/protocol costs. */
export function estimateAiContextTokens(text: string): number {
  encoder ??= getEncoding("o200k_base");
  return Math.ceil(
    encoder.encode(text, [], []).length * AI_CONTEXT_POLICY.textEstimateMargin,
  );
}
