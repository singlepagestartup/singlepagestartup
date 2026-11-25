import {
  OPEN_AI_CHAT_REASONING,
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_MODEL_LABEL,
  PROVIDER_MODEL_FAVORITE_ALIASES,
  type TProviderReasoningEffort,
} from "../constants/provider-models";

export {
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_MODEL_LABEL,
  OPEN_AI_STAGE_TEXT_REASONING,
  OPEN_AI_WORK_MODELS,
} from "../constants/provider-models";
export type { TProviderReasoningEffort } from "../constants/provider-models";

export interface IOpenAIWorkModelSelection {
  modelId: string;
  reasoning?: TProviderReasoningEffort;
}

export interface IProviderModelReasoning {
  defaultEffort: TProviderReasoningEffort | null;
  defaultEnabled: boolean | null;
  mandatory: boolean;
  supportedEfforts: TProviderReasoningEffort[];
  supportsMaxTokens: boolean;
}

export function providerModelDisplayName(modelId: string) {
  return modelId === OPEN_AI_STAGE_TEXT_DEFAULT.modelId
    ? OPEN_AI_STAGE_TEXT_MODEL_LABEL
    : modelId;
}

export function openAIChatReasoning(
  modelId: string,
): IProviderModelReasoning | null {
  const model = OPEN_AI_CHAT_REASONING.find(({ modelIds }) =>
    modelIds.includes(modelId),
  );
  if (!model) {
    return null;
  }

  return {
    defaultEffort: model.defaultEffort,
    defaultEnabled: model.defaultEffort ? model.defaultEffort !== "none" : null,
    mandatory: !model.supportedEfforts.includes("none"),
    supportedEfforts: [...model.supportedEfforts],
    supportsMaxTokens: false,
  };
}

/** Shared favorite identity for legacy bare OpenAI IDs and namespaced IDs. */
export function providerModelFavoriteId(modelId: string): string {
  if (modelId === "auto" || !modelId) {
    return modelId;
  }

  const namespacedId = modelId.includes("/") ? modelId : `openai/${modelId}`;
  return PROVIDER_MODEL_FAVORITE_ALIASES[namespacedId] ?? namespacedId;
}
