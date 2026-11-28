"use client";

import type {
  IChatModelControls,
  OpenRouterReasoningOption,
  OpenRouterReasoningValue,
} from "../types";
import { isChatAccessError } from "../utils";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { parseRbacAiThreadPreferences } from "@sps/rbac/models/subject/sdk/model";
import {
  providerModelDisplayName,
  providerModelFavoriteId,
} from "@sps/shared-utils";
import type { IModel as SocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseChatModelControlsProps {
  mode?: IChatModelControls["mode"];
  catalogRevision: string;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThread: SocialModuleThread;
  socialModuleThreadId: string;
  subjectId: string;
}

interface IFavoriteSnapshot {
  subjectId: string;
  modelIds: string[];
}

interface IReasoningSelection {
  scope: string;
  modelId: string;
  effort: OpenRouterReasoningValue;
}

const reasoningChoices: OpenRouterReasoningOption[] = [
  { label: "Auto", labelRu: "Авто", value: "auto" },
  { label: "Maximum", labelRu: "Максимальный", value: "max" },
  { label: "Extra High", labelRu: "Очень высокий", value: "xhigh" },
  { label: "High", labelRu: "Высокий", value: "high" },
  { label: "Medium", labelRu: "Средний", value: "medium" },
  { label: "Low", labelRu: "Низкий", value: "low" },
  { label: "Minimal", labelRu: "Минимальный", value: "minimal" },
  { label: "Off", labelRu: "Выкл.", value: "none" },
];

function normalizeFavoriteModelIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item && item !== "auto")
    .map(providerModelFavoriteId)
    .filter((item) => item.length <= 200);

  return [...new Set(ids)].slice(0, 50);
}

function readLocalFavorites(subjectId: string): string[] {
  try {
    const raw = localStorage.getItem(
      `sps.openrouter.modelFavorites.${subjectId}`,
    );
    return normalizeFavoriteModelIds(JSON.parse(raw || "[]"));
  } catch {
    return [];
  }
}

function writeLocalFavorites(subjectId: string, modelIds: string[]) {
  try {
    localStorage.setItem(
      `sps.openrouter.modelFavorites.${subjectId}`,
      JSON.stringify(modelIds),
    );
  } catch {
    // The favorites query remains usable when browser storage is disabled.
  }
}

const emptyModelGroups: IChatModelControls["modelGroups"] = [];
const emptyFavorites: string[] = [];

