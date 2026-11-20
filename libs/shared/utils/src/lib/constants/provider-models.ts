export const providerReasoningEffortValues = [
  "max",
  "xhigh",
  "high",
  "medium",
  "low",
  "minimal",
  "none",
] as const;

export type TProviderReasoningEffort =
  (typeof providerReasoningEffortValues)[number];

// Explicit equivalents used across the direct API and OpenRouter.
// https://openrouter.ai/api/v1/models/openai/gpt-4.1-mini/endpoints
// https://openrouter.ai/api/v1/models/openai/gpt-image-2.5-flare/endpoints
// https://developers.openai.com/api/docs/models/gpt-5.6-sol
export const PROVIDER_MODEL_FAVORITE_ALIASES: Readonly<Record<string, string>> =
  {
    "openai/gpt-4.1-mini-2025-04-14": "openai/gpt-4.1-mini",
    "openai/gpt-image-2.5-flare-2026-09-08": "openai/gpt-image-2.5-flare",
    "openai/gpt-image-2.5-flare-20260908": "openai/gpt-image-2.5-flare",
    "openai/gpt-5.6": "openai/gpt-5.6-sol",
  };

interface IOpenAIChatReasoning {
  modelIds: readonly string[];
  supportedEfforts: readonly TProviderReasoningEffort[];
  defaultEffort: TProviderReasoningEffort | null;
}

const lowToMax = ["max", "xhigh", "high", "medium", "low"] as const;
const noneToXHigh = ["xhigh", "high", "medium", "low", "none"] as const;

// Chat Completions models and published snapshots from the OpenAI model pages.
// https://developers.openai.com/api/docs/models/all
export const OPEN_AI_CHAT_REASONING: readonly IOpenAIChatReasoning[] = [
  {
    modelIds: ["gpt-6.2-astra", "gpt-6.2-sol", "gpt-6-astra"],
    supportedEfforts: lowToMax,
    defaultEffort: null,
  },
  {
    modelIds: ["gpt-6.1-sol"],
    supportedEfforts: lowToMax,
    defaultEffort: "medium",
  },
  {
    modelIds: [
      "gpt-6.1-terra",
      "gpt-6-sol",
      "gpt-6-luna",
      "gpt-5.6",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
    ],
    supportedEfforts: [...lowToMax, "none"],
    defaultEffort: "medium",
  },
  {
    modelIds: ["gpt-5.5", "gpt-5.5-2026-04-23"],
    supportedEfforts: noneToXHigh,
    defaultEffort: "medium",
  },
  {
    modelIds: [
      "gpt-5.4",
      "gpt-5.4-2026-03-05",
      "gpt-5.4-mini",
      "gpt-5.4-mini-2026-03-17",
      "gpt-5.4-nano",
      "gpt-5.4-nano-2026-03-17",
      "gpt-5.2",
      "gpt-5.2-2025-12-11",
    ],
    supportedEfforts: noneToXHigh,
    defaultEffort: "none",
  },
  {
    modelIds: ["gpt-5.3-codex"],
    supportedEfforts: ["xhigh", "high", "medium", "low"],
    defaultEffort: null,
  },
  {
    modelIds: ["gpt-5.1", "gpt-5.1-2025-11-13"],
    supportedEfforts: ["high", "medium", "low", "none"],
    defaultEffort: "none",
  },
  {
    modelIds: [
      "gpt-5",
      "gpt-5-2025-08-07",
      "gpt-5-mini",
      "gpt-5-mini-2025-08-07",
      "gpt-5-nano",
      "gpt-5-nano-2025-08-07",
    ],
    supportedEfforts: ["high", "medium", "low", "minimal"],
    defaultEffort: "medium",
  },
  {
    modelIds: ["o3", "o3-2025-04-16", "o4-mini", "o4-mini-2025-04-16"],
    supportedEfforts: ["high", "medium", "low"],
    defaultEffort: "medium",
  },
];
