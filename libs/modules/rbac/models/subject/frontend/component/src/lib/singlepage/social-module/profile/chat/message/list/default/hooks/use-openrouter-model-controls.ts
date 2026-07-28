"use client";

import {
  OpenRouterChatModelGroup,
  OpenRouterChatModelOption,
  OpenRouterReasoningOption,
  OpenRouterReasoningValue,
} from "../types";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { parseRbacAiThreadPreferences } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as SocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseOpenRouterModelControlsProps {
  enabled: boolean;
  socialModuleChatId: string;
  socialModuleProfileId: string;
  socialModuleThread: SocialModuleThread;
  socialModuleThreadId: string;
  subjectId: string;
}

export const openRouterReasoningOptions: OpenRouterReasoningOption[] = [
  {
    label: "Auto",
    value: "auto",
  },
  {
    label: "Maximum",
    value: "max",
  },
  {
    label: "Extra High",
    value: "xhigh",
  },
  {
    label: "High",
    value: "high",
  },
  {
    label: "Medium",
    value: "medium",
  },
  {
    label: "Low",
    value: "low",
  },
  {
    label: "Minimal",
    value: "minimal",
  },
  {
    label: "Off",
    value: "none",
  },
];

function getFavoriteModelsStorageKey(subjectId: string) {
  return `sps.openrouter.modelFavorites.${subjectId}`;
}

function normalizeFavoriteModelIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => {
          return typeof item === "string" ? item.trim() : "";
        })
        .filter((item) => {
          return item && item !== "auto" && item.length <= 200;
        }),
    ),
  ).slice(0, 50);
}

function readLocalFavoriteModelIds(subjectId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      getFavoriteModelsStorageKey(subjectId),
    );

    return normalizeFavoriteModelIds(JSON.parse(rawValue || "[]"));
  } catch {
    return [];
  }
}

function writeLocalFavoriteModelIds(subjectId: string, modelIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getFavoriteModelsStorageKey(subjectId),
      JSON.stringify(normalizeFavoriteModelIds(modelIds)),
    );
  } catch {
    return;
  }
}

