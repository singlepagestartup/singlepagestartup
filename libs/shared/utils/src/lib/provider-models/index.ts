import {
  PROVIDER_MODEL_FAVORITE_ALIASES,
  type TProviderReasoningEffort,
} from "../constants/provider-models";

export interface IProviderModelReasoning {
  defaultEffort: TProviderReasoningEffort | null;
  defaultEnabled: boolean | null;
  mandatory: boolean;
  supportedEfforts: TProviderReasoningEffort[];
  supportsMaxTokens: boolean;
}

/** Shared favorite identity for legacy bare OpenAI IDs and namespaced IDs. */
export function providerModelFavoriteId(modelId: string): string {
  if (modelId === "auto" || !modelId) {
    return modelId;
  }

  const namespacedId = modelId.includes("/") ? modelId : `openai/${modelId}`;
  return PROVIDER_MODEL_FAVORITE_ALIASES[namespacedId] ?? namespacedId;
}