export function useChatModelControls(
  props: UseChatModelControlsProps,
): IChatModelControls | undefined {
  const {
    mode,
    catalogRevision,
    socialModuleChatId,
    socialModuleProfileId,
    socialModuleThread,
    socialModuleThreadId,
    subjectId,
  } = props;
  const enabled = Boolean(mode);
  const scope = `${subjectId}:${socialModuleChatId}:${socialModuleThreadId}`;
  const order = mode === "order";
  const persistedModelId =
    socialModuleThread.id === socialModuleThreadId
      ? parseRbacAiThreadPreferences(socialModuleThread.metadata)?.modelId ||
        "auto"
      : "auto";
  const [assistantOverride, setAssistantOverride] = useState<{
    scope: string;
    modelId: string;
  }>();
  const [orderSelection, setOrderSelection] = useState<IReasoningSelection>();
  const activeOrderSelection =
    orderSelection?.scope === scope ? orderSelection : undefined;
  const [assistantReasoning, setAssistantReasoning] =
    useState<IReasoningSelection>();
  const [localFavorites, setLocalFavorites] = useState<IFavoriteSnapshot>();
  const [optimisticFavorites, setOptimisticFavorites] =
    useState<IFavoriteSnapshot>();

  useEffect(() => {
    setAssistantOverride(undefined);
    setAssistantReasoning((current) =>
      current?.scope === scope && current.modelId === persistedModelId
        ? current
        : undefined,
    );
  }, [persistedModelId, scope]);

  useEffect(() => {
    setLocalFavorites({ subjectId, modelIds: readLocalFavorites(subjectId) });
  }, [subjectId]);

  const chatParams = {
    id: subjectId,
    socialModuleProfileId,
    socialModuleChatId,
  };
  const modelsQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind({
      ...chatParams,
      ...(order && { socialModuleThreadId, catalogRevision }),
      reactQueryOptions: { enabled },
    });
  const favoritesQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFind({
      ...chatParams,
      reactQueryOptions: { enabled },
    });
  const favoritesMutation =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdate(
      chatParams,
    );
  const threadUpdateMutation = api.socialModuleChatFindByIdThreadUpdate({
    id: subjectId,
    socialModuleChatId,
    socialModuleThreadId,
  });

  const serverFavorites = useMemo(() => {
    const ids = favoritesQuery.data?.favoriteModelIds;
    return ids === undefined ? undefined : normalizeFavoriteModelIds(ids);
  }, [favoritesQuery.data?.favoriteModelIds]);
  useEffect(() => {
    if (enabled && serverFavorites) {
      writeLocalFavorites(subjectId, serverFavorites);
    }
  }, [enabled, serverFavorites, subjectId]);
  const favoriteModelIds =
    optimisticFavorites?.subjectId === subjectId
      ? optimisticFavorites.modelIds
      : (serverFavorites ??
        (localFavorites?.subjectId === subjectId
          ? localFavorites.modelIds
          : emptyFavorites));

  const eligibleGroups = isChatAccessError(modelsQuery.error)
    ? undefined
    : modelsQuery.data?.groups;
  const modelGroups = useMemo(
    () =>
      eligibleGroups?.map((group) => ({
        ...group,
        models: group.models.map((model) => ({
          ...model,
          canonicalId: model.canonicalId ?? providerModelFavoriteId(model.id),
        })),
      })) ?? emptyModelGroups,
    [eligibleGroups],
  );
  const orderModelId = modelsQuery.data?.stageModelFixed
    ? "auto"
    : activeOrderSelection?.modelId || "auto";
  const selectedModelId = order
    ? orderModelId
    : assistantOverride?.scope === scope
      ? assistantOverride.modelId
      : persistedModelId;
  const selectedModel = useMemo(
    () =>
      modelGroups
        .flatMap((group) => group.models)
        .find((model) => model.id === selectedModelId),
    [modelGroups, selectedModelId],
  );
  const reasoningOptions = useMemo(
    () =>
      selectedModel?.reasoning
        ? reasoningChoices.filter(
            ({ value }) =>
              value === "auto" ||
              selectedModel.reasoning?.supportedEfforts.includes(value),
          )
        : [],
    [selectedModel],
  );
  const requestedEffort = order
    ? activeOrderSelection?.effort
    : assistantReasoning?.scope === scope &&
        assistantReasoning.modelId === selectedModelId
      ? assistantReasoning.effort
      : undefined;
  const selectedReasoning =
    reasoningOptions.find(({ value }) => value === requestedEffort)?.value ||
    "auto";

  const onFavoriteToggle = useCallback(
    (canonicalId: string) => {
      if (!enabled || favoritesMutation.isPending) return;
      const modelIds = favoriteModelIds.includes(canonicalId)
        ? favoriteModelIds.filter((favorite) => favorite !== canonicalId)
        : [canonicalId, ...favoriteModelIds].slice(0, 50);
      const snapshot = { subjectId, modelIds };
      const settle = () =>
        setOptimisticFavorites((current) =>
          current === snapshot ? undefined : current,
        );

      setOptimisticFavorites(snapshot);
      favoritesMutation.mutate(
        {
          id: subjectId,
          socialModuleProfileId,
          socialModuleChatId,
          data: { favoriteModelIds: modelIds },
        },
        {
          onSuccess() {
            writeLocalFavorites(subjectId, modelIds);
            setLocalFavorites(snapshot);
            settle();
          },
          onError: settle,
        },
      );
    },
    [
      enabled,
      favoriteModelIds,
      favoritesMutation,
      socialModuleChatId,
      socialModuleProfileId,
      subjectId,
    ],
  );

  const onModelChange = useCallback(
    (modelId: string) => {
      if (!enabled || modelId === selectedModelId) return;
      if (order) {
        setOrderSelection({ scope, modelId, effort: "auto" });
        return;
      }

      const selection = { scope, modelId };
      setAssistantOverride(selection);
      setAssistantReasoning(undefined);
      threadUpdateMutation.mutate(
        {
          id: subjectId,
          socialModuleChatId,
          socialModuleThreadId,
          data: { openRouterModelId: modelId },
        },
        {
          onError() {
            setAssistantOverride((current) =>
              current === selection ? undefined : current,
            );
          },
        },
      );
    },
    [
      enabled,
      order,
      scope,
      selectedModelId,
      socialModuleChatId,
      socialModuleThreadId,
      subjectId,
      threadUpdateMutation,
    ],
  );
  const onReasoningChange = useCallback(
    (effort: OpenRouterReasoningValue) => {
      if (!reasoningOptions.some(({ value }) => value === effort)) return;
      if (order) {
        setOrderSelection({ scope, modelId: selectedModelId, effort });
      } else {
        setAssistantReasoning({ scope, modelId: selectedModelId, effort });
      }
    },
    [order, reasoningOptions, scope, selectedModelId],
  );

  if (!mode) return undefined;
  const isSelectionUnavailable =
    order && selectedModelId !== "auto" && !selectedModel;
  const stageModel =
    order && !isChatAccessError(modelsQuery.error)
      ? modelsQuery.data
      : undefined;

  return {
    mode,
    fixedModelLabel: stageModel?.stageModelId
      ? providerModelDisplayName(stageModel.stageModelId)
      : undefined,
    fixedModelReasoning: reasoningChoices.find(
      ({ value }) => value === stageModel?.stageModelReasoning,
    ),
    favoriteModelIds,
    isLoadingModels: modelsQuery.isLoading,
    isSelectionUnavailable,
    isUpdatingFavorites: favoritesMutation.isPending,
    modelGroups,
    onFavoriteToggle,
    onModelChange,
    onReasoningChange,
    reasoningOptions,
    selectedModelId,
    selectedModelLabel: selectedModel?.name || selectedModelId,
    selectedReasoning,
  };
}
