export const AI_CONTEXT_POLICY = {
  version: 1,
  softInputTokens: 12_000,
  knowledgeTokens: 3_000,
  recentExchanges: 3,
  summaryTriggerTokens: 8_000,
  summaryInputTokens: 16_000,
  summaryTargetTokens: 1_000,
  summaryOutputTokens: 2_048,
  textEstimateMargin: 1.2,
} as const;

// Enable compact only after the paired evaluation meets the acceptance gate.
export const AI_CONTEXT_DEFAULT_MODE: "full" | "compact" = "full";
