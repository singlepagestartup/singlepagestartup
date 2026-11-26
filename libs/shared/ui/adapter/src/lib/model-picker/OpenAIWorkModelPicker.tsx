"use client";

import {
  OPEN_AI_STAGE_TEXT_DEFAULT,
  OPEN_AI_STAGE_TEXT_MODEL_LABEL,
  OPEN_AI_STAGE_TEXT_REASONING,
  OPEN_AI_WORK_MODELS,
  type IOpenAIWorkModelSelection,
  type TProviderReasoningEffort,
} from "@sps/shared-utils/provider-models";
import { settingsFormStyles } from "@sps/shared-ui-shadcn/form/styles";
import { ModelPicker } from ".";
import type { IModelPickerProps } from "./interface";

const reasoningLabels: Record<
  TProviderReasoningEffort,
  { label: string; labelRu: string }
> = {
  max: { label: "Maximum", labelRu: "Максимальный" },
  xhigh: { label: "Extra High", labelRu: "Очень высокий" },
  high: { label: "High", labelRu: "Высокий" },
  medium: { label: "Medium", labelRu: "Средний" },
  low: { label: "Low", labelRu: "Низкий" },
  minimal: { label: "Minimal", labelRu: "Минимальный" },
  none: { label: "Off", labelRu: "Выкл." },
};
const stageReasoningOptions = OPEN_AI_STAGE_TEXT_REASONING.map((value) => ({
  ...reasoningLabels[value],
  value,
}));

const modelGroups = {
  text: [
    {
      id: "text",
      title: "OpenAI",
      models: [
        {
          id: OPEN_AI_STAGE_TEXT_DEFAULT.modelId,
          name: OPEN_AI_STAGE_TEXT_MODEL_LABEL,
        },
      ],
    },
  ],
  image: [
    {
      id: "image",
      title: "OpenAI",
      models: OPEN_AI_WORK_MODELS.image.map((id) => ({ id, name: id })),
    },
  ],
};

interface IOpenAIWorkModelPickerProps extends Pick<
  IModelPickerProps<TProviderReasoningEffort>,
  | "id"
  | "aria-describedby"
  | "disabled"
  | "modelTriggerClassName"
  | "reasoningTriggerClassName"
> {
  kind: keyof typeof OPEN_AI_WORK_MODELS;
  language: string;
  modelLabel: string;
  useStageTextDefault?: boolean;
  value?: IOpenAIWorkModelSelection;
  onChange: (value: IOpenAIWorkModelSelection | undefined) => void;
}

export function OpenAIWorkModelPicker({
  kind,
  language,
  modelLabel,
  modelTriggerClassName = `${settingsFormStyles.field} w-auto max-w-full`,
  reasoningTriggerClassName = `${settingsFormStyles.secondary} w-auto max-w-full`,
  useStageTextDefault,
  value,
  onChange,
  ...field
}: IOpenAIWorkModelPickerProps) {
  const russian = language === "ru";
  const languageLabel = russian ? "labelRu" : "label";
  const modelId = value?.modelId ?? "auto";
  const autoLabel = russian ? "Авто" : "Auto";
  const defaultEffort =
    reasoningLabels[OPEN_AI_STAGE_TEXT_DEFAULT.reasoning][languageLabel];
  const autoText =
    kind === "text" && useStageTextDefault
      ? `${autoLabel} · ${OPEN_AI_STAGE_TEXT_MODEL_LABEL} · ${defaultEffort}`
      : autoLabel;
  const isStageTextModel =
    kind === "text" && modelId === OPEN_AI_STAGE_TEXT_DEFAULT.modelId;
  const savedEffort =
    kind === "text" && !isStageTextModel && value?.reasoning
      ? reasoningLabels[value.reasoning][languageLabel]
      : undefined;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ModelPicker
        {...field}
        language={language}
        modelLabel={modelLabel}
        modelTriggerClassName={modelTriggerClassName}
        reasoningTriggerClassName={reasoningTriggerClassName}
        autoLabel={autoText}
        isLoadingModels={false}
        isSelectionUnavailable={
          modelId !== "auto" &&
          !OPEN_AI_WORK_MODELS[kind].some((id) => id === modelId)
        }
        modelGroups={modelGroups[kind]}
        onModelChange={(selected) => {
          if (selected === modelId) {
            return;
          }
          if (selected === "auto") {
            onChange(undefined);
          } else if (selected === OPEN_AI_STAGE_TEXT_DEFAULT.modelId) {
            onChange(OPEN_AI_STAGE_TEXT_DEFAULT);
          } else {
            onChange({ modelId: selected });
          }
        }}
        onReasoningChange={(reasoning) => onChange({ modelId, reasoning })}
        reasoningOptions={isStageTextModel ? stageReasoningOptions : []}
        selectedModelId={modelId}
        selectedModelLabel={
          isStageTextModel ? OPEN_AI_STAGE_TEXT_MODEL_LABEL : modelId
        }
        selectedReasoning={
          value?.reasoning ?? OPEN_AI_STAGE_TEXT_DEFAULT.reasoning
        }
      />
      {savedEffort && (
        <span className="text-xs font-normal text-muted-foreground">
          {russian
            ? `Режим рассуждения · ${savedEffort}`
            : `Thinking · ${savedEffort}`}
        </span>
      )}
    </div>
  );
}