export function useOpenRouterModelControls(
  props: UseOpenRouterModelControlsProps,
) {
  const [selectedModelId, setSelectedModelId] = useState("auto");
  const [selectedReasoning, setSelectedReasoning] =
    useState<OpenRouterReasoningValue>("auto");
  const [favoriteModelIds, setFavoriteModelIds] = useState<string[]>([]);
  const persistedModelId =
    parseRbacAiThreadPreferences(props.socialModuleThread.metadata)?.modelId ||
    "auto";

  // The shell stays mounted across threads. Restore the model owned by the
  // active thread instead of leaking another thread's choice or resetting a
  // persisted explicit selection after a page reload.
  useEffect(() => {
    setSelectedModelId(persistedModelId);
    setSelectedReasoning("auto");
  }, [persistedModelId, props.socialModuleChatId, props.socialModuleThreadId]);

  useEffect(() => {
    setFavoriteModelIds(readLocalFavoriteModelIds(props.subjectId));
  }, [props.subjectId]);

  const modelsQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      reactQueryOptions: {
        enabled: props.enabled,
      },
    });
  const favoritesQuery =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteFind({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
      reactQueryOptions: {
        enabled: props.enabled,
      },
    });
  const favoritesMutation =
    api.socialModuleProfileFindByIdChatFindByIdOpenrouterModelFavoriteUpdate({
      id: props.subjectId,
      socialModuleProfileId: props.socialModuleProfileId,
      socialModuleChatId: props.socialModuleChatId,
    });
  const threadUpdateMutation = api.socialModuleChatFindByIdThreadUpdate({
    id: props.subjectId,
    socialModuleChatId: props.socialModuleChatId,
    socialModuleThreadId: props.socialModuleThreadId,
  });
  const modelGroups = useMemo<OpenRouterChatModelGroup[]>(() => {
    return (modelsQuery.data?.groups || []) as OpenRouterChatModelGroup[];
  }, [modelsQuery.data?.groups]);
  const selectedModel = useMemo<OpenRouterChatModelOption | null>(() => {
    if (selectedModelId === "auto") {
      return null;
    }

    for (const group of modelGroups) {
      const model = group.models.find((item) => item.id === selectedModelId);

      if (model) {
        return model;
      }
    }

    return null;
  }, [modelGroups, selectedModelId]);
  const selectedModelLabel =
    selectedModelId === "auto"
      ? "Auto"
      : selectedModel?.name || selectedModelId;
  const reasoningOptions = useMemo<OpenRouterReasoningOption[]>(() => {
    if (!selectedModel?.reasoning) {
      return [];
    }

    const supportedEfforts = new Set(selectedModel.reasoning.supportedEfforts);

    return openRouterReasoningOptions.filter((option) => {
      return option.value === "auto" || supportedEfforts.has(option.value);
    });
  }, [selectedModel]);
  const canSelectReasoning = reasoningOptions.length > 1;
  const selectedReasoningIsAvailable = reasoningOptions.some((option) => {
    return option.value === selectedReasoning;
  });
  const effectiveSelectedReasoning: OpenRouterReasoningValue =
    canSelectReasoning && selectedReasoningIsAvailable
      ? selectedReasoning
      : "auto";
  const selectedReasoningLabel =
    reasoningOptions.find((item) => {
      return item.value === effectiveSelectedReasoning;
    })?.label || "Auto";
  const favoriteModelIdSet = useMemo(() => {
    return new Set(favoriteModelIds);
  }, [favoriteModelIds]);
  const persistFavoriteModelIds = useCallback(
    (modelIds: string[]) => {
      const normalizedModelIds = normalizeFavoriteModelIds(modelIds);

      setFavoriteModelIds(normalizedModelIds);
      writeLocalFavoriteModelIds(props.subjectId, normalizedModelIds);

      if (!props.enabled) {
        return;
      }

      favoritesMutation.mutate({
        id: props.subjectId,
        socialModuleProfileId: props.socialModuleProfileId,
        socialModuleChatId: props.socialModuleChatId,
        data: {
          favoriteModelIds: normalizedModelIds,
        },
      });
    },
    [
      favoritesMutation,
      props.enabled,
      props.socialModuleChatId,
      props.socialModuleProfileId,
      props.subjectId,
    ],
  );
  const toggleFavoriteModelId = useCallback(
    (modelId: string) => {
      if (!modelId || modelId === "auto") {
        return;
      }

      const nextFavoriteModelIds = favoriteModelIdSet.has(modelId)
        ? favoriteModelIds.filter((favoriteModelId) => {
            return favoriteModelId !== modelId;
          })
        : [...favoriteModelIds, modelId];

      persistFavoriteModelIds(nextFavoriteModelIds);
    },
    [favoriteModelIdSet, favoriteModelIds, persistFavoriteModelIds],
  );
  const persistSelectedModelId = useCallback(
    (modelId: string) => {
      const normalizedModelId = modelId.trim() || "auto";

      setSelectedModelId(normalizedModelId);

      if (!props.enabled) {
        return;
      }

      threadUpdateMutation.mutate(
        {
          id: props.subjectId,
          socialModuleChatId: props.socialModuleChatId,
          socialModuleThreadId: props.socialModuleThreadId,
          data: {
            openRouterModelId: normalizedModelId,
          },
        },
        {
          onError() {
            setSelectedModelId(persistedModelId);
          },
        },
      );
    },
    [
      persistedModelId,
      props.enabled,
      props.socialModuleChatId,
      props.socialModuleThreadId,
      props.subjectId,
      threadUpdateMutation,
    ],
  );

  useEffect(() => {
    const kvFavoriteModelIds = normalizeFavoriteModelIds(
      favoritesQuery.data?.favoriteModelIds,
    );

    if (!kvFavoriteModelIds.length) {
      return;
    }

    setFavoriteModelIds(kvFavoriteModelIds);
    writeLocalFavoriteModelIds(props.subjectId, kvFavoriteModelIds);
  }, [favoritesQuery.data?.favoriteModelIds, props.subjectId]);

  useEffect(() => {
    if (selectedReasoningIsAvailable || selectedReasoning === "auto") {
      return;
    }

    setSelectedReasoning("auto");
  }, [selectedReasoning, selectedReasoningIsAvailable]);

  return {
    canSelectReasoning,
    favoriteModelIds,
    favoriteModelIdSet,
    favoritesQuery,
    isLoadingModels: modelsQuery.isLoading,
    isUpdatingFavoriteModels: favoritesMutation.isPending,
    modelGroups,
    modelsQuery,
    reasoningOptions,
    selectedModel,
    selectedModelId,
    selectedModelLabel,
    selectedReasoning: effectiveSelectedReasoning,
    selectedReasoningLabel,
    setSelectedModelId: persistSelectedModelId,
    setSelectedReasoning,
    toggleFavoriteModelId,
  };
}
