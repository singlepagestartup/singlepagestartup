import {
  openAIChatReasoning,
  providerReasoningEffortValues,
  type IProviderModelReasoning,
  type TProviderReasoningEffort,
} from "@sps/shared-utils";
import type { IOpenRouterModelReasoning } from "../open-router/interface";
import { getOpenRouterModels } from "../open-router/models";

export async function providerModelReasoning(
  provider: "openai" | "openrouter",
  modelId: string,
): Promise<IProviderModelReasoning | null> {
  if (provider === "openai") {
    return openAIChatReasoning(modelId);
  }

  const models = await getOpenRouterModels().catch(() => []);
  const model =
    models.find(({ id }) => id === modelId) ??
    models.find(({ canonical_slug }) => canonical_slug === modelId);
  if (!model?.reasoning) {
    return null;
  }

  return openRouterReasoning(model.reasoning);
}

function openRouterReasoning(
  reasoning: IOpenRouterModelReasoning,
): IProviderModelReasoning {
  const mandatory = reasoning.mandatory === true;
  // null allows gateway efforts. An omitted property exposes no effort control.
  const advertisedEfforts =
    reasoning.supported_efforts === null
      ? providerReasoningEffortValues
      : readReasoningEfforts(reasoning.supported_efforts);
  const allowedEffort = (effort: TProviderReasoningEffort) =>
    providerReasoningEffortValues.includes(effort) &&
    (!mandatory || effort !== "none");
  const defaultEffort = reasoning.default_effort;

  return {
    defaultEffort:
      defaultEffort && allowedEffort(defaultEffort) ? defaultEffort : null,
    defaultEnabled: reasoning.default_enabled ?? null,
    mandatory,
    supportedEfforts: [...new Set(advertisedEfforts.filter(allowedEffort))],
    supportsMaxTokens: reasoning.supports_max_tokens === true,
  };
}

function readReasoningEfforts(
  efforts: IOpenRouterModelReasoning["supported_efforts"],
) {
  return Array.isArray(efforts) ? efforts : [];
}
